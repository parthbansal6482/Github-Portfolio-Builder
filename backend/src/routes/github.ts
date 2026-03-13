import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { fetchGitHubData } from '../lib/github.js';
import { supabase } from '../lib/supabase.js';

const router = Router();

// Helper function to handle fetching and saving
async function handleGitHubSync(req: Request, res: Response, isResync: boolean) {
  try {
    const user = req.user;
    if (!user || !user.accessToken || !user.githubUsername) {
      res.status(401).json({
        error: {
          message: 'Missing GitHub access token or username in session',
          code: 'UNAUTHORIZED_GITHUB',
          status: 401,
        },
      });
      return;
    }

    // 1. Fetch from GitHub
    const fetchResult = await fetchGitHubData(user.githubUsername, user.accessToken);

    if (!fetchResult.success) {
      res.status(502).json({
        error: {
          message: fetchResult.error,
          code: fetchResult.code,
          status: 502,
        },
      });
      return;
    }

    // 2. Save snapshot to Supabase
    // We check if a portfolio already exists for this user_id
      const { data: existingPortfolio, error: fetchError } = await supabase
        .from('portfolios')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') { // PGRST116 = no rows found
         console.error('Error finding portfolio:', fetchError);
         res.status(500).json({ error: { message: 'Database error finding portfolio', code: 'DB_ERROR', status: 500 } });
         return;
      }

      let saveError;
      if (existingPortfolio) {
        // Update
        const { error } = await supabase
          .from('portfolios')
          .update({ github_data: fetchResult.data })
          .eq('id', existingPortfolio.id);
        saveError = error;
      } else {
        // Insert
        // Default preferences can be null until wizard is finished
        const { error } = await supabase
          .from('portfolios')
          .insert({
            user_id: user.id,
            github_data: fetchResult.data,
          });
        saveError = error;
      }

    if (saveError) {
      console.error('Failed to save GitHub snapshot:', saveError);
      res.status(500).json({
        error: {
          message: 'Failed to save GitHub data to database',
          code: 'DB_ERROR',
          status: 500,
        },
      });
      return;
    }

    // Return the GitHub data
    res.status(200).json(fetchResult.data);
  } catch (error) {
    console.error(`GitHub ${isResync ? 'resync' : 'fetch'} error:`, error);
    res.status(500).json({
      error: {
        message: 'Internal server error',
        code: 'INTERNAL_ERROR',
        status: 500,
      },
    });
  }
}

// POST /api/github/fetch — fetch GitHub data, save snapshot, return GitHubData
router.post('/fetch', requireAuth, (req: Request, res: Response) => {
  handleGitHubSync(req, res, false);
});

// POST /api/github/resync — re-fetch GitHub, overwrite snapshot, return new GitHubData
router.post('/resync', requireAuth, (req: Request, res: Response) => {
  handleGitHubSync(req, res, true);
});

export default router;
