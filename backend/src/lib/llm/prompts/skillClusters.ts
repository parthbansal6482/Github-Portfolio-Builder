/**
 * skillClusters.ts — LLM prompt builder for generating skill clusters from GitHub data.
 *
 * This module builds the prompt sent to the LLM and parses the JSON response back
 * into a typed SkillCluster[] array. It is the implementation behind generateSkillClusters()
 * exported from llm/index.ts.
 *
 * Called by: fetchEnrichedGitHubData() in lib/github.ts (Task 10 orchestrator).
 */

import type { GitHubData, SkillCluster, EnrichedGitHubData, Repo, PinnedRepo, ActiveRepo } from '../../../types/index.js';
import { callLLM } from '../provider.js';

/**
 * Builds the prompt string that asks the LLM to analyse GitHub data and produce skill clusters.
 *
 * @param githubData - The user's basic GitHub data (repos, languages, pinned repos).
 * @param enrichedPartial - Partially assembled enriched data (language breakdown, active repos).
 * @returns A prompt string ready to send to the LLM as the user message.
 */
function buildSkillClustersPrompt(
  githubData: GitHubData,
  enrichedPartial: Partial<EnrichedGitHubData>
): string {
  // Summarise repos concisely for the prompt — limit to 20 to keep prompt manageable
  const repoSummaries = githubData.allRepos
    .filter((r: Repo) => !r.isFork && !r.isArchived)
    .slice(0, 20)
    .map(
      (r: Repo) =>
        `- ${r.name}: lang=${r.primaryLanguage || 'unknown'}, stars=${r.stargazerCount}, topics=[${r.topics.join(', ')}]`
    )
    .join('\n');

  // Summarise active repos with commit counts if available
  const activeRepoSummary = (enrichedPartial.mostActiveRepos || [])
    .map((r: ActiveRepo) => `- ${r.name}: ${r.commitCount} commits in last year`)
    .join('\n');

  // Build language breakdown summary from the enriched data
  const langBreakdown = enrichedPartial.languageBreakdown
    ? Object.entries(enrichedPartial.languageBreakdown)
        .sort(([, a], [, b]) => (b as number) - (a as number))
        .slice(0, 6)
        .map(([lang, pct]) => `${lang}: ${pct}%`)
        .join(', ')
    : 'Not available';

  return `You are analysing a developer's GitHub profile to generate 4–6 skill clusters for their portfolio.

A skill cluster is a coherent grouping of technologies and evidence from code that reveals one specific skill area.

DEVELOPER PROFILE:
Name: ${githubData.profile.name}
Bio: ${githubData.profile.bio || 'No bio'}
Top languages (recency-weighted): ${githubData.topLanguages.join(', ')}
Language breakdown (by bytes): ${langBreakdown}

REPOSITORIES (excluding forks and archives):
${repoSummaries}

MOST ACTIVE REPOS (by commits in last 12 months):
${activeRepoSummary || 'No recent commit data available'}

PINNED REPOS:
${githubData.pinnedRepos.map((r: PinnedRepo) => `- ${r.name}: ${r.description || 'No description'}, lang=${r.primaryLanguage || 'unknown'}`).join('\n')}

TASK:
Generate 4–6 skill clusters based on this evidence. Each cluster must be grounded in the repo data above — do not invent skills that aren't evidenced.

Respond with ONLY a valid JSON array. No markdown, no explanation, no code fences. Just the raw JSON array.

Schema (each object in the array):
{
  "skillName": "string — concise skill area name, e.g. 'Full-Stack TypeScript Development'",
  "technologies": ["array", "of", "specific", "tech", "stacks"],
  "indicators": ["2–3 bullet point strings", "each describing what the code evidence shows"],
  "evidenceRepos": ["array", "of", "repo", "names", "from", "the", "data", "above"]
}

Return 4–6 clusters. Do not include clusters without evidence repos.`;
}

/**
 * Calls the LLM to generate skill clusters from GitHub data, then parses and validates the response.
 *
 * This is the main exported function — re-exported in llm/index.ts as generateSkillClusters().
 *
 * @param githubData - The user's basic GitHub data.
 * @param enrichedPartial - Partially assembled enriched data to give the LLM more signals.
 * @returns SkillCluster[] with 4–6 clusters. Returns [] if LLM fails or response is unparseable.
 * @throws Never — errors are caught and an empty array is returned.
 *
 * FRONTEND NOTE: skillClusters may be [] if this call fails. Always guard with .length check.
 */
export async function generateSkillClusters(
  githubData: GitHubData,
  enrichedPartial: Partial<EnrichedGitHubData>
): Promise<SkillCluster[]> {
  try {
    const prompt = buildSkillClustersPrompt(githubData, enrichedPartial);

    // callLLM(prompt: string, options?: CallLLMOptions) — separate args, not a combined object
    const raw = await callLLM(prompt, {
      systemPrompt: 'You are a structured JSON generator. Output only valid JSON arrays. No markdown.',
    });

    // Strip any accidental markdown code fences
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse and validate the response
    const parsed = JSON.parse(cleaned) as unknown;
    if (!Array.isArray(parsed)) {
      console.warn('[generateSkillClusters] LLM response was not a JSON array');
      return [];
    }

    // Validate each cluster has required fields
    const validated: SkillCluster[] = [];
    for (const item of parsed) {
      const obj = item as Record<string, unknown>;
      if (
        typeof obj.skillName === 'string' &&
        Array.isArray(obj.technologies) &&
        Array.isArray(obj.indicators) &&
        Array.isArray(obj.evidenceRepos)
      ) {
        validated.push(obj as unknown as SkillCluster);
      }
    }

    return validated;
  } catch (error) {
    console.warn(
      '[generateSkillClusters] Failed:',
      error instanceof Error ? error.message : error
    );
    return [];
  }
}
