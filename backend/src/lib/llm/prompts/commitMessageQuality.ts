/**
 * commitMessageQuality.ts — LLM prompt builder and scorer for commit message quality.
 *
 * This module scores a batch of commit messages by sending them to the LLM and asking
 * it to evaluate them as a group. The output is a 0–100 score and a one-sentence
 * observation about the developer's commit message style in this repo.
 *
 * This implements Dimension 1 (message quality, weight 30%) of the commit quality system.
 *
 * Called by: analyseRepoCommitQuality() in lib/commitQuality.ts (Task 6).
 * Exported as: scoreCommitMessages() from lib/llm/index.ts.
 */

import { callLLM } from '../provider.js';

/**
 * The parsed output shape from the LLM's response.
 * If parsing fails, scoreCommitMessages() returns the fallback value instead.
 */
export interface MessageQualityResult {
  score: number;        // 0–100 quality score for the batch of messages
  observation: string | null; // one-sentence observation, or null if AI failed
}

/**
 * Builds the prompt that asks the LLM to evaluate a batch of commit messages.
 *
 * PROMPT DESIGN NOTES:
 * - We evaluate messages as a batch (not individually) to get a holistic view.
 * - We explicitly prohibit the AI from inventing context about what the code does
 *   (anti-hallucination constraint).
 * - We specify the exact JSON output shape to make parsing reliable.
 * - Good/bad examples are embedded to anchor the AI's scoring scale.
 *
 * @param messages - Array of commit message strings (max 30 recommended).
 * @param repoName - Name of the repository (provides context for the AI).
 * @returns A prompt string to send as the user message to the LLM.
 */
function buildMessageQualityPrompt(messages: string[], repoName: string): string {
  // Format messages as a numbered list for the AI to evaluate
  const numberedMessages = messages
    .slice(0, 30) // cap at 30 to keep the prompt manageable
    .map((m, i) => `${i + 1}. ${m.split('\n')[0].trim()}`) // subject line only
    .join('\n');

  return `You are evaluating the quality of commit messages from a software developer's GitHub repository.

REPOSITORY: ${repoName}
COMMIT MESSAGES (${Math.min(messages.length, 30)} total):
${numberedMessages}

TASK:
Evaluate these commit messages AS A BATCH and produce a single quality score (0–100) and a one-sentence observation.

SCORING CRITERIA (evaluate all of these together):
- DESCRIPTIVENESS: Do messages explain what changed, not just that something changed?
  Good: "fix: prevent race condition in token refresh when multiple tabs are open"
  Bad:  "fix", "update", "wip", "changes", "stuff", "misc", "commit", "ok", "asdf"
- SPECIFICITY: Are messages precise about the scope of the change?
  Good: "feat(auth): add PKCE flow for GitHub OAuth"
  Bad:  "add auth stuff"
- ACTIONABLE CONTEXT: Would a new team member understand WHY this change was made?
  Good: "refactor: extract token validation to shared util to reduce duplication"
  Bad:  "refactor code"
- ABSENCE OF FILLER: Are the messages free of noise words and vague phrasing?

SCORING SCALE:
  90–100: Majority of messages are descriptive, specific, and actionable. Clearly communicative.
  70–89:  Most are good, some are vague or short but not completely uninformative.
  50–69:  Mix of good and bad. A significant minority are filler or too short.
  30–49:  Most messages are vague, terse, or rely on filler words.
  0–29:   Majority are poor ("fix", "update", "wip"), showing little communication discipline.

ANTI-HALLUCINATION: Base your score ONLY on the messages listed above.
Do NOT invent context about what the code does, what the repository contains, or what bugs were fixed.
Score only what is visible in the message text.

Respond with ONLY valid JSON. No markdown, no explanation, no preamble.

Schema:
{
  "score": <integer 0–100>,
  "observation": "<one sentence (15–35 words) describing the overall style of these commit messages>"
}`;
}

/**
 * Calls the LLM to score a batch of commit messages for a single repository.
 * Returns a score (0–100) and a one-sentence observation.
 *
 * On parse failure or LLM error: returns { score: 50, observation: null }.
 * The score of 50 is deliberately neutral — it does not unfairly penalise a developer
 * when data is missing.
 *
 * @param messages - Array of raw commit message strings (up to 30 used; rest ignored).
 * @param repoName - Repository name to include in the prompt for context.
 * @returns MessageQualityResult with score 0–100 and observation string or null.
 * @throws Never — all errors are caught and the fallback is returned.
 *
 * FRONTEND NOTE: This is the AI-powered Dimension 1 scorer. Its output appears in
 * RepoCommitQuality.messageQuality (score + label) and RepoCommitQuality.aiObservation.
 * observation may be null if the AI call or parse failed — always guard before rendering.
 */
export async function scoreCommitMessages(
  messages: string[],
  repoName: string
): Promise<MessageQualityResult> {
  // Fallback returned when AI fails — score 50 is neutral, not punitive
  const FALLBACK: MessageQualityResult = { score: 50, observation: null };

  if (messages.length === 0) {
    return { score: 50, observation: 'No commit messages available for analysis.' };
  }

  try {
    const prompt = buildMessageQualityPrompt(messages, repoName);

    // callLLM(prompt, options) — systemPrompt enforces JSON-only output mode
    const raw = await callLLM(prompt, {
      systemPrompt:
        'You are a structured JSON generator evaluating software engineering practices. ' +
        'Respond with only valid JSON. No markdown, no preamble, no explanation.',
      temperature: 0.2, // low temperature for more deterministic scoring
    });

    // Strip any accidental markdown code fences before parsing
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned) as unknown;

    // Validate the parsed response has the expected shape
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof (parsed as Record<string, unknown>).score !== 'number'
    ) {
      console.warn(`[scoreCommitMessages] Unexpected response shape for ${repoName}`);
      return FALLBACK;
    }

    const result = parsed as Record<string, unknown>;
    const score = Math.min(100, Math.max(0, Math.round(result.score as number)));
    const observation =
      typeof result.observation === 'string' && result.observation.length > 5
        ? result.observation
        : null;

    return { score, observation };
  } catch (error) {
    console.warn(
      `[scoreCommitMessages] Failed for ${repoName}:`,
      error instanceof Error ? error.message : error
    );
    return FALLBACK;
  }
}
