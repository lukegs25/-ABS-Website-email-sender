-- Track when event password was generated for 5-minute expiry
ALTER TABLE events ADD COLUMN IF NOT EXISTS password_generated_at timestamptz DEFAULT NULL;

-- Link events to Google Calendar event IDs to avoid duplicates
ALTER TABLE events ADD COLUMN IF NOT EXISTS google_calendar_id text DEFAULT NULL;
