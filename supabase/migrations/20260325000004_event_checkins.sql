-- Migration: Add check-in fields to events and create event_checkins table

-- Add check-in columns to events table (if not already present)
ALTER TABLE events ADD COLUMN IF NOT EXISTS checkin_code TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS checkin_enabled BOOLEAN DEFAULT false;
ALTER TABLE events ADD COLUMN IF NOT EXISTS checkin_start TIMESTAMPTZ;
ALTER TABLE events ADD COLUMN IF NOT EXISTS checkin_end TIMESTAMPTZ;

-- Event check-ins table (email-based, separate from attendance)
CREATE TABLE IF NOT EXISTS event_checkins (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  subscriber_email TEXT NOT NULL,
  checked_in_at TIMESTAMPTZ DEFAULT NOW(),
  checkin_method TEXT DEFAULT 'code',
  star_awarded BOOLEAN DEFAULT false,
  UNIQUE(event_id, subscriber_email)
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_event_checkins_email ON event_checkins(subscriber_email);
CREATE INDEX IF NOT EXISTS idx_event_checkins_event ON event_checkins(event_id);

-- RLS policies
ALTER TABLE event_checkins ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert their own checkin"
  ON event_checkins FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view all checkins"
  ON event_checkins FOR SELECT
  USING (true);
