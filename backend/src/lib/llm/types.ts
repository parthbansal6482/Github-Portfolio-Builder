import type { GitHubData, UserPreferences, GeneratedCopy, FallbackCopy } from '../../types/index.js';

export interface LLMInput {
  githubData: GitHubData;
  preferences: UserPreferences;
}

export type { GeneratedCopy, FallbackCopy };
