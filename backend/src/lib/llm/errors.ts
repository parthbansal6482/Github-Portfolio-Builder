import type { GitHubData, FallbackCopy } from '../../types/index.js';

export class LLMGenerationError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'LLMGenerationError';
  }
}

// Fallback logic for when Anthropic fails or rate limits
export function buildFallbackCopy(
  githubData: GitHubData,
  reason: string
): FallbackCopy {
  const { profile, allRepos } = githubData;

  // Simple mechanical logic based on available GitHub data
  const headline = `${profile.name} — Software Engineer`;
  
  let about = profile.bio 
    ? profile.bio 
    : `Hi, I'm ${profile.name}. I'm a developer building open source software. I currently have ${profile.publicRepos} public repositories and ${profile.followers} followers on GitHub.`;
    
  if (profile.location) {
    about += ` Based in ${profile.location}.`;
  }
  if (profile.company) {
    about += ` Working at ${profile.company}.`;
  }

  // Fallback descriptions just use the repo's original GitHub description
  const projectDescriptions: Record<string, string> = {};
  for (const repo of allRepos.slice(0, 6)) {
    projectDescriptions[repo.name] = repo.description || 'A project I built and maintain on GitHub. Check out the source code for more details.';
  }

  return {
    headline,
    about,
    projectDescriptions,
    isFallback: true,
    fallbackReason: reason,
  };
}

// Retry logic wrapper — retries once after 2 seconds by default
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 1,
  delayMs: number = 2000
): Promise<T> {
  let lastError: unknown;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      if (attempt < maxRetries) {
        console.warn(`LLM call failed (attempt ${attempt + 1}/${maxRetries + 1}). Retrying in ${delayMs}ms...`);
        await new Promise(resolve => setTimeout(resolve, delayMs));
      }
    }
  }
  
  throw new LLMGenerationError('Operation failed after max retries', lastError);
}
