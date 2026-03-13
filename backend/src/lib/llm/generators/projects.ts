import { callLLM } from '../provider.js';
import type { LLMInput } from '../types.js';

/**
 * Generates AI-rewritten descriptions for each pinned repo.
 * When enrichedData is available, the prompt includes per-repo quality scores and
 * commit activity counts, letting the LLM write more grounded, specific descriptions.
 *
 * @param input - LLMInput with githubData, preferences, and optional enrichedData.
 * @returns Record<repoName, description> — always populated (falls back to original desc).
 */
export async function generateProjectsCopy(input: LLMInput): Promise<Record<string, string>> {
  const { githubData, preferences, enrichedData } = input;
  const { pinnedRepos } = githubData;

  if (!pinnedRepos || pinnedRepos.length === 0) {
    return {};
  }

  // Build a lookup for enriched per-repo signals (quality score + commit count)
  // Key: repo name, Value: { qualityScore, qualityLabel, commitCount }
  const repoQualityMap: Record<string, { qualityScore?: number; qualityLabel?: string; commitCount?: number }> = {};

  if (enrichedData) {
    // mostActiveRepos has qualityScore/qualityLabel on top 3 repos
    for (const ar of enrichedData.mostActiveRepos) {
      repoQualityMap[ar.name] = {
        qualityScore: ar.qualityScore,
        qualityLabel: ar.qualityLabel,
        commitCount: ar.commitCount,
      };
    }
  }

  const systemPrompt = `You are an expert technical copywriter. Your goal is to rewrite repository descriptions to be more engaging for a portfolio website.
You must output ONLY valid JSON where keys are the repository names and values are the new 1-2 sentence descriptions.
Example schema:
{
  "repo-name-1": "A rewritten description...",
  "repo-name-2": "Another rewritten description..."
}
Do not include markdown blocks like \`\`\`json. Just the raw JSON object.`;

  // Build enriched per-repo context
  const reposContext = pinnedRepos.map((repo) => {
    const quality = repoQualityMap[repo.name];

    // Append quality signals as extra context lines when available
    const qualityLines = quality
      ? [
          quality.commitCount !== undefined ? `  Activity: ${quality.commitCount} commits in the last year` : '',
          quality.qualityScore !== undefined ? `  Commit Quality: ${quality.qualityScore}/100 (${quality.qualityLabel})` : '',
        ]
          .filter(Boolean)
          .join('\n')
      : '';

    return `Repo: ${repo.name}
Language: ${repo.primaryLanguage || 'Unknown'}
Stars: ${repo.stargazerCount}
Original Description: ${repo.description || 'Not provided'}
Topics: ${repo.topics.join(', ')}${qualityLines ? '\n' + qualityLines : ''}`;
  }).join('\n---\n');

  const userPrompt = `Rewrite the descriptions for the following repositories.

User Preferences:
Vibe: ${preferences.vibe}
Role/Title: ${preferences.role}

Guidelines:
1. Keep each description to 1-2 concise sentences.
2. Make them sound impressive but factual, matching the chosen vibe (${preferences.vibe}).
3. Highlight the primary language or key topics if they are notable.
4. If commit activity or quality score is provided, you may reference the developer's engagement level (e.g. "actively maintained") — but do NOT quote scores directly.
5. DO NOT invent features that aren't implied by the original description, topics, or language.

Repositories:
${reposContext}`;

  const responseText = await callLLM(userPrompt, { systemPrompt, maxRetries: 2 });

  try {
    const parsed = JSON.parse(responseText.trim());

    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('Expected a JSON object mapping repo names to strings');
    }

    // Only accept keys that match actual pinned repos (prevent hallucinated repo names)
    const validRepoNames = new Set(pinnedRepos.map((r) => r.name));
    const result: Record<string, string> = {};

    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string' && validRepoNames.has(key)) {
        result[key] = value;
      }
    }

    // Fill in any repos the LLM missed with the original description
    for (const repo of pinnedRepos) {
      if (!result[repo.name]) {
        result[repo.name] = repo.description || 'A software project hosted on GitHub.';
      }
    }

    return result;
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Failed to parse projects copy JSON: ${err.message}. Raw response: ${responseText}`);
    }
    throw err;
  }
}
