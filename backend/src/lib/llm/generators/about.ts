import { callLLM } from '../provider.js';
import type { LLMInput } from '../types.js';

export async function generateAboutCopy(input: LLMInput): Promise<{ headline: string; about: string }> {
  const { githubData, preferences } = input;
  const { profile, topLanguages, contributions } = githubData;

  const systemPrompt = `You are an expert copywriter and developer advocate helping a software engineer write their portfolio website.
You must output ONLY valid JSON matching this schema:
{
  "headline": "A short, punchy 3-7 word headline",
  "about": "A 2-3 sentence professional bio"
}
Do not include markdown blocks like \`\`\`json. Just the raw JSON object.`;

  const userPrompt = `Generate a headline and about me section for a developer with the following profile:

Name: ${profile.name}
Bio: ${profile.bio || 'Not provided'}
Location: ${profile.location || 'Not provided'}
Company: ${profile.company || 'Not provided'}
Top Languages: ${topLanguages.join(', ')}
Contributions Last Year: ${contributions.totalLastYear}

User Preferences:
Vibe: ${preferences.vibe} (e.g. professional, casual, minimal, bold, quirky)
Role/Title: ${preferences.role}
Specific Highlights: ${preferences.highlights || 'None provided'}

Guidelines:
1. The headline should be catchy and match the chosen vibe.
2. The about section should be 2-3 sentences, highlighting their top languages and any specific highlights they provided.
3. If they provided specific highlights, make sure to weave them naturally into the about section.
4. Keep the tone strictly aligned with their chosen "vibe".`;

  const responseText = await callLLM(userPrompt, { systemPrompt, maxRetries: 2 });

  try {
    const parsed = JSON.parse(responseText.trim());
    
    // Basic validation
    if (!parsed.headline || typeof parsed.headline !== 'string' || !parsed.about || typeof parsed.about !== 'string') {
      throw new Error('Invalid JSON shape returned from LLM');
    }

    return {
      headline: parsed.headline,
      about: parsed.about
    };
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Failed to parse about copy JSON: ${err.message}. Raw response: ${responseText}`);
    }
    throw err;
  }
}
