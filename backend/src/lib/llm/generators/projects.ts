import { callLLM } from '../provider.js';
import type { LLMInput } from '../types.js';

export async function generateProjectsCopy(input: LLMInput): Promise<Record<string, string>> {
  const { githubData, preferences } = input;
  const { pinnedRepos } = githubData;

  // If no repos to summarize, return empty early
  if (!pinnedRepos || pinnedRepos.length === 0) {
    return {};
  }

  const systemPrompt = `You are an expert technical copywriter. Your goal is to rewrite repository descriptions to be more engaging for a portfolio website.
You must output ONLY valid JSON where keys are the repository names and values are the new 1-2 sentence descriptions.
Example schema:
{
  "repo-name-1": "A rewritten description...",
  "repo-name-2": "Another rewritten description..."
}
Do not include markdown blocks like \`\`\`json. Just the raw JSON object.`;

  const reposContext = pinnedRepos.map(repo => `
Repo: ${repo.name}
Language: ${repo.primaryLanguage || 'Unknown'}
Stars: ${repo.stargazerCount}
Original Description: ${repo.description || 'Not provided'}
Topics: ${repo.topics.join(', ')}
`).join('\n---\n');

  const userPrompt = `Rewrite the descriptions for the following repositories.

User Preferences:
Vibe: ${preferences.vibe}
Role/Title: ${preferences.role}

Guidelines:
1. Keep each description to 1-2 concise sentences.
2. Make them sound impressive but factual, matching the chosen vibe (${preferences.vibe}).
3. Highlight the primary language or key topics if they are notable.
4. DO NOT invent features that aren't implied by the original description, topics, or language.

Repositories:
${reposContext}`;

  const responseText = await callLLM(userPrompt, { systemPrompt, maxRetries: 2 });

  try {
    const parsed = JSON.parse(responseText.trim());
    
    // Ensure the output is a basic object mapping strings to strings
    if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
      throw new Error('Expected a JSON object mapping repo names to strings');
    }

    // Filter to only include keys that actually exist in the pinned repos
    // to prevent hallucinated repos
    const validRepoNames = new Set(pinnedRepos.map(r => r.name));
    const result: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(parsed)) {
      if (typeof value === 'string' && validRepoNames.has(key)) {
        result[key] = value;
      }
    }

    // Fill in blanks for any repos the LLM missed
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
