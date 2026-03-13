import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { fetchGitHubData, fetchEnrichedGitHubData } from '../lib/github.js';
import { supabase } from '../lib/supabase.js';

const router = Router();

/**
 * Shared handler for both initial GitHub fetch and re-sync.
 *
 * WHAT IT DOES (in order):
 *  1. Fetches core GitHub data (repos, profile, contributions) via fetchGitHubData.
 *  2. Runs the enrichment pipeline (fetchEnrichedGitHubData) in a non-blocking try/catch.
 *     If enrichment fails, the sync still succeeds — enriched_github_data is saved as null.
 *  3. Saves both github_data and enriched_github_data to the portfolios table in one write.
 *
 * TIMING NOTE: With enrichment, this now takes 5–11 seconds instead of 1–2 seconds.
 * Always show a loading state on the frontend when this endpoint is called.
 *
 * FRONTEND NOTE: On success, enriched_github_data in the DB will be populated.
 * The GET /api/github/enriched/:username endpoint can then read it immediately.
 */
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

    // 1. Fetch core GitHub data
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

    const githubData = fetchResult.data;

    // 2. Run enrichment pipeline — non-blocking, failures are graceful
    // If this fails, enriched_github_data is stored as null (not an error for the sync overall).
    let enrichedGitHubData = null;
    try {
      enrichedGitHubData = await fetchEnrichedGitHubData(
        githubData,
        user.githubUsername,
        user.accessToken
      );
      console.info(`[handleGitHubSync] Enrichment complete for ${user.githubUsername}`);
    } catch (enrichErr) {
      console.warn(
        `[handleGitHubSync] Enrichment failed for ${user.githubUsername} — saving null:`,
        enrichErr instanceof Error ? enrichErr.message : enrichErr
      );
    }

    // 3. Save both github_data and enriched_github_data to Supabase in one write
    const { data: existingPortfolio, error: fetchError } = await supabase
      .from('portfolios')
      .select('id')
      .eq('user_id', user.id)
      .single();

    if (fetchError && fetchError.code !== 'PGRST116') {
      console.error('Error finding portfolio:', fetchError);
      res.status(500).json({ error: { message: 'Database error finding portfolio', code: 'DB_ERROR', status: 500 } });
      return;
    }

    let saveError;
    if (existingPortfolio) {
      const { error } = await supabase
        .from('portfolios')
        .update({
          github_data: githubData,
          enriched_github_data: enrichedGitHubData, // null if enrichment failed
        })
        .eq('id', existingPortfolio.id);
      saveError = error;
    } else {
      const { error } = await supabase
        .from('portfolios')
        .insert({
          user_id: user.id,
          github_data: githubData,
          enriched_github_data: enrichedGitHubData, // null if enrichment failed
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

    // Return github_data (base shape) + signal whether enrichment succeeded
    res.status(200).json({
      ...githubData,
      enrichmentStatus: enrichedGitHubData ? 'complete' : 'unavailable',
    });
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
