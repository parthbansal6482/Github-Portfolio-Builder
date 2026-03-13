/**
 * commitQualitySummary.ts — LLM prompt builder for the overall commit quality summary.
 *
 * This module generates a 2–3 sentence human-readable summary of a developer's
 * overall commit quality across all analyzed repos. It takes a fully assembled
 * CommitQualityAnalysis object (minus the overallSummary field — that's what we're
 * generating) and asks the LLM to write a grounded summary.
 *
 * IMPORTANT: This prompt runs AFTER scoreCommitMessages() has completed for all repos.
 * The full CommitQualityAnalysis (including per-repo AI observations) is passed in,
 * so the summary can reference specific findings.
 *
 * Called by: aggregateCommitQuality() in lib/commitQuality.ts (Task 7).
 * Exported as: generateCommitQualitySummary() from lib/llm/index.ts.
 */

import { callLLM } from '../provider.js';
import type { CommitQualityAnalysis } from '../../../types/index.js';

/**
 * Builds the prompt string for the overall commit quality summary.
 * Feeds the complete CommitQualityAnalysis (without overallSummary) to the LLM
 * and asks for a 2–3 sentence grounded description.
 *
 * @param analysis - The CommitQualityAnalysis object with overallSummary not yet set.
 * @returns A prompt string ready to send as the user message.
 */
function buildCommitQualitySummaryPrompt(analysis: CommitQualityAnalysis): string {
  const { overall, qualityByRepo, reposAnalyzed } = analysis;

  // Summarise the per-repo AI observations (if any) so the LLM can reference them
  const repoObservations = qualityByRepo
    .filter((r) => r.aiObservation !== null)
    .map((r) => `- ${r.repoName}: "${r.aiObservation}"`)
    .join('\n');

  // Format the dimension scores for the prompt
  const dimensionBreakdown = [
    `Message quality:        ${overall.messageQualityScore}/100 (30% weight)`,
    `Atomicity (commit size): ${overall.atomicityScore}/100 (20% weight)`,
    `Fix ratio:              ${overall.fixRatioScore}/100 (20% weight)`,
    `Test coverage signal:   ${overall.testCoverageScore}/100 (15% weight)`,
    `Consistency:            ${overall.consistencyScore}/100 (10% weight)`,
    `Conventional commits:   ${overall.conventionalCommitsScore}/100 (5% weight)`,
    `COMPOSITE SCORE:        ${overall.compositeScore}/100 (${overall.compositeLabel})`,
  ].join('\n');

  return `You are writing a 2–3 sentence summary of a software developer's commit quality for their portfolio.

REPOS ANALYZED: ${reposAnalyzed.join(', ')}
TOTAL COMMITS SAMPLED: ${analysis.totalCommitsSampled}

DIMENSION SCORES:
${dimensionBreakdown}

PER-REPO AI OBSERVATIONS:
${repoObservations || 'No per-repo observations available.'}

TASK:
Write exactly 2–3 sentences (40–80 words total) summarising this developer's overall commit quality.

REQUIREMENTS:
- Reference specific dimension scores or findings where relevant (e.g. "commit messages score 72/100")
- Be factual and grounded — only describe what the data shows
- Positive framing where scores are strong; constructive framing where scores are weak
- Do NOT use the words "great", "amazing", "excellent", "passionate", "dedicated"
- Do NOT fabricate claims not supported by the dimension scores above
- Write for a portfolio audience — professional but human

Respond with ONLY valid JSON. No markdown, no preamble.

Schema:
{
  "summary": "<2–3 sentences, 40–80 words>"
}`;
}

/**
 * Calls the LLM to generate a 2–3 sentence overall commit quality summary.
 *
 * This function runs AFTER all per-repo AI scoring (scoreCommitMessages) is complete.
 * The full CommitQualityAnalysis is passed in — this function only generates the
 * overallSummary text; it does not modify any other field.
 *
 * @param analysis - The fully assembled CommitQualityAnalysis (overallSummary will be null).
 * @returns A 2–3 sentence summary string, or null if the LLM call fails.
 * @throws Never — errors are caught and null is returned.
 *
 * FRONTEND NOTE: overallSummary may be null if this call fails. Fall back to showing
 * individual dimension scores only — do not show an empty card or placeholder text.
 */
export async function generateCommitQualitySummary(
  analysis: CommitQualityAnalysis
): Promise<string | null> {
  // Skip if there's no meaningful data to summarise
  if (analysis.qualityByRepo.length === 0) {
    return null;
  }

  try {
    const prompt = buildCommitQualitySummaryPrompt(analysis);

    // callLLM(prompt, options) — systemPrompt enforces JSON-only output
    const raw = await callLLM(prompt, {
      systemPrompt:
        'You are a concise professional writer producing portfolio content. ' +
        'Respond with only valid JSON. No markdown, no preamble.',
      temperature: 0.4, // slightly higher than message scorer for natural prose
    });

    // Strip any accidental markdown code fences
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    const parsed = JSON.parse(cleaned) as unknown;

    // Validate response shape
    if (
      typeof parsed !== 'object' ||
      parsed === null ||
      typeof (parsed as Record<string, unknown>).summary !== 'string'
    ) {
      console.warn('[generateCommitQualitySummary] Unexpected response shape');
      return null;
    }

    const summary = ((parsed as Record<string, unknown>).summary as string).trim();

    // Return null if summary is suspiciously short (likely a bad parse)
    if (summary.length < 20) {
      console.warn('[generateCommitQualitySummary] Summary too short, discarding');
      return null;
    }

    return summary;
  } catch (error) {
    console.warn(
      '[generateCommitQualitySummary] Failed:',
      error instanceof Error ? error.message : error
    );
    return null;
  }
}
