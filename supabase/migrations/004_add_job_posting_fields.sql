-- Add fields to support direct company job postings with photo upload
ALTER TABLE jobs
  ADD COLUMN IF NOT EXISTS logo_url    text,
  ADD COLUMN IF NOT EXISTS location    text,
  ADD COLUMN IF NOT EXISTS job_type    text DEFAULT 'full-time',
  ADD COLUMN IF NOT EXISTS status      text DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS contact_email text;

-- Status values: 'pending' | 'approved' | 'rejected'
-- New direct submissions start as 'pending' and require admin approval

-- Only show approved jobs publicly
DROP POLICY IF EXISTS "Public read access" ON jobs;
CREATE POLICY "Public read approved jobs" ON jobs
  FOR SELECT USING (status = 'approved' OR source != 'direct');

-- Index to filter by status efficiently
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs (status);

-- Storage bucket for job company logos
-- Run in Supabase Dashboard > Storage > New bucket: "job-logos" (public)
-- Or via CLI: supabase storage create job-logos --public
