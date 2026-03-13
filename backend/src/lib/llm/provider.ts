import Anthropic from '@anthropic-ai/sdk';
import Groq from 'groq-sdk';
import { withRetry } from './errors.js';

// Model constants
export const ANTHROPIC_MODEL = 'claude-opus-4-6';
export const GROQ_MODEL = 'llama-3.3-70b-versatile';

// Initialize the SDKs. Use dummy keys if not present so the server starts,
// but throw when actually calling if it's missing.
export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY || 'dummy_key',
});

export const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY || 'dummy_key',
});

interface CallLLMOptions {
  maxRetries?: number;
  systemPrompt?: string;
  temperature?: number;
}

async function callAnthropic(prompt: string, options?: CallLLMOptions): Promise<string> {
  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error('ANTHROPIC_API_KEY is not configured in the backend environment.');
  }

  return withRetry(async () => {
    const response = await anthropic.messages.create({
      model: ANTHROPIC_MODEL,
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

async function callGroq(prompt: string, options?: CallLLMOptions): Promise<string> {
  if (!process.env.GROQ_API_KEY) {
    throw new Error('GROQ_API_KEY is not configured in the backend environment.');
  }

  return withRetry(async () => {
    // Groq doesn't use a dedicated "system" param like Anthropic's messages API,
    // we just prepend a system message to the chat array
    const response = await groq.chat.completions.create({
      model: GROQ_MODEL,
      temperature: options?.temperature ?? 0.7,
      messages: [
        {
          role: 'system',
          content: options?.systemPrompt || 'You are an expert copywriter formatting output in clean JSON.',
        },
        {
          role: 'user',
          content: prompt,
        }
      ],
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      throw new Error('Unexpected empty response from Groq');
    }

    return content;
  }, options?.maxRetries);
}

export async function callLLM(prompt: string, options?: CallLLMOptions): Promise<string> {
  const provider = (process.env.LLM_PROVIDER || 'anthropic').toLowerCase();

  if (provider === 'groq') {
    return callGroq(prompt, options);
  } else if (provider === 'anthropic') {
    return callAnthropic(prompt, options);
  } else {
    throw new Error(`Unsupported LLM_PROVIDER: ${provider}`);
  }
}
