// =============================================================
// DATABASE MIGRATION REQUIRED — run this in Supabase SQL editor
// BEFORE deploying the enriched GitHub data feature:
//
//   ALTER TABLE portfolios ADD COLUMN enriched_github_data jsonb;
//
// This column stores the full EnrichedGitHubData payload as JSON.
// It is nullable — portfolios that haven't been enriched yet will have NULL.
// =============================================================

import { createClient } from '@supabase/supabase-js';

// Backend Supabase client — uses service role key for full access
// This client bypasses RLS and has read/write access to all tables


const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceRoleKey) {
  throw new Error(
    'Missing Supabase environment variables: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set'
  );
}

export const supabase = createClient(supabaseUrl, supabaseServiceRoleKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});
