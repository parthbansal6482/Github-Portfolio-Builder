import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';
import { revalidatePath } from '../lib/revalidate.js';
import type { GeneratedCopy, FallbackCopy, UserPreferences } from '../types/index.js';

const router = Router();

// GET /api/portfolio/:username — return public portfolio data (no auth required)
router.get('/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    // We need to find the user id from the profiles table, then get the portfolio
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id, username')
      .eq('username', username)
      .single();

    if (profileError || !profile) {
      res.status(404).json({ error: { message: 'Portfolio not found', code: 'NOT_FOUND', status: 404 } });
      return;
    }

    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', profile.id)
      .eq('is_published', true)
      .single();

    if (portfolioError || !portfolio) {
      res.status(404).json({ error: { message: 'Portfolio not found or not published', code: 'NOT_FOUND', status: 404 } });
      return;
    }

    // Map DB casing to camelCase for the frontend type
    const mappedPortfolio = {
      id: portfolio.id,
      userId: portfolio.user_id,
      githubData: portfolio.github_data,
      preferences: portfolio.preferences,
      generatedCopy: portfolio.generated_copy,
      templateId: portfolio.template_id,
      isPublished: portfolio.is_published,
      enrichedData: portfolio.enriched_github_data || null,
      viewCount: portfolio.view_count,
      updatedAt: portfolio.updated_at,
    };

    res.status(200).json({ portfolio: mappedPortfolio });
  } catch (error) {
    console.error('Portfolio fetch error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'INTERNAL_ERROR', status: 500 } });
  }
});

// POST /api/portfolio/save — save approved generated_copy to DB
router.post('/save', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: { message: 'Unauthorized', code: 'UNAUTHORIZED', status: 401 } });
      return;
    }

    const { copy } = req.body as { copy: GeneratedCopy | FallbackCopy };
    if (!copy) {
      res.status(400).json({ error: { message: 'copy is required', code: 'MISSING_FIELDS', status: 400 } });
      return;
    }

    const { error: updateError } = await supabase
      .from('portfolios')
      .update({ generated_copy: copy })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Save copy error:', updateError);
      res.status(500).json({ error: { message: 'Failed to save copy', code: 'DB_ERROR', status: 500 } });
      return;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Save copy error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'INTERNAL_ERROR', status: 500 } });
  }
});

// POST /api/portfolio/save-preferences — save user preferences to DB
router.post('/save-preferences', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: { message: 'Unauthorized', code: 'UNAUTHORIZED', status: 401 } });
      return;
    }

    const { preferences } = req.body as { preferences: UserPreferences };
    if (!preferences) {
      res.status(400).json({ error: { message: 'preferences is required', code: 'MISSING_FIELDS', status: 400 } });
      return;
    }

    const { error: updateError } = await supabase
      .from('portfolios')
      .update({ preferences, template_id: preferences.templateId || 'default' })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Save preferences error:', updateError);
      res.status(500).json({ error: { message: 'Failed to save preferences', code: 'DB_ERROR', status: 500 } });
      return;
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Save preferences error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'INTERNAL_ERROR', status: 500 } });
  }
});

// POST /api/portfolio/publish — set is_published=true, call revalidate
router.post('/publish', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: { message: 'Unauthorized', code: 'UNAUTHORIZED', status: 401 } });
      return;
    }

    const { error: updateError } = await supabase
      .from('portfolios')
      .update({ is_published: true })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Publish error:', updateError);
      res.status(500).json({ error: { message: 'Failed to publish portfolio', code: 'DB_ERROR', status: 500 } });
      return;
    }

    // Call revalidate asynchronously
    if (user.githubUsername) {
      // Find the actual custom username
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (profile) {
        // Await revalidate (Rule 6 -> Synchronous with publish action)
        await revalidatePath(`/portfolio/${profile.username}`);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Publish error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'INTERNAL_ERROR', status: 500 } });
  }
});

// POST /api/portfolio/unpublish — set is_published=false, call revalidate
router.post('/unpublish', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: { message: 'Unauthorized', code: 'UNAUTHORIZED', status: 401 } });
      return;
    }

    const { error: updateError } = await supabase
      .from('portfolios')
      .update({ is_published: false })
      .eq('user_id', user.id);

    if (updateError) {
      console.error('Unpublish error:', updateError);
      res.status(500).json({ error: { message: 'Failed to unpublish portfolio', code: 'DB_ERROR', status: 500 } });
      return;
    }

    // Call revalidate asynchronously
    if (user.githubUsername) {
      // Find the actual custom username
      const { data: profile } = await supabase
        .from('profiles')
        .select('username')
        .eq('id', user.id)
        .single();

      if (profile) {
        // Await revalidate (Rule 6 -> Synchronous with publish action)
        await revalidatePath(`/portfolio/${profile.username}`);
      }
    }

    res.status(200).json({ success: true });
  } catch (error) {
    console.error('Unpublish error:', error);
    res.status(500).json({ error: { message: 'Internal server error', code: 'INTERNAL_ERROR', status: 500 } });
  }
});

export default router;
