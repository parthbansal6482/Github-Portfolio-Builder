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
