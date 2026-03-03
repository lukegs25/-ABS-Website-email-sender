-- Create the public storage bucket for job company logos
INSERT INTO storage.buckets (id, name, public)
VALUES ('job-logos', 'job-logos', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to read objects from the bucket
CREATE POLICY "Public read job logos"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'job-logos');
