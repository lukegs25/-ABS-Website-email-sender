CREATE TABLE member_featured_repos (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  repo_name TEXT NOT NULL,
  repo_url TEXT NOT NULL,
  description TEXT,
  language TEXT,
  stars INTEGER DEFAULT 0,
  display_order INTEGER DEFAULT 0,
  is_manual_entry BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE member_featured_repos ENABLE ROW LEVEL SECURITY;

-- Anyone can read repos (for public profiles)
CREATE POLICY "Featured repos are publicly readable"
  ON member_featured_repos FOR SELECT
  USING (true);

-- Users manage their own repos
CREATE POLICY "Users can manage own repos"
  ON member_featured_repos FOR ALL
  USING (auth.uid() = user_id);
