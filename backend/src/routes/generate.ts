import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';
import { generatePortfolioCopy, buildFallbackCopy } from '../lib/llm/index.js';
import type { UserPreferences } from '../types/index.js';

const router = Router();

// POST /api/generate — call LLM layer, return GeneratedCopy | FallbackCopy
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: { message: 'Unauthorized', code: 'UNAUTHORIZED', status: 401 } });
      return;
    }

    const { preferences } = req.body as { preferences: UserPreferences };

    if (!preferences || !preferences.vibe || !preferences.role) {
      res.status(400).json({
        error: {
          message: 'preferences mapping is missing required fields (vibe, role)',
          code: 'MISSING_FIELDS',
          status: 400,
        },
      });
      return;
    }

    // 1. Fetch existing GitHub data (and enriched insights if available) from Supabase
    const { data: portfolio, error: fetchError } = await supabase
      .from('portfolios')
      .select('id, github_data, enriched_github_data')
      .eq('user_id', user.id)
      .single();

    if (fetchError || !portfolio?.github_data) {
      console.error('Missing GitHub data for generation:', fetchError);
      res.status(400).json({
        error: {
          message: 'GitHub data not found. Please sync your GitHub profile first.',
          code: 'MISSING_GITHUB_DATA',
          status: 400,
        },
      });
      return;
    }

    const githubData = portfolio.github_data;
    let finalCopy;

    // 2. Call LLM generators
    try {
      finalCopy = await generatePortfolioCopy({
        githubData,
        preferences,
        // enrichedData may be null if enrichment hasn't been run yet — generators fall back gracefully
        enrichedData: portfolio.enriched_github_data ?? null,
      });
    } catch (llmError) {
      console.error('LLM Generation failed, building fallback copy:', llmError);
      const reason = llmError instanceof Error ? llmError.message : 'Unknown LLM error';
      finalCopy = buildFallbackCopy(githubData, reason);
    }

    // 3. Save preferences and generated copy to DB
    const { error: updateError } = await supabase
      .from('portfolios')
      .update({
        preferences,
        generated_copy: finalCopy,
      })
      .eq('id', portfolio.id);

    if (updateError) {
      console.error('Failed to save generated copy:', updateError);
      res.status(500).json({
        error: {
          message: 'Failed to save generated portfolio data',
          code: 'DB_ERROR',
          status: 500,
        },
      });
      return;
    }

    // 4. Return the generated copy
    res.status(200).json(finalCopy);
  } catch (error) {
    console.error('Generate route error:', error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        status: 500,
      },
    });
  }
});

export default router;
