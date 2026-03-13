/**
 * forkInterests.ts — LLM prompt builder for categorising forked repos into interest areas.
 *
 * This module analyses the user's list of forked repos and uses the LLM to group them
 * into 2–4 interest categories, revealing what the developer studies or explores.
 *
 * Called by: fetchEnrichedGitHubData() in lib/github.ts (Task 10 orchestrator).
 */

import type { ForkInterest } from '../../../types/index.js';
import { callLLM } from '../provider.js';

/**
 * Builds the prompt string that asks the LLM to categorise forked repos into interest areas.
 *
 * @param forks - Raw list of forked repos with name, description, and topics.
 * @param username - GitHub username (used for context in the prompt).
 * @returns A prompt string ready to send to the LLM as the user message.
 */
function buildForkInterestsPrompt(
  forks: Array<{ name: string; description: string | null; topics: string[] }>,
  username: string
): string {
  const forkList = forks
    .slice(0, 60) // limit to 60 forks to keep prompt manageable
    .map(
      (f) =>
        `- ${f.name}: ${f.description || 'No description'}${f.topics.length ? ` [${f.topics.join(', ')}]` : ''}`
    )
    .join('\n');

  return `You are analysing a developer's forked GitHub repositories to identify their learning interests and exploration areas.

DEVELOPER: ${username}
FORKED REPOSITORIES (${forks.length} total):
${forkList}

TASK:
Examine the forked repos and group them into 2–4 distinct interest categories based on patterns you observe.
An interest category reveals something meaningful about what this developer is curious about or wants to learn.

Respond with ONLY a valid JSON array. No markdown, no explanation, no code fences. Just the raw JSON array.

Schema (each object in the array):
{
  "category": "string — a concise interest area name, e.g. 'AI/ML Exploration'",
  "repos": ["array", "of", "forked", "repo", "names", "that", "belong", "here"],
  "description": "One sentence describing what this forking pattern reveals about the developer."
}

Rules:
- Return 2–4 categories (not more, not fewer, unless there are very few forks).
- Every repo in your response must come from the list above.
- If all forks clearly belong to one theme, still try to find sub-themes.
- If there are no clear patterns, create broad categories like "Tools & Utilities" or "Learning Resources".`;
}

/**
 * Calls the LLM to categorise forked repos into interest areas, then parses the response.
 *
 * @param forks - Raw list of forked repos (from fetchForkList in lib/github.ts).
 * @param username - GitHub username for context.
 * @returns ForkInterest[] with 2–4 categories. Returns [] if no forks or if LLM fails.
 * @throws Never — errors are caught and an empty array is returned.
 *
 * FRONTEND NOTE: forkInterests may be [] if the user has no forks or if AI fails.
 * Always guard with .length check before rendering.
 */
export async function generateForkInterests(
  forks: Array<{ name: string; description: string | null; topics: string[] }>,
  username: string
): Promise<ForkInterest[]> {
  // If no forks, skip the LLM call entirely
  if (forks.length === 0) {
    return [];
  }

  try {
    const prompt = buildForkInterestsPrompt(forks, username);

    // callLLM(prompt: string, options?: CallLLMOptions) — separate args, not a combined object
    const raw = await callLLM(prompt, {
      systemPrompt: 'You are a structured JSON generator. Output only valid JSON arrays. No markdown.',
    });

    // Strip any accidental markdown code fences
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

    // Parse and validate the response
    const parsed = JSON.parse(cleaned) as unknown;
    if (!Array.isArray(parsed)) {
      console.warn('[generateForkInterests] LLM response was not a JSON array');
      return [];
    }

    // Validate each category has required fields
    const validated: ForkInterest[] = [];
    for (const item of parsed) {
      const obj = item as Record<string, unknown>;
      if (
        typeof obj.category === 'string' &&
        Array.isArray(obj.repos) &&
        typeof obj.description === 'string'
      ) {
        validated.push(obj as unknown as ForkInterest);
      }
    }

    return validated;
  } catch (error) {
    console.warn(
      '[generateForkInterests] Failed:',
      error instanceof Error ? error.message : error
    );
    return [];
  }
}
