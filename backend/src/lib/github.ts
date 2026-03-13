// GitHub data fetcher — REST + GraphQL in parallel
// Fetches profile, repos, pinned repos, languages, and contribution data

import type { GitHubData, PinnedRepo, Repo } from '../types/index.js';

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
