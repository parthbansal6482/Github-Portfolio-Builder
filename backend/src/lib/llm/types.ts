import type { GitHubData, UserPreferences, GeneratedCopy, FallbackCopy, EnrichedGitHubData } from '../../types/index.js';

export interface LLMInput {
  githubData: GitHubData;
  preferences: UserPreferences;
  /**
   * Optional enriched GitHub data. When present, both generators will use richer context:
   * - About copy gets skill clusters, working style, commit quality, and language breakdown.
   * - Project copy gets per-project quality scores if the project is in the top-analyzed repos.
   * Callers that don't yet have enriched data can omit this field — generators fall back
   * gracefully to using basic githubData only.
   */
  enrichedData?: EnrichedGitHubData | null;
}

export type { GeneratedCopy, FallbackCopy };
