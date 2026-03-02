-- member_stars: recognition for AI tool proficiency
-- member_id links to profiles (members sign in with LinkedIn)
CREATE TABLE IF NOT EXISTS member_stars (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  awarded_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  skill text,
  note text,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_member_stars_member_id ON member_stars (member_id);
CREATE INDEX IF NOT EXISTS idx_member_stars_created_at ON member_stars (created_at DESC);

ALTER TABLE member_stars ENABLE ROW LEVEL SECURITY;

-- Anyone can read stars (for public star users display)
CREATE POLICY "Anyone can read member_stars" ON member_stars
  FOR SELECT USING (true);

-- Only admins can insert/update/delete (enforced in API layer; service role bypasses RLS)

-- Allow public read of profiles for star users (for profile pages)
CREATE POLICY "Public can read star user profiles" ON profiles
  FOR SELECT USING (
    id IN (SELECT member_id FROM member_stars)
  );
