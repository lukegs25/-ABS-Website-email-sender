-- Migration 004: Events, Attendance, Star Tiers, and Member Stars updates

-- Add missing columns to member_stars (event_name was used in code but missing from migration 003)
ALTER TABLE member_stars ADD COLUMN IF NOT EXISTS event_name text;
ALTER TABLE member_stars ADD COLUMN IF NOT EXISTS source text DEFAULT 'manual';
-- source values: 'manual' | 'event_attendance' | 'bonus'
ALTER TABLE member_stars ADD COLUMN IF NOT EXISTS star_count integer NOT NULL DEFAULT 1;

-- Events table: club events that award stars upon attendance
CREATE TABLE IF NOT EXISTS events (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  title text NOT NULL,
  description text,
  event_date timestamptz NOT NULL,
  location text,
  event_type text DEFAULT 'general',
  -- 'bootcamp' | 'speaker' | 'workshop' | 'social' | 'general'
  star_value integer DEFAULT 1,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_event_date ON events (event_date);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read events" ON events FOR SELECT USING (true);

-- Attendance table: tracks which members attended which events
CREATE TABLE IF NOT EXISTS attendance (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  member_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  event_id uuid REFERENCES events(id) ON DELETE CASCADE NOT NULL,
  checked_in_at timestamptz DEFAULT now(),
  check_in_method text DEFAULT 'manual',
  -- 'manual' | 'qr_code' | 'link'
  UNIQUE (member_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_attendance_event_id ON attendance (event_id);
CREATE INDEX IF NOT EXISTS idx_attendance_member_id ON attendance (member_id);

ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read attendance" ON attendance FOR SELECT USING (true);

-- Add event_id FK to member_stars (links event-based star awards to the event)
ALTER TABLE member_stars ADD COLUMN IF NOT EXISTS event_id uuid REFERENCES events(id) ON DELETE SET NULL;

-- Star tiers: admin-configurable reward milestones
CREATE TABLE IF NOT EXISTS star_tiers (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  tier_name text NOT NULL,
  min_stars integer NOT NULL,
  badge_emoji text DEFAULT '⭐',
  sort_order integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE star_tiers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read star_tiers" ON star_tiers FOR SELECT USING (true);

-- Insert default tiers
INSERT INTO star_tiers (tier_name, min_stars, badge_emoji, sort_order) VALUES
  ('AI Explorer', 1, '🌱', 1),
  ('AI Specialist', 10, '⭐', 2),
  ('AI Leader', 25, '🚀', 3),
  ('AI Champion', 50, '🏆', 4);

-- View: total stars per member (useful for leaderboard queries)
CREATE OR REPLACE VIEW member_star_totals AS
SELECT
  member_id,
  COALESCE(SUM(star_count), 0) AS total_stars,
  COUNT(DISTINCT event_id) FILTER (WHERE source = 'event_attendance') AS events_attended
FROM member_stars
GROUP BY member_id;
