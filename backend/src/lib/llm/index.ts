import type { LLMInput, GeneratedCopy } from './types.js';
import { generateAboutCopy } from './generators/about.js';
import { generateProjectsCopy } from './generators/projects.js';

export async function generatePortfolioCopy(input: LLMInput): Promise<GeneratedCopy> {
  // Run both LLM calls in parallel for speed
  const [aboutResult, projectsResult] = await Promise.all([
    generateAboutCopy(input),
    generateProjectsCopy(input),
  ]);

  return {
    headline: aboutResult.headline,
    about: aboutResult.about,
    projectDescriptions: projectsResult,
    isFallback: false,
  };
}

export { buildFallbackCopy, LLMGenerationError } from './errors.js';
export type { LLMInput, GeneratedCopy, FallbackCopy } from './types.js';

// ============================================
// Enriched GitHub Data AI Generators
// ============================================

/** Generates 4–6 skill clusters from GitHub and enriched data. Returns [] on failure. */
export { generateSkillClusters } from './prompts/skillClusters.js';

/** Generates 2–4 fork interest categories from the user's forked repo list. Returns [] on failure. */
export { generateForkInterests } from './prompts/forkInterests.js';

/** Generates a one-sentence working style description from arithmetic scores. Returns fallback string on failure. */
export { generateWorkingStyleSummary } from './prompts/workingStyleSummary.js';

/**
 * Scores a batch of up to 30 commit messages for a single repo.
 * Returns { score: 0–100, observation: string | null }.
 * Falls back to { score: 50, observation: null } if AI call fails.
 * This is Dimension 1 (30% weight) of the composite quality score.
 */
export { scoreCommitMessages } from './prompts/commitMessageQuality.js';
export type { MessageQualityResult } from './prompts/commitMessageQuality.js';

/**
 * Generates a 2–3 sentence overall commit quality summary from a full CommitQualityAnalysis.
 * Runs AFTER scoreCommitMessages() for all repos is complete.
 * Returns null on failure — callers must handle this and render scores without a summary.
 */
export { generateCommitQualitySummary } from './prompts/commitQualitySummary.js';
