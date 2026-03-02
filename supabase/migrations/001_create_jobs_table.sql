-- Job board table for scraped and direct postings
CREATE TABLE IF NOT EXISTS jobs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company text NOT NULL,
  url text NOT NULL,
  description text,
  source text, -- 'scraper_1' | 'scraper_2' | 'direct'
  posted_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  UNIQUE(title, company)
);

-- Index for listing by date
CREATE INDEX IF NOT EXISTS idx_jobs_posted_at ON jobs (posted_at DESC);

-- RLS: allow public read, service role has full access
ALTER TABLE jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read access" ON jobs
  FOR SELECT USING (true);
