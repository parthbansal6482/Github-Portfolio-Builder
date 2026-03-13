-- Migration 002: Reset schema to correct types (dev environment — no prod data)
-- Drops both tables with CASCADE (removes all dependent policies, indexes, triggers)
-- then recreates them with user_id as text, matching 001_initial_schema.sql

-- Drop everything with CASCADE to handle dependent policies/indexes/triggers
DROP TABLE IF EXISTS portfolios CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- ============================================
-- Recreate profiles — id is TEXT (GitHub numeric user ID)
-- ============================================
CREATE TABLE profiles (
  id               text        PRIMARY KEY,  -- GitHub numeric user ID e.g. "179290013"
  username         text        UNIQUE NOT NULL,
  github_username  text        UNIQUE NOT NULL,
  created_at       timestamptz DEFAULT now()
);

-- ============================================
-- Recreate portfolios — user_id is TEXT referencing profiles.id
-- ============================================
CREATE TABLE portfolios (
  id               uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          text        REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  github_data      jsonb,
  preferences      jsonb,
  generated_copy   jsonb,
  template_id      text        DEFAULT 'minimal',
  is_published     boolean     DEFAULT false,
  view_count       integer     DEFAULT 0,
  updated_at       timestamptz DEFAULT now()
);

CREATE INDEX idx_portfolios_user_id ON portfolios(user_id);
CREATE INDEX idx_portfolios_published ON portfolios(is_published) WHERE is_published = true;

-- ============================================
-- RLS
-- ============================================
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE portfolios ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_owner_select"
  ON profiles FOR SELECT
  USING (auth.uid()::text = id);

CREATE POLICY "profiles_owner_insert"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid()::text = id);

CREATE POLICY "profiles_owner_update"
  ON profiles FOR UPDATE
  USING (auth.uid()::text = id)
  WITH CHECK (auth.uid()::text = id);

CREATE POLICY "portfolios_owner_all"
  ON portfolios FOR ALL
  USING (auth.uid()::text = user_id)
  WITH CHECK (auth.uid()::text = user_id);

CREATE POLICY "portfolios_public_read"
  ON portfolios FOR SELECT
  USING (is_published = true);

-- ============================================
-- updated_at trigger
-- ============================================
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
