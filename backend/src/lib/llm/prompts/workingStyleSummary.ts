/**
 * workingStyleSummary.ts — LLM prompt builder for generating a human-readable
 * working style summary sentence from pre-calculated numeric scores.
 *
 * IMPORTANT: The explorationScore and breadthScore are calculated arithmetically
 * (in calculateWorkingStyle in lib/github.ts). This module only uses the LLM to
 * write a natural-language sentence that describes those scores. The scores
 * themselves are NOT AI-inferred.
 *
 * Called by: fetchEnrichedGitHubData() in lib/github.ts (Task 10 orchestrator).
 */

import { callLLM } from '../provider.js';

/**
 * Builds the prompt for generating a working style summary sentence.
 *
 * @param explorationScore - 0 (pure execution) to 100 (pure exploration).
 * @param breadthScore - 0 (narrow focus) to 100 (broad scope).
 * @param commitPatternSummary - Human-readable commit timing string (e.g. "Mostly commits Wednesdays").
 * @returns A concise prompt string ready to send as the user message.
 */
function buildWorkingStylePrompt(
  explorationScore: number,
  breadthScore: number,
  commitPatternSummary: string
): string {
  // Map numeric scores to human-readable labels for the prompt
  const explorationLabel =
    explorationScore >= 70 ? 'a broad explorer who tries many things' :
    explorationScore >= 40 ? 'a balanced mix of exploration and focused execution' :
    'a focused executor who goes deep on fewer projects';

  const breadthLabel =
    breadthScore >= 70 ? 'works across a very wide range of technologies and domains' :
    breadthScore >= 40 ? 'has moderate breadth, mixing a core stack with occasional exploration' :
    'works within a focused, narrow set of technologies';

  return `You are writing a one-sentence working style description for a developer's portfolio.

INPUTS (calculated from their GitHub data — do not alter these scores):
- Exploration score: ${explorationScore}/100 — they are ${explorationLabel}
- Breadth score: ${breadthScore}/100 — they ${breadthLabel}
- Commit timing: ${commitPatternSummary}

TASK:
Write exactly one sentence (25–45 words) that describes this developer's working style in a natural, professional tone.
The sentence should be suitable for a portfolio website — positive, specific, and based only on the inputs above.
Do not use generic phrases like "passionate developer" or "hard worker".
Do not use the words "exploration", "execution", "breadth", or the raw scores.

Respond with ONLY the sentence — no quotes, no explanation, no punctuation beyond the sentence itself.`;
}

/**
 * Calls the LLM to generate a single working style summary sentence.
 *
 * @param explorationScore - 0–100 exploration score (from calculateWorkingStyle in lib/github.ts).
 * @param breadthScore - 0–100 breadth score (from calculateWorkingStyle in lib/github.ts).
 * @param commitPatternSummary - Pre-computed commit timing string (e.g. "Primarily commits on Tuesdays during evenings (UTC).").
 * @returns A single sentence string describing the developer's style.
 *          Returns a deterministic fallback string if the LLM fails.
 * @throws Never — errors produce a sensible fallback string.
 *
 * FRONTEND NOTE: This is always a non-empty string (fallback is guaranteed).
 * It is ready to render directly as text. No markdown formatting inside.
 */
export async function generateWorkingStyleSummary(
  explorationScore: number,
  breadthScore: number,
  commitPatternSummary: string
): Promise<string> {
  try {
    const prompt = buildWorkingStylePrompt(explorationScore, breadthScore, commitPatternSummary);

    // callLLM(prompt: string, options?: CallLLMOptions) — separate args, not a combined object
    const raw = await callLLM(prompt, {
      systemPrompt: 'You are a concise professional writer. Respond with a single sentence only.',
      temperature: 0.5, // Lower temperature for more predictable output
    });

    // Clean up the response — strip leading/trailing quotes and whitespace
    const cleaned = raw.trim().replace(/^["']|["']$/g, '');
    if (cleaned.length > 10) return cleaned;

    // Fallback if the response is too short or empty
    return buildFallbackSummary(explorationScore, breadthScore);
  } catch (error) {
    console.warn(
      '[generateWorkingStyleSummary] LLM call failed:',
      error instanceof Error ? error.message : error
    );
    return buildFallbackSummary(explorationScore, breadthScore);
  }
}

/**
 * Constructs a deterministic fallback summary string when the LLM call fails.
 * Produces a reasonable description without any AI call.
 *
 * @param explorationScore - 0–100 exploration score.
 * @param breadthScore - 0–100 breadth score.
 * @returns A fallback one-sentence description string.
 */
function buildFallbackSummary(explorationScore: number, breadthScore: number): string {
  const style =
    explorationScore >= 70 ? 'exploratory developer who works across many projects and technologies' :
    explorationScore >= 40 ? 'developer who balances focused execution with technology exploration' :
    'focused developer who goes deep on a concentrated set of projects';

  const scope =
    breadthScore >= 70 ? 'spanning a wide range of domains' :
    breadthScore >= 40 ? 'with moderate domain breadth' :
    'within a focused technical domain';

  return `An ${style}, ${scope}.`;
}
