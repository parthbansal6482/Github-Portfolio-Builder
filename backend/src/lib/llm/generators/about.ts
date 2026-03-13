import { callLLM } from '../provider.js';
import type { LLMInput } from '../types.js';

/**
 * Generates the headline and about section for a developer's portfolio.
 * When enrichedData is available, the prompt includes skill clusters, working style,
 * commit quality score, and top languages from byte analysis — producing more specific,
 * grounded copy. Falls back to basic profile data when enrichedData is null.
 *
 * @param input - LLMInput with githubData, preferences, and optional enrichedData.
 * @returns { headline, about } — both are always strings (may throw on full LLM failure).
 */
export async function generateAboutCopy(input: LLMInput): Promise<{ headline: string; about: string }> {
  const { githubData, preferences, enrichedData } = input;
  const { profile, topLanguages, contributions } = githubData;

  // --- Build enriched context block (only if enrichedData is available) ---
  let enrichedContext = '';

  if (enrichedData) {
    // Skill clusters: top 3 skill names + their primary technologies
    const clusters = enrichedData.skillClusters.slice(0, 3)
      .map((c) => `${c.skillName} (${c.technologies.slice(0, 4).join(', ')})`)
      .join('; ');

    // Language breakdown: top 4 languages by usage percentage
    const langBreakdown = Object.entries(enrichedData.languageBreakdown)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 4)
      .map(([lang, pct]) => `${lang} ${pct}%`)
      .join(', ');

    // Working style
    const { explorationScore, breadthScore, summary: wsSummary } = enrichedData.workingStyle;

    // Commit quality headline (if available)
    const qualityStr = enrichedData.commitQuality
      ? `Commit quality score: ${enrichedData.commitQuality.overall.compositeScore}/100 (${enrichedData.commitQuality.overall.compositeLabel}).`
      : '';

    // External contributions
    const extPRs = enrichedData.externalPRsMerged > 0
      ? `Has merged ${enrichedData.externalPRsMerged} PRs in external/open-source repos.`
      : '';

    enrichedContext = `
ENRICHED DEVELOPER INSIGHTS (use these to write more specific, grounded copy):
Skill Clusters: ${clusters || 'Not available'}
Language Breakdown (by code volume): ${langBreakdown || topLanguages.join(', ')}
Working Style: ${wsSummary} (Exploration score: ${explorationScore}/100, Breadth: ${breadthScore}/100)
${qualityStr}
${extPRs}
Fork Interests: ${enrichedData.forkInterests.map((f) => f.category).join(', ') || 'Not available'}
`;
  }

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
${enrichedContext}
User Preferences:
Vibe: ${preferences.vibe} (e.g. professional, casual, minimal, bold, quirky)
Role/Title: ${preferences.role}
Specific Highlights: ${preferences.highlights?.length ? preferences.highlights.join(', ') : 'None provided'}

Guidelines:
1. The headline should be catchy and match the chosen vibe.
2. The about section should be 2-3 sentences. If enriched insights are available, use them to reference specific skills or patterns — do not just repeat the bio.
3. Weave in any specific highlights the user provided naturally.
4. Keep the tone strictly aligned with the chosen "vibe".
5. Anti-hallucination: do not invent skills, repos, or contributions not present in the data above.`;

  const responseText = await callLLM(userPrompt, { systemPrompt, maxRetries: 2 });

  try {
    const parsed = JSON.parse(responseText.trim());

    if (!parsed.headline || typeof parsed.headline !== 'string' || !parsed.about || typeof parsed.about !== 'string') {
      throw new Error('Invalid JSON shape returned from LLM');
    }

    return { headline: parsed.headline, about: parsed.about };
  } catch (err) {
    if (err instanceof Error) {
      throw new Error(`Failed to parse about copy JSON: ${err.message}. Raw response: ${responseText}`);
    }
    throw err;
  }
}
