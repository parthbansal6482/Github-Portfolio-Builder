// GitHub data fetcher — REST + GraphQL in parallel
// Fetches profile, repos, pinned repos, languages, and contribution data

import type {
  GitHubData,
  PinnedRepo,
  Repo,
  LanguageBreakdown,
  ActiveRepo,
  CommitPatterns,
} from '../types/index.js';


// ============================================
// Types
// ============================================

interface GitHubFetchResult {
  success: true;
  data: GitHubData;
}

interface GitHubFetchError {
  success: false;
  error: string;
  code: 'GITHUB_API_ERROR' | 'GITHUB_RATE_LIMITED' | 'GITHUB_USER_NOT_FOUND' | 'UNKNOWN_ERROR';
}

type FetchResult = GitHubFetchResult | GitHubFetchError;

// ============================================
// REST API fetcher
// ============================================

interface RestProfile {
  name: string | null;
  bio: string | null;
  avatar_url: string;
  location: string | null;
  company: string | null;
  blog: string | null;
  followers: number;
  public_repos: number;
  login: string;
}

interface RestRepo {
  name: string;
  description: string | null;
  html_url: string;
  homepage: string | null;
  stargazers_count: number;
  forks_count: number;
  language: string | null;
  topics: string[];
  pushed_at: string;
  archived: boolean;
  fork: boolean;
}

async function fetchRestData(
  username: string,
  token: string
): Promise<{ profile: RestProfile; repos: RestRepo[] } | null> {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'GitFolio',
  };

  const [profileRes, reposRes] = await Promise.all([
    fetch(`https://api.github.com/users/${username}`, { headers }),
    fetch(`https://api.github.com/users/${username}/repos?per_page=100&sort=pushed&type=owner`, { headers }),
  ]);

  if (!profileRes.ok || !reposRes.ok) {
    return null;
  }

  const profile = (await profileRes.json()) as RestProfile;
  const repos = (await reposRes.json()) as RestRepo[];

  return { profile, repos };
}

// ============================================
// GraphQL API fetcher — pinned repos + contributions
// ============================================

const GRAPHQL_QUERY = `
query($username: String!) {
  user(login: $username) {
    pinnedItems(first: 6, types: REPOSITORY) {
      nodes {
        ... on Repository {
          name
          description
          url
          homepageUrl
          stargazerCount
          forkCount
          primaryLanguage {
            name
          }
          repositoryTopics(first: 10) {
            nodes {
              topic {
                name
              }
            }
          }
        }
      }
    }
    contributionsCollection {
      contributionCalendar {
        totalContributions
      }
    }
  }
}
`;

interface GraphQLPinnedNode {
  name: string;
  description: string | null;
  url: string;
  homepageUrl: string | null;
  stargazerCount: number;
  forkCount: number;
  primaryLanguage: { name: string } | null;
  repositoryTopics: {
    nodes: Array<{ topic: { name: string } }>;
  };
}

interface GraphQLResponse {
  data?: {
    user?: {
      pinnedItems: {
        nodes: GraphQLPinnedNode[];
      };
      contributionsCollection: {
        contributionCalendar: {
          totalContributions: number;
        };
      };
    };
  };
  errors?: Array<{ message: string }>;
}

async function fetchGraphQLData(
  username: string,
  token: string
): Promise<{
  pinnedRepos: PinnedRepo[];
  totalContributions: number;
} | null> {
  const response = await fetch('https://api.github.com/graphql', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      'User-Agent': 'GitFolio',
    },
    body: JSON.stringify({
      query: GRAPHQL_QUERY,
      variables: { username },
    }),
  });

  if (!response.ok) {
    return null;
  }

  const result = (await response.json()) as GraphQLResponse;

  if (result.errors || !result.data?.user) {
    return null;
  }

  const user = result.data.user;

  const pinnedRepos: PinnedRepo[] = user.pinnedItems.nodes.map((node) => ({
    name: node.name,
    description: node.description,
    url: node.url,
    homepageUrl: node.homepageUrl,
    stargazerCount: node.stargazerCount,
    forkCount: node.forkCount,
    primaryLanguage: node.primaryLanguage?.name || null,
    topics: node.repositoryTopics.nodes.map((t) => t.topic.name),
  }));

  const totalContributions =
    user.contributionsCollection.contributionCalendar.totalContributions;

  return { pinnedRepos, totalContributions };
}

// ============================================
// Recency-weighted language scoring
// ============================================

function computeTopLanguages(repos: RestRepo[], maxCount: number = 6): string[] {
  const now = Date.now();
  const THREE_MONTHS = 90 * 24 * 60 * 60 * 1000;
  const TWELVE_MONTHS = 365 * 24 * 60 * 60 * 1000;

  const scores: Record<string, number> = {};

  for (const repo of repos) {
    if (!repo.language || repo.fork || repo.archived) continue;

    const pushedAt = new Date(repo.pushed_at).getTime();
    const age = now - pushedAt;

    // Recency weight: full (< 3 months), 0.6 (3-12 months), 0.2 (> 12 months)
    let weight: number;
    if (age < THREE_MONTHS) {
      weight = 1.0;
    } else if (age < TWELVE_MONTHS) {
      weight = 0.6;
    } else {
      weight = 0.2;
    }

    // Bonus weight for stars
    const starBonus = Math.min(repo.stargazers_count * 0.1, 2.0);

    scores[repo.language] = (scores[repo.language] || 0) + weight + starBonus;
  }

  return Object.entries(scores)
    .sort(([, a], [, b]) => b - a)
    .slice(0, maxCount)
    .map(([lang]) => lang);
}

// ============================================
// Fallback: top repos by stars (when no pinned repos)
// ============================================

function getTopReposByStars(repos: RestRepo[], count: number = 3): PinnedRepo[] {
  return repos
    .filter((r) => !r.fork && !r.archived)
    .sort((a, b) => b.stargazers_count - a.stargazers_count)
    .slice(0, count)
    .map((repo) => ({
      name: repo.name,
      description: repo.description,
      url: repo.html_url,
      homepageUrl: repo.homepage,
      stargazerCount: repo.stargazers_count,
      forkCount: repo.forks_count,
      primaryLanguage: repo.language,
      topics: repo.topics || [],
    }));
}

// ============================================
// Main fetcher — public API
// ============================================

export async function fetchGitHubData(
  username: string,
  token: string
): Promise<FetchResult> {
  try {
    // Fire REST and GraphQL calls in parallel
    const [restResult, graphqlResult] = await Promise.all([
      fetchRestData(username, token),
      fetchGraphQLData(username, token),
    ]);

    // If REST failed, we can't proceed (profile data is essential)
    if (!restResult) {
      return {
        success: false,
        error: `Failed to fetch GitHub data for user "${username}". The GitHub API may be unavailable or the token may be invalid.`,
        code: 'GITHUB_API_ERROR',
      };
    }

    const { profile, repos } = restResult;

    // Transform REST repos to our Repo type
    const allRepos: Repo[] = repos.map((repo) => ({
      name: repo.name,
      description: repo.description,
      url: repo.html_url,
      homepageUrl: repo.homepage,
      stargazerCount: repo.stargazers_count,
      forkCount: repo.forks_count,
      primaryLanguage: repo.language,
      topics: repo.topics || [],
      pushedAt: repo.pushed_at,
      isArchived: repo.archived,
      isFork: repo.fork,
    }));

    // Use GraphQL pinned repos, or fall back to top repos by stars
    let pinnedRepos: PinnedRepo[];
    if (graphqlResult?.pinnedRepos && graphqlResult.pinnedRepos.length > 0) {
      pinnedRepos = graphqlResult.pinnedRepos;
    } else {
      pinnedRepos = getTopReposByStars(repos);
    }

    // Compute recency-weighted top languages
    const topLanguages = computeTopLanguages(repos);

    // Contributions from GraphQL, or 0 if unavailable
    const totalLastYear = graphqlResult?.totalContributions || 0;

    const githubData: GitHubData = {
      profile: {
        name: profile.name || profile.login,
        bio: profile.bio || '',
        avatar: profile.avatar_url,
        location: profile.location,
        company: profile.company,
        blog: profile.blog,
        followers: profile.followers,
        publicRepos: profile.public_repos,
      },
      pinnedRepos,
      allRepos,
      topLanguages,
      contributions: {
        totalLastYear,
      },
    };

    return { success: true, data: githubData };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return {
      success: false,
      error: `GitHub data fetch failed: ${message}`,
      code: 'UNKNOWN_ERROR',
    };
  }
}

// Re-export for consumers
export type { FetchResult, GitHubFetchResult, GitHubFetchError };

// ============================================
// Enriched GitHub Data Fetchers
// These are called by POST /api/github/fetch-enriched
// ============================================

/**
 * Fetches language byte counts for each repo in parallel (limited to top 8 by star count)
 * and returns a LanguageBreakdown where each value is a rounded percentage of total bytes.
 *
 * Why: GitHub's /repos endpoint only returns the primary language. The
 * /languages endpoint returns precise byte counts for ALL languages in a repo,
 * allowing us to build an accurate language percentage map.
 *
 * @param repos - The list of all the user's repos (pre-fetched).
 * @param username - GitHub username (used for request headers).
 * @param token - GitHub OAuth access token for authenticated requests.
 * @returns LanguageBreakdown where all values sum to 100. Returns {} on total failure.
 * @throws Never — individual repo failures are caught and skipped (partial data returned).
 *
 * FRONTEND NOTE: Values are percentages (0–100). Keys are language names e.g. "TypeScript".
 * The returned object may have 1–many entries depending on what GitHub returns.
 */
export async function fetchLanguageBreakdown(
  repos: Repo[],
  username: string,
  token: string
): Promise<LanguageBreakdown> {
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'GitFolio',
  };

  // Take top 8 repos by star count that are not forks or archived
  const topRepos = [...repos]
    .filter((r) => !r.isFork && !r.isArchived)
    .sort((a, b) => b.stargazerCount - a.stargazerCount)
    .slice(0, 8);

  // Fetch language bytes for all repos in parallel — skip failures
  const languageResults = await Promise.allSettled(
    topRepos.map(async (repo) => {
      const res = await fetch(
        `https://api.github.com/repos/${username}/${repo.name}/languages`,
        { headers: authHeaders }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${repo.name}`);
      return (await res.json()) as Record<string, number>;
    })
  );

  // Aggregate byte totals across all repos
  const totals: Record<string, number> = {};
  let grandTotal = 0;

  for (const result of languageResults) {
    if (result.status === 'rejected') {
      // Log but continue — one failed repo shouldn't break the whole breakdown
      console.warn('[fetchLanguageBreakdown] Repo language fetch failed:', result.reason);
      continue;
    }
    for (const [lang, bytes] of Object.entries(result.value)) {
      totals[lang] = (totals[lang] || 0) + bytes;
      grandTotal += bytes;
    }
  }

  if (grandTotal === 0) return {};

  // Convert raw byte counts to rounded percentages
  const breakdown: LanguageBreakdown = {};
  for (const [lang, bytes] of Object.entries(totals)) {
    breakdown[lang] = Math.round((bytes / grandTotal) * 100);
  }

  return breakdown;
}

/**
 * Fetches commit counts for the top 6 repos by star count, counting only commits
 * made by the authenticated user in the last 12 months.
 *
 * Why: The GitHub REST API doesn't return per-repo commit counts for a user directly.
 * We individually query each repo's commit list filtered by author and date window.
 *
 * @param repos - The list of all the user's repos.
 * @param username - GitHub username (used as the commit author filter).
 * @param token - GitHub OAuth access token.
 * @returns ActiveRepo[] sorted by commitCount descending. Array length ≤ 6.
 * @throws Never — individual repo failures log and continue with count 0.
 *
 * FRONTEND NOTE: Repos with 0 commits in the last year are omitted from the returned array.
 * Maximum 6 repos returned, sorted by commitCount descending.
 */
export async function fetchMostActiveRepos(
  repos: Repo[],
  username: string,
  token: string
): Promise<ActiveRepo[]> {
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'GitFolio',
  };

  // One year ago from today in ISO 8601 format (GitHub API 'since' param)
  const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString();

  // Take top 6 non-fork, non-archived repos by star count
  const topRepos = [...repos]
    .filter((r) => !r.isFork && !r.isArchived)
    .sort((a, b) => b.stargazerCount - a.stargazerCount)
    .slice(0, 6);

  // Fetch commit counts for each repo in parallel, with pagination limited to first page
  const results = await Promise.allSettled(
    topRepos.map(async (repo) => {
      // per_page=100 fetches the max per page. The count of returned items is the commit count.
      const res = await fetch(
        `https://api.github.com/repos/${username}/${repo.name}/commits?author=${username}&since=${oneYearAgo}&per_page=100`,
        { headers: authHeaders }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${repo.name}`);
      const commits = await res.json() as unknown[];
      return { repo, commitCount: commits.length };
    })
  );

  const activeRepos: ActiveRepo[] = [];
  for (const result of results) {
    if (result.status === 'rejected') {
      console.warn('[fetchMostActiveRepos] Failed to fetch commits for a repo:', result.reason);
      continue;
    }
    if (result.value.commitCount > 0) {
      activeRepos.push({
        name: result.value.repo.name,
        commitCount: result.value.commitCount,
        url: result.value.repo.url,
      });
    }
  }

  // Sort by commit count descending
  return activeRepos.sort((a, b) => b.commitCount - a.commitCount);
}

/**
 * Fetches the last 100 commits from each of the top 3 repos by star count,
 * then builds day-of-week and hour-of-day frequency matrices from the commit timestamps.
 *
 * Why: Commit timestamps reveal working patterns (e.g. "weekday evenings (UTC)") that
 * are a useful signal for the portfolio's "About Me" section.
 *
 * @param repos - The list of all the user's repos.
 * @param username - GitHub username (used as commit author filter).
 * @param token - GitHub OAuth access token.
 * @returns CommitPatterns with day/hour matrices, peak values, and a human-readable summary.
 * @throws Never — failures produce default zero-filled matrices.
 *
 * FRONTEND NOTE: All timestamps are in UTC. byHourOfDay keys are strings "0"–"23".
 * byDayOfWeek keys are "Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat".
 * If no commits were fetched, all counts will be 0 and summary will be "Insufficient data".
 */
export async function fetchCommitPatterns(
  repos: Repo[],
  username: string,
  token: string
): Promise<CommitPatterns> {
  const authHeaders = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github.v3+json',
    'User-Agent': 'GitFolio',
  };

  // Take top 3 repos by star count
  const topRepos = [...repos]
    .filter((r) => !r.isFork && !r.isArchived)
    .sort((a, b) => b.stargazerCount - a.stargazerCount)
    .slice(0, 3);

  // Shape expected from GitHub commits list endpoint
  interface GHCommit {
    commit: { author: { date: string } | null };
  }

  // Fetch last 100 commits from each repo in parallel
  const results = await Promise.allSettled(
    topRepos.map(async (repo) => {
      const res = await fetch(
        `https://api.github.com/repos/${username}/${repo.name}/commits?author=${username}&per_page=100`,
        { headers: authHeaders }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status} for ${repo.name}`);
      return (await res.json()) as GHCommit[];
    })
  );

  // Initialise accumulators
  const dayNames: CommitPatterns['byDayOfWeek'] = { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 };
  const hourMap: Record<string, number> = {};
  for (let h = 0; h < 24; h++) hourMap[String(h)] = 0;

  let totalCommits = 0;

  // Walk all commit timestamps and populate matrices
  for (const result of results) {
    if (result.status === 'rejected') {
      console.warn('[fetchCommitPatterns] Failed to fetch commits:', result.reason);
      continue;
    }
    for (const commit of result.value) {
      const dateStr = commit.commit?.author?.date;
      if (!dateStr) continue;
      const date = new Date(dateStr);
      const dayKey = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getUTCDay()] as keyof typeof dayNames;
      const hourKey = String(date.getUTCHours());
      dayNames[dayKey]++;
      hourMap[hourKey]++;
      totalCommits++;
    }
  }

  if (totalCommits === 0) {
    return {
      byDayOfWeek: dayNames,
      byHourOfDay: hourMap,
      peakDay: 'Unknown',
      peakHour: 0,
      summary: 'Insufficient commit data to determine patterns.',
    };
  }

  // Find peak day
  const peakDay = (Object.entries(dayNames) as [string, number][])
    .sort(([, a], [, b]) => b - a)[0][0];

  // Find peak hour
  const peakHour = Number(
    (Object.entries(hourMap) as [string, number][])
      .sort(([, a], [, b]) => b - a)[0][0]
  );

  // Build human-readable summary without AI (pure arithmetic)
  const timeOfDayLabel =
    peakHour < 6 ? 'late nights' :
    peakHour < 12 ? 'mornings' :
    peakHour < 17 ? 'afternoons' :
    peakHour < 21 ? 'evenings' : 'nights';

  const summary = `Primarily commits on ${peakDay}s during ${timeOfDayLabel} (UTC).`;

  return {
    byDayOfWeek: dayNames,
    byHourOfDay: hourMap,
    peakDay,
    peakHour,
    summary,
  };
}

/**
 * Fetches the count and repo list of PRs merged by the user in repositories they do not own,
 * using the GitHub GraphQL search API.
 *
 * Why: External contributions (PRs to other people's repos) are a strong signal of
 * open-source engagement and collaborative skill.
 *
 * @param username - GitHub username to search for.
 * @param token - GitHub OAuth access token.
 * @returns Object with externalPRsMerged count and externalReposContributed list.
 * @throws Never — returns { count: 0, repos: [] } on failure.
 *
 * FRONTEND NOTE: externalReposContributed contains "owner/repo" formatted strings.
 * externalPRsMerged is a total count (may be higher than the length of the repos array
 * because a user can submit multiple PRs to the same external repo).
 */
export async function fetchExternalPRs(
  username: string,
  token: string
): Promise<{ externalPRsMerged: number; externalReposContributed: string[] }> {
  // GraphQL query – searches for merged PRs authored by user in repos they don't own
  const query = `
    query($searchQuery: String!) {
      search(query: $searchQuery, type: ISSUE, first: 100) {
        issueCount
        nodes {
          ... on PullRequest {
            repository {
              nameWithOwner
            }
          }
        }
      }
    }
  `;

  try {
    const res = await fetch('https://api.github.com/graphql', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        'User-Agent': 'GitFolio',
      },
      body: JSON.stringify({
        query,
        variables: { searchQuery: `is:pr is:merged author:${username} -user:${username}` },
      }),
    });

    if (!res.ok) throw new Error(`HTTP ${res.status}`);

    const result = await res.json() as {
      data?: {
        search?: {
          issueCount: number;
          nodes: Array<{ repository?: { nameWithOwner: string } }>;
        };
      };
    };

    const search = result?.data?.search;
    if (!search) return { externalPRsMerged: 0, externalReposContributed: [] };

    // Deduplicate repos contributed to
    const repoSet = new Set<string>();
    for (const node of search.nodes) {
      if (node.repository?.nameWithOwner) {
        repoSet.add(node.repository.nameWithOwner);
      }
    }

    return {
      externalPRsMerged: search.issueCount,
      externalReposContributed: [...repoSet],
    };
  } catch (error) {
    console.warn('[fetchExternalPRs] Failed:', error instanceof Error ? error.message : error);
    return { externalPRsMerged: 0, externalReposContributed: [] };
  }
}

/**
 * Fetches all forked repos for the user, including source repo info.
 * Used by the AI to categorise the user's interests based on what they've forked.
 *
 * Why: Forks reveal intent to use or study something, even if the user never commits to the fork.
 * AI can categorise these into interest clusters (e.g. "AI/ML Exploration").
 *
 * @param username - GitHub username.
 * @param token - GitHub OAuth access token.
 * @returns Array of fork info objects with name, description, and topics.
 * @throws Never — returns [] on failure.
 *
 * FRONTEND NOTE: This raw list is used by the AI to generate forkInterests.
 * It is NOT included directly in the EnrichedGitHubData response — only the AI-generated
 * ForkInterest[] is returned. This is an internal data collection step.
 */
export async function fetchForkList(
  username: string,
  token: string
): Promise<Array<{ name: string; description: string | null; topics: string[] }>> {
  try {
    const res = await fetch(
      `https://api.github.com/users/${username}/repos?type=forks&per_page=100`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'GitFolio',
        },
      }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const forks = await res.json() as Array<{
      name: string;
      description: string | null;
      topics: string[];
    }>;
    return forks.map((f) => ({
      name: f.name,
      description: f.description,
      topics: f.topics || [],
    }));
  } catch (error) {
    console.warn('[fetchForkList] Failed:', error instanceof Error ? error.message : error);
    return [];
  }
}

/**
 * Calculates working style scores from existing GitHub data using pure arithmetic.
 * No API calls and no AI — this is deterministic math.
 *
 * --- EXPLORATION vs EXECUTION SCORE (0–100) ---
 * High score (exploration): Many forks + many small repos + diverse languages.
 * Low score (execution): Few repos + high commit concentration + narrow language set.
 *
 * Formula:
 *   forkRatio       = forkedRepos / totalRepos         (0–1)
 *   smallRepoRatio  = repos with 0 stars / totalRepos  (0–1)
 *   languageDiversity = distinctLanguages / 10         (capped at 1)
 *   rawScore        = (forkRatio * 40) + (smallRepoRatio * 30) + (languageDiversity * 30)
 *   explorationScore = round(rawScore * 100) clamped to 0–100
 *
 * --- NARROW vs BROAD SCOPE SCORE (0–100) ---
 * Count distinct primary languages + distinct repo topic tags across all repos.
 * More variety = higher score.
 *
 * Formula:
 *   distinctLanguages = unique non-null primaryLanguage values
 *   distinctTopics    = unique topic strings across all repos
 *   rawBreadth        = (distinctLanguages / 10) * 50 + (distinctTopics / 30) * 50
 *   breadthScore      = round(rawBreadth) clamped to 0–100
 *
 * @param githubData - The user's existing GitHubData (already fetched).
 * @returns Object with explorationScore and breadthScore (0–100 each). No summary yet.
 *
 * FRONTEND NOTE: These two numbers are inputs to the AI working style summary call.
 * They are included in workingStyle alongside the AI-written summary string.
 */
export function calculateWorkingStyle(
  githubData: GitHubData
): { explorationScore: number; breadthScore: number } {
  const repos = githubData.allRepos;
  const totalRepos = repos.length;

  if (totalRepos === 0) {
    return { explorationScore: 50, breadthScore: 0 };
  }

  const forkedRepos = repos.filter((r) => r.isFork).length;
  const smallRepos = repos.filter((r) => r.stargazerCount === 0).length;
  const distinctLanguages = new Set(repos.map((r) => r.primaryLanguage).filter(Boolean)).size;

  // Exploration score
  const forkRatio = forkedRepos / totalRepos;
  const smallRepoRatio = smallRepos / totalRepos;
  const languageDiversity = Math.min(distinctLanguages / 10, 1);
  const rawExploration = (forkRatio * 40) + (smallRepoRatio * 30) + (languageDiversity * 30);
  const explorationScore = Math.min(100, Math.max(0, Math.round(rawExploration)));

  // Breadth score
  const distinctTopics = new Set(repos.flatMap((r) => r.topics)).size;
  const rawBreadth = (Math.min(distinctLanguages / 10, 1) * 50) + (Math.min(distinctTopics / 30, 1) * 50);
  const breadthScore = Math.min(100, Math.max(0, Math.round(rawBreadth)));

  return { explorationScore, breadthScore };
}

// ============================================
// Main Enrichment Orchestrator — Task 10
// ============================================

// These imports are at the bottom to avoid circular dependencies — the LLM
// module imports from types, and types imports nothing from github.
import { generateSkillClusters, generateForkInterests, generateWorkingStyleSummary } from './llm/index.js';
import { analyseRepoCommitQuality, aggregateCommitQuality } from './commitQuality.js';
import type { EnrichedGitHubData } from '../types/index.js';

/**
 * Fetches and assembles the full EnrichedGitHubData payload for a user.
 * This is the main orchestrator — it coordinates all GitHub API fetches and AI calls.
 *
 * WHY IT EXISTS: The enrichment process requires many parallel API calls followed by
 * AI analysis. This function manages the two-batch fetch strategy and graceful
 * partial failure handling so callers don't need to know the internals.
 *
 * --- FETCH STRATEGY ---
 * Batch 1 (no dependencies — runs immediately, in parallel):
 *   - External PRs merged (GraphQL)
 *   - Fork list (REST)
 *
 * Batch 2 (requires repo list from existing githubData, also in parallel):
 *   - Language byte breakdown (REST, top 8 repos)
 *   - Most active repos by commit count (REST, top 6 repos)
 *   - Commit patterns (REST, top 3 repos)
 *
 * Batch 1 and Batch 2 run simultaneously because githubData is already available.
 *
 * After both batches resolve:
 *   - Working style scores (pure arithmetic)
 *   - AI calls run in parallel: skill clusters, fork interests, working style summary
 *
 * @param githubData - The user's existing GitHubData (pre-fetched by fetchGitHubData).
 * @param username - GitHub username of the authenticated user.
 * @param token - GitHub OAuth access token (user's personal access token from NextAuth).
 * @returns Complete EnrichedGitHubData. Partial data is returned if some fetches fail.
 * @throws Never — partial failures are caught, logged, and reflected as empty defaults.
 *
 * FRONTEND NOTE: This function takes 3–8 seconds. The route handler wrapping this
 * should reflect the duration in its response handling. Do not call this on every
 * page load — call it once on demand and cache the result in the database.
 */
export async function fetchEnrichedGitHubData(
  githubData: GitHubData,
  username: string,
  token: string
): Promise<EnrichedGitHubData> {
  const repos = githubData.allRepos;

  // ---------------------------------------------------------------
  // Run Batch 1 (no repo dependency) and Batch 2 (uses repo list)
  // in parallel since we already have the repo list from githubData.
  // ---------------------------------------------------------------
  const [
    batch1Results,
    batch2Results,
  ] = await Promise.all([
    // BATCH 1: Independent fetches — no repo list needed
    Promise.allSettled([
      fetchExternalPRs(username, token),
      fetchForkList(username, token),
    ]),
    // BATCH 2: Uses repos from existing githubData
    Promise.allSettled([
      fetchLanguageBreakdown(repos, username, token),
      fetchMostActiveRepos(repos, username, token),
      fetchCommitPatterns(repos, username, token),
    ]),
  ]);

  // --- Extract Batch 1 results with fallbacks ---
  const [externalPRsResult, forkListResult] = batch1Results;
  const externalPRsData = externalPRsResult.status === 'fulfilled'
    ? externalPRsResult.value
    : { externalPRsMerged: 0, externalReposContributed: [] };
  if (externalPRsResult.status === 'rejected') {
    console.warn('[fetchEnrichedGitHubData] External PRs fetch failed:', externalPRsResult.reason);
  }

  const forks = forkListResult.status === 'fulfilled' ? forkListResult.value : [];
  if (forkListResult.status === 'rejected') {
    console.warn('[fetchEnrichedGitHubData] Fork list fetch failed:', forkListResult.reason);
  }

  // --- Extract Batch 2 results with fallbacks ---
  const [langResult, activeReposResult, commitPatternsResult] = batch2Results;
  const languageBreakdown: EnrichedGitHubData['languageBreakdown'] =
    langResult.status === 'fulfilled' ? langResult.value : {};
  if (langResult.status === 'rejected') {
    console.warn('[fetchEnrichedGitHubData] Language breakdown fetch failed:', langResult.reason);
  }

  const mostActiveRepos =
    activeReposResult.status === 'fulfilled' ? activeReposResult.value : [];
  if (activeReposResult.status === 'rejected') {
    console.warn('[fetchEnrichedGitHubData] Active repos fetch failed:', activeReposResult.reason);
  }

  const commitPatterns: EnrichedGitHubData['commitPatterns'] =
    commitPatternsResult.status === 'fulfilled'
      ? commitPatternsResult.value
      : {
          byDayOfWeek: { Sun: 0, Mon: 0, Tue: 0, Wed: 0, Thu: 0, Fri: 0, Sat: 0 },
          byHourOfDay: Object.fromEntries(Array.from({ length: 24 }, (_, i) => [String(i), 0])),
          peakDay: 'Unknown',
          peakHour: 0,
          summary: 'Commit pattern data unavailable.',
        };
  if (commitPatternsResult.status === 'rejected') {
    console.warn('[fetchEnrichedGitHubData] Commit patterns fetch failed:', commitPatternsResult.reason);
  }

  // --- Calculate working style scores (pure arithmetic, no API call) ---
  const { explorationScore, breadthScore } = calculateWorkingStyle(githubData);

  // Partial enriched data to pass to AI calls for richer context
  const enrichedPartial: Partial<EnrichedGitHubData> = {
    languageBreakdown,
    mostActiveRepos,
    commitPatterns,
  };

  // ---------------------------------------------------------------
  // BATCH 3 — Commit quality analysis
  // Runs after Batch 2 because it uses moistActiveRepos for sampling.
  // Top 3 repos by commit count are analyzed in parallel.
  // Each call is independent — individual failures return null (skipped).
  //
  // TIMING: This batch adds ~2–3 seconds to total response time because
  // it fetches up to 75 individual commit details (25 per repo × 3 repos)
  // and calls the AI message scorer once per repo in parallel with details.
  // ---------------------------------------------------------------
  const TOP_REPOS_FOR_QUALITY = 3;
  const reposToAnalyse = mostActiveRepos.slice(0, TOP_REPOS_FOR_QUALITY);

  // Consistency scoring uses the contribution calendar.
  // GitHubData only has totalLastYear (no daily breakdown), so we pass an empty
  // calendar here. The consistency dimension will return score=0 with a note
  // explaining the calendar is unavailable. A future enhancement could fetch
  // the daily calendar via GraphQL and add it to GitHubData.
  const calendar: Array<{ date: string; commitCount: number }> = [];

  // Run per-repo quality analysis in parallel — individual failures return null
  let commitQuality: EnrichedGitHubData['commitQuality'] = null;
  try {
    const repoQualityResults = await Promise.allSettled(
      reposToAnalyse.map((repo) =>
        analyseRepoCommitQuality(repo.name, username, token, username)
      )
    );

    // Extract results — rejected promises become null (treated as skipped repos)
    const repoResults = repoQualityResults.map((r) =>
      r.status === 'fulfilled' ? r.value : null
    );
    if (repoQualityResults.some((r) => r.status === 'rejected')) {
      console.warn('[fetchEnrichedGitHubData] One or more repo quality analyses failed');
    }

    // Aggregate all per-repo results into the final CommitQualityAnalysis
    commitQuality = await aggregateCommitQuality(repoResults, mostActiveRepos, calendar);

    // Back-fill qualityScore and qualityLabel onto the top 3 mostActiveRepos entries.
    // These additions are backward compatible — existing consumers ignoring these fields
    // are unaffected. Repos beyond the top 3 remain without quality fields.
    if (commitQuality) {
      for (const repo of mostActiveRepos.slice(0, TOP_REPOS_FOR_QUALITY)) {
        const qualityEntry = commitQuality.qualityByRepo.find((q) => q.repoName === repo.name);
        if (qualityEntry) {
          repo.qualityScore = qualityEntry.compositeScore;
          repo.qualityLabel = qualityEntry.compositeLabel;
        }
      }
    }
  } catch (err) {
    // Total failure of quality analysis — degrade gracefully, rest of data is unaffected
    console.warn('[fetchEnrichedGitHubData] Commit quality analysis failed entirely:', err);
    commitQuality = null;
  }

  // ---------------------------------------------------------------
  // Run all 3 existing AI calls in parallel — failures return defaults
  // (These run after Batch 3 / quality analysis; they do not re-run Batch 2.)
  // ---------------------------------------------------------------
  const [skillClustersResult, forkInterestsResult, workingStyleSummaryResult] = await Promise.allSettled([
    generateSkillClusters(githubData, enrichedPartial),
    generateForkInterests(forks, username),
    generateWorkingStyleSummary(explorationScore, breadthScore, commitPatterns.summary),
  ]);

  const skillClusters =
    skillClustersResult.status === 'fulfilled' ? skillClustersResult.value : [];
  if (skillClustersResult.status === 'rejected') {
    console.warn('[fetchEnrichedGitHubData] Skill clusters generation failed:', skillClustersResult.reason);
  }

  const forkInterests =
    forkInterestsResult.status === 'fulfilled' ? forkInterestsResult.value : [];
  if (forkInterestsResult.status === 'rejected') {
    console.warn('[fetchEnrichedGitHubData] Fork interests generation failed:', forkInterestsResult.reason);
  }

  const workingStyleSummary =
    workingStyleSummaryResult.status === 'fulfilled'
      ? workingStyleSummaryResult.value
      : `A developer who ${explorationScore > 50 ? 'explores broadly' : 'executes deeply'} across their projects.`;
  if (workingStyleSummaryResult.status === 'rejected') {
    console.warn('[fetchEnrichedGitHubData] Working style summary failed:', workingStyleSummaryResult.reason);
  }
  return {
    languageBreakdown,
    mostActiveRepos,
    externalPRsMerged: externalPRsData.externalPRsMerged,
    externalReposContributed: externalPRsData.externalReposContributed,
    commitPatterns,
    skillClusters,
    forkInterests,
    workingStyle: {
      explorationScore,
      breadthScore,
      summary: workingStyleSummary,
    },
    commitQuality, // null if quality analysis failed entirely
    generatedAt: new Date().toISOString(),
  };
}

// ============================================
// Commit Detail Fetchers — Task 2
// Used by the commit quality analysis pipeline
// ============================================

/**
 * The shape returned by the GitHub API for a single full commit detail.
 * Used internally by fetchCommitDetails and fetchSampledCommitDetails.
 */
export interface CommitDetail {
  sha: string; // commit SHA (for reference / deduplication)
  message: string; // full commit message
  additions: number; // lines added in this commit
  deletions: number; // lines deleted in this commit
  changedFiles: number; // number of files changed in this commit
  fileNames: string[]; // list of all filenames touched in this commit
}

/**
 * Fetches full details for a single commit from GitHub.
 * This is the expensive call — one GitHub API call per commit.
 * It returns stats (additions/deletions) and the list of filenames touched.
 *
 * Why this is needed: The basic commit list endpoint only returns the commit message
 * and timestamp. To calculate atomicity (file count + line count) and test coverage
 * signal (whether any test files were touched), we need the full commit detail.
 *
 * @param owner - GitHub username who owns the repo.
 * @param repoName - Name of the repository.
 * @param sha - The commit SHA to fetch details for.
 * @param token - GitHub OAuth access token.
 * @returns CommitDetail object, or null if the fetch fails.
 * @throws Never — errors are caught and null is returned.
 *
 * FRONTEND NOTE: This is an internal function — the frontend never calls it directly.
 * Processed results appear in CommitQualityAnalysis.
 */
export async function fetchCommitDetails(
  owner: string,
  repoName: string,
  sha: string,
  token: string
): Promise<CommitDetail | null> {
  try {
    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/commits/${sha}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'GitFolio',
        },
      }
    );

    if (!res.ok) {
      console.warn(`[fetchCommitDetails] HTTP ${res.status} for ${repoName}/${sha}`);
      return null;
    }

    // Shape of the GitHub single-commit response
    const data = await res.json() as {
      sha: string;
      commit: { message: string };
      stats?: { additions: number; deletions: number };
      files?: Array<{ filename: string }>;
    };

    return {
      sha: data.sha,
      message: data.commit.message,
      additions: data.stats?.additions ?? 0,
      deletions: data.stats?.deletions ?? 0,
      changedFiles: data.files?.length ?? 0,
      fileNames: (data.files ?? []).map((f) => f.filename),
    };
  } catch (error) {
    console.warn(
      `[fetchCommitDetails] Failed for ${repoName}/${sha}:`,
      error instanceof Error ? error.message : error
    );
    return null;
  }
}

/**
 * SAMPLING STRATEGY
 * -----------------
 * Repos to analyze: top 3 repos from mostActiveRepos (by commitCount).
 * Commits to fetch messages: last 50 per repo via GET /repos/{owner}/{repo}/commits
 *   → used for: message quality (AI), fix ratio, conventional commits, category breakdown
 * Commits to fetch full details: last 25 per repo via GET /repos/{owner}/{repo}/commits/{sha}
 *   → used for: atomicity (file count + line count), test coverage signal (file names)
 * Maximum total detail calls: 3 repos × 25 commits = 75 detail calls
 *   → All fetched in parallel via Promise.allSettled to keep total time under 4 seconds.
 *   → Failed individual fetches are skipped (partial results still used).
 *
 * Why cap at 25? GitHub's API rate limit is 5,000 requests/hour for authenticated users.
 * 25 detail calls per repo × 3 repos = 75 calls. This is well within safe limits even
 * when combined with all other enrichment calls.
 */

/**
 * Fetches full commit details for a sampled set of commits from a single repo.
 * Samples up to MAX_DETAIL_COMMITS (25) from the provided commit summary list.
 * All detail fetches run in parallel via Promise.allSettled.
 * Individual failures are skipped — partial results are returned.
 *
 * @param owner - GitHub username who owns the repo.
 * @param repoName - Name of the repository.
 * @param commitShas - Array of commit SHAs to sample from (typically the last 50).
 * @param token - GitHub OAuth access token.
 * @returns Array of CommitDetail objects (empty on total failure, partial on partial failure).
 *          Length will be at most MAX_DETAIL_COMMITS.
 * @throws Never — all errors are caught and the partial result is returned.
 *
 * FRONTEND NOTE: This is an internal function. Results feed into the dimension
 * calculators in commitQuality.ts (atomicity + test coverage dimensions).
 */
export async function fetchSampledCommitDetails(
  owner: string,
  repoName: string,
  commitShas: string[],
  token: string
): Promise<CommitDetail[]> {
  // --- SAMPLING STRATEGY (see block comment above) ---
  const MAX_DETAIL_COMMITS = 25;

  // Take the most recent commits up to the cap
  const shasToFetch = commitShas.slice(0, MAX_DETAIL_COMMITS);

  if (shasToFetch.length === 0) {
    return [];
  }

  // Fetch all sampled commit details in parallel
  const results = await Promise.allSettled(
    shasToFetch.map((sha) => fetchCommitDetails(owner, repoName, sha, token))
  );

  // Collect successful results, filtering out nulls (failed fetches)
  const details: CommitDetail[] = [];
  for (const result of results) {
    if (result.status === 'fulfilled' && result.value !== null) {
      details.push(result.value);
    } else if (result.status === 'rejected') {
      // fetchCommitDetails already catches internally, but guard here too
      console.warn(`[fetchSampledCommitDetails] A detail fetch was rejected for ${repoName}:`, result.reason);
    }
  }

  return details;
}

/**
 * Fetches the last N commit summaries (sha + message) for a repo.
 * Used as the input for both message-level analysis (all N messages)
 * and fetchSampledCommitDetails (takes the SHAs from this result).
 *
 * @param owner - GitHub username who owns the repo.
 * @param repoName - Name of the repository.
 * @param username - GitHub username to filter commits by author.
 * @param token - GitHub OAuth access token.
 * @param limit - Maximum number of commits to fetch (default 50, max 100).
 * @returns Array of { sha, message } objects. Empty array on failure.
 * @throws Never — errors are caught and [] is returned.
 *
 * FRONTEND NOTE: Internal function. Results feed into message quality AI analysis
 * and into fetchSampledCommitDetails for full detail fetching.
 */
export async function fetchCommitSummaries(
  owner: string,
  repoName: string,
  username: string,
  token: string,
  limit = 50
): Promise<Array<{ sha: string; message: string }>> {
  try {
    // Clamp limit to GitHub's per_page maximum
    const perPage = Math.min(limit, 100);

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repoName}/commits?author=${username}&per_page=${perPage}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/vnd.github.v3+json',
          'User-Agent': 'GitFolio',
        },
      }
    );

    if (!res.ok) {
      console.warn(`[fetchCommitSummaries] HTTP ${res.status} for ${owner}/${repoName}`);
      return [];
    }

    const commits = await res.json() as Array<{
      sha: string;
      commit: { message: string };
    }>;

    return commits.map((c) => ({
      sha: c.sha,
      message: c.commit.message,
    }));
  } catch (error) {
    console.warn(
      `[fetchCommitSummaries] Failed for ${owner}/${repoName}:`,
      error instanceof Error ? error.message : error
    );
    return [];
  }
}


