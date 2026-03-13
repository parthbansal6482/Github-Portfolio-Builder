import Anthropic from '@anthropic-ai/sdk';
import { withRetry } from './errors.js';

// Model constant specified in prompt
export const LLM_MODEL = 'claude-opus-4-6';

// Initialize the SDK. Use a dummy key if not present so the server starts,
// but throw when actually calling if it's missing.
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'dummy_key',
});

interface CallLLMOptions {
  maxRetries?: number;
  systemPrompt?: string;
  temperature?: number;
}

export async function callLLM(prompt: string, options?: CallLLMOptions): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured in the backend environment.');
  }

  return withRetry(async () => {
    const response = await anthropic.messages.create({
      model: LLM_MODEL,
      max_tokens: 3000,
      temperature: options?.temperature ?? 0.7,
      system: options?.systemPrompt || 'You are an expert copywriter formatting output in clean JSON.',
      messages: [
        {
          role: 'user',
          content: prompt,
        }
      ],
    });

    const content = response.content[0];
    if (content.type !== 'text') {
      throw new Error('Unexpected non-text response from Anthropic');
    }

    return content.text;
  }, options?.maxRetries);
}
