/**
 * =============================================================================
 * ENRICHED GITHUB DATA ROUTES — Full API Handoff Document for Frontend Developer
 * =============================================================================
 *
 * This file provides two API endpoints for enriched GitHub developer insights.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ENDPOINT 1: POST /api/github/fetch-enriched
 * ─────────────────────────────────────────────────────────────────────────────
 * AUTH:       Required — pass the NextAuth session token as:
 *             Authorization: Bearer <session-token>
 *
 * REQUEST:    No body required.
 *
 * RESPONSE 200:
 *   { success: true, data: EnrichedGitHubData }
 *
 * RESPONSE 500 (with partial data):
 *   { success: false, error: string, partialData?: Partial<EnrichedGitHubData> }
 *   partialData is included if some fetches succeeded before the failure.
 *
 * ⚠️  SLOW ENDPOINT: Takes 3–8 seconds. Always show a loading state to users.
 *     Call this endpoint once on demand (e.g., user clicks "Refresh Insights"),
 *     NOT on every page load. Results are cached in the database.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * ENDPOINT 2: GET /api/github/enriched/:username
 * ─────────────────────────────────────────────────────────────────────────────
 * AUTH:       None — this is a public endpoint.
 *
 * RESPONSE 200:
 *   { data: EnrichedGitHubData }
 *
 * RESPONSE 202 (enrichment pending):
 *   { status: 'pending' }
 *   The portfolio exists but enrichment hasn't been generated yet.
 *   Frontend should show a "Insights not yet generated" state.
 *   Suggest the user triggers the POST endpoint to generate enrichment.
 *
 * RESPONSE 404:
 *   { error: { message, code: 'NOT_FOUND', status: 404 } }
 *   No portfolio found for this username.
 *
 * ─────────────────────────────────────────────────────────────────────────────
 * EnrichedGitHubData SHAPE (stored as JSON in portfolios.enriched_github_data):
 * ─────────────────────────────────────────────────────────────────────────────
 *   languageBreakdown: { [language: string]: number }
 *     — Language percentages by byte count. Values sum to 100. May be {}.
 *
 *   mostActiveRepos: ActiveRepo[]
 *     — Array of { name, commitCount, url }. Pre-sorted by commitCount desc.
 *       Length ≤ 6. May be [] if no recent commits were found.
 *
 *   externalPRsMerged: number
 *     — Count of merged PRs in repos the user doesn't own. May be 0.
 *
 *   externalReposContributed: string[]
 *     — "owner/repo" formatted strings. May be [].
 *
 *   commitPatterns: CommitPatterns
 *     — { byDayOfWeek, byHourOfDay, peakDay, peakHour, summary }
 *       byDayOfWeek keys: "Sun"–"Sat". byHourOfDay keys: "0"–"23". All UTC.
 *       summary is a human-readable string, always non-empty.
 *
 *   skillClusters: SkillCluster[]
 *     — AI-generated. 4–6 items. May be [] if AI call failed.
 *       Each: { skillName, technologies[], indicators[], evidenceRepos[] }
 *
 *   forkInterests: ForkInterest[]
 *     — AI-generated. 2–4 items. May be [] if no forks or AI call failed.
 *       Each: { category, repos[], description }
 *
 *   workingStyle: WorkingStyle
 *     — { explorationScore (0–100), breadthScore (0–100), summary (string) }
 *       Scores are arithmetic. summary is AI-written but has a guaranteed fallback.
 *
 *   generatedAt: string
 *     — ISO 8601 timestamp. Parse with new Date(generatedAt).
 *
 * =============================================================================
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth.js';
import { fetchEnrichedGitHubData } from '../lib/github.js';
import { supabase } from '../lib/supabase.js';

const router = Router();

/**
 * POST /api/github/fetch-enriched
 *
 * Fetches all enriched GitHub data for the authenticated user and saves it
 * to portfolios.enriched_github_data. This is a slow operation (3–8 seconds)
 * because it makes many parallel GitHub API calls followed by AI analysis.
 *
 * AUTH: Required — reads the user ID and access token from req.user set by auth middleware.
 *
 * REQUEST BODY: none
 *
 * RESPONSE 200:
 *   { success: true, data: EnrichedGitHubData }
 *
 * RESPONSE 500:
 *   { success: false, error: string, partialData?: Partial<EnrichedGitHubData> }
 *   Note: partialData is included if some fetches succeeded before the failure.
 *
 * FRONTEND NOTE: This endpoint is slow. Show a loading state. Do not call it
 * on every page load — call it once after the user publishes, or when the user
 * explicitly clicks "Refresh insights."
 */
router.post('/fetch-enriched', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;

    // Validate that auth middleware populated the user with required fields
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

    // 1. Fetch the existing github_data snapshot from the portfolio (needed for enrichment)
    //    The orchestrator uses allRepos from the existing snapshot to avoid re-fetching.
    const { data: portfolioRow, error: portfolioFetchError } = await supabase
      .from('portfolios')
      .select('id, github_data')
      .eq('user_id', user.id)
      .single();

    if (portfolioFetchError || !portfolioRow?.github_data) {
      res.status(404).json({
        error: {
          message:
            'No GitHub data snapshot found. Please complete the initial GitHub sync (POST /api/github/fetch) before generating enriched insights.',
          code: 'NO_SNAPSHOT',
          status: 404,
        },
      });
      return;
    }

    // 2. Run the full enrichment orchestrator — fetches, scores, and AI analysis
    const enrichedData = await fetchEnrichedGitHubData(
      portfolioRow.github_data,
      user.githubUsername,
      user.accessToken
    );

    // 3. Save the enriched payload to the portfolios table
    const { error: saveError } = await supabase
      .from('portfolios')
      .update({ enriched_github_data: enrichedData })
      .eq('id', portfolioRow.id);

    if (saveError) {
      console.error('[POST /fetch-enriched] Failed to save enriched data:', saveError);
      // Return the enriched data even if saving fails — the frontend can display it
      res.status(500).json({
        success: false,
        error: 'Enrichment completed but failed to save to database. Data returned below.',
        partialData: enrichedData,
      });
      return;
    }

    // 4. Return the complete enriched payload
    res.status(200).json({ success: true, data: enrichedData });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[POST /fetch-enriched] Unexpected error:', message);
    res.status(500).json({
      success: false,
      error: 'Enrichment failed: ' + message,
    });
  }
});

/**
 * GET /api/github/enriched/:username
 *
 * Returns the stored enriched_github_data for a given GitHub username.
 * This is a public route — no auth required. Same visibility as the published portfolio.
 *
 * AUTH: None
 *
 * RESPONSE 200:
 *   { data: EnrichedGitHubData }
 *
 * RESPONSE 202 (data pending):
 *   { status: 'pending' }
 *   Portfolio exists but enrichment hasn't been generated yet.
 *
 * RESPONSE 404:
 *   { error: { message, code: 'NOT_FOUND', status: 404 } }
 *   No portfolio found for this username.
 *
 * FRONTEND NOTE: Handle the 202 case — show a CTA for the user to trigger enrichment.
 * Do not poll this endpoint repeatedly; prompt the user to click "Generate Insights".
 */
router.get('/enriched/:username', async (req: Request, res: Response) => {
  try {
    const { username } = req.params;

    // Look up the portfolio by github_username column in the profiles table + join
    // We look up by profiles.github_username and join to portfolios
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('id')
      .eq('github_username', username)
      .single();

    if (profileError || !profile) {
      res.status(404).json({
        error: {
          message: `No portfolio found for username "${username}"`,
          code: 'NOT_FOUND',
          status: 404,
        },
      });
      return;
    }

    // Fetch the portfolio + enriched data for this user
    const { data: portfolio, error: portfolioError } = await supabase
      .from('portfolios')
      .select('enriched_github_data')
      .eq('user_id', profile.id)
      .single();

    if (portfolioError || !portfolio) {
      res.status(404).json({
        error: {
          message: `No portfolio data found for username "${username}"`,
          code: 'NOT_FOUND',
          status: 404,
        },
      });
      return;
    }

    // If portfolio exists but enrichment hasn't been generated yet, return 202 pending
    if (!portfolio.enriched_github_data) {
      res.status(202).json({ status: 'pending' });
      return;
    }

    // Return the stored enriched data
    res.status(200).json({ data: portfolio.enriched_github_data });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('[GET /enriched/:username] Error:', message);
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
