-- Add event password for self-service check-in
ALTER TABLE events ADD COLUMN IF NOT EXISTS event_password text DEFAULT NULL;

-- Add premier flag to jobs for gated recruiting
ALTER TABLE jobs ADD COLUMN IF NOT EXISTS is_premier boolean DEFAULT false;
