-- GitFolio Database Schema
-- Run this in the Supabase SQL Editor

-- ============================================
-- 1. TABLES
-- ============================================

-- profiles table
CREATE TABLE IF NOT EXISTS profiles (
  id               uuid        PRIMARY KEY,  -- Supabase Auth user ID
  username         text        UNIQUE NOT NULL,
  github_username  text        UNIQUE NOT NULL,
  created_at       timestamptz DEFAULT now()
);

-- portfolios table
CREATE TABLE IF NOT EXISTS portfolios (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          uuid        REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  github_data      jsonb,
  preferences      jsonb,
  generated_copy   jsonb,
  template_id      text        DEFAULT 'minimal',
  is_published     boolean     DEFAULT false,
  view_count       integer     DEFAULT 0,
  updated_at       timestamptz DEFAULT now()
);

-- Index for fast portfolio lookups by user
CREATE INDEX IF NOT EXISTS idx_portfolios_user_id ON portfolios(user_id);

-- Index for fast public portfolio lookups by published status
CREATE INDEX IF NOT EXISTS idx_portfolios_published ON portfolios(is_published) WHERE is_published = true;

-- ============================================
-- 2. ROW LEVEL SECURITY
-- ============================================

-- Enable RLS on both tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

-- Policy 1: Profiles — owner can read and write their own row
CREATE POLICY "profiles_owner_select"
  ON profiles
  FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "profiles_owner_insert"
  ON profiles
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_owner_update"
  ON profiles
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Policy 2: Portfolios — owner can do everything on their own row
CREATE POLICY "portfolios_owner_all"
  ON portfolios
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Policy 3: Portfolios — anyone can read published portfolios
CREATE POLICY "portfolios_public_read"
  ON portfolios
  FOR SELECT
  USING (is_published = true);

-- ============================================
-- 3. UPDATED_AT TRIGGER
-- ============================================

-- Auto-update the updated_at column on portfolio changes
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_portfolios_updated_at
  BEFORE UPDATE ON portfolios
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
