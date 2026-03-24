CREATE TABLE event_rsvps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_id TEXT NOT NULL,           -- Google Calendar event ID
  event_title TEXT,                  -- Cached event title for display
  event_date TIMESTAMPTZ,            -- Cached event date for queries
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, event_id)         -- One RSVP per user per event
);

ALTER TABLE event_rsvps ENABLE ROW LEVEL SECURITY;

-- Anyone can read RSVP counts
CREATE POLICY "RSVP counts are publicly readable"
  ON event_rsvps FOR SELECT
  USING (true);

-- Users can manage their own RSVPs
CREATE POLICY "Users can manage own RSVPs"
  ON event_rsvps FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own RSVPs"
  ON event_rsvps FOR DELETE
  USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_event_rsvps_event_id ON event_rsvps(event_id);
CREATE INDEX idx_event_rsvps_user_id ON event_rsvps(user_id);
CREATE INDEX idx_event_rsvps_event_date ON event_rsvps(event_date);
