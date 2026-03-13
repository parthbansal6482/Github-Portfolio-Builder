import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { supabase } from '../lib/supabase.js';

const router = Router();

// GET /api/dashboard — return current user's portfolio row + view count
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user) {
      res.status(401).json({ error: { message: 'Unauthorized', code: 'UNAUTHORIZED', status: 401 } });
      return;
    }

    const { data: portfolio, error } = await supabase
      .from('portfolios')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 is "no rows returned"
      console.error('Fetch dashboard error:', error);
      res.status(500).json({ error: { message: 'Failed to fetch dashboard', code: 'DB_ERROR', status: 500 } });
      return;
    }

    if (!portfolio) {
      // Portfolio doesn't exist yet, return 404
      res.status(404).json({ error: { message: 'Portfolio not found', code: 'NOT_FOUND', status: 404 } });
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
      viewCount: portfolio.view_count,
      updatedAt: portfolio.updated_at,
    };

    res.status(200).json({
      portfolio: mappedPortfolio,
      viewCount: mappedPortfolio.viewCount,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    res.status(500).json({ error: { message: 'Internal server error', code: 'INTERNAL_ERROR', status: 500 } });
  }
});

export default router;
