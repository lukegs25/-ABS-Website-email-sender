-- Migration 005: Site content table for admin-editable website copy

CREATE TABLE IF NOT EXISTS site_content (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  page text NOT NULL,
  -- 'home' | 'student' | 'teacher' | 'global'
  section text NOT NULL,
  -- 'hero' | 'calendar_intro' | 'nav_links' | 'footer' | 'settings' | etc.
  content_key text NOT NULL,
  -- 'headline' | 'subheadline' | 'cta_label' | 'cta_url' | 'bg_image' | etc.
  content_value text,
  -- the actual content (text, URL, or JSON for complex data)
  content_type text DEFAULT 'text',
  -- 'text' | 'url' | 'image' | 'json' | 'html'
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz DEFAULT now(),
  UNIQUE (page, section, content_key)
);

CREATE INDEX IF NOT EXISTS idx_site_content_page ON site_content (page);
CREATE INDEX IF NOT EXISTS idx_site_content_page_section ON site_content (page, section);

ALTER TABLE site_content ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read site_content" ON site_content FOR SELECT USING (true);

-- Seed default home page content
INSERT INTO site_content (page, section, content_key, content_value, content_type) VALUES
  ('home', 'hero', 'headline', 'AI in Business Society', 'text'),
  ('home', 'hero', 'subheadline', 'BYU''s club connecting students and faculty with the tools, skills, and community to lead in an AI-driven world.', 'text'),
  ('home', 'hero', 'cta_student_label', 'Student Join', 'text'),
  ('home', 'hero', 'cta_student_url', '/student', 'url'),
  ('home', 'hero', 'cta_faculty_label', 'Faculty Join', 'text'),
  ('home', 'hero', 'cta_faculty_url', '/teacher', 'url'),
  ('home', 'star_members', 'heading', 'Star Members', 'text'),
  ('home', 'star_members', 'description', 'Recognized for AI tool proficiency and contributions to the club', 'text'),
  ('home', 'calendar_intro', 'heading', 'Upcoming Events', 'text'),
  ('home', 'jobs_section', 'heading', 'Job Board', 'text'),
  ('home', 'member_login', 'heading', 'Member Login', 'text'),
  ('home', 'member_login', 'description', 'Sign in with your LinkedIn account to build your member profile, save jobs, and access the member dashboard.', 'text'),
  ('global', 'settings', 'club_name', 'AI in Business Society', 'text'),
  ('global', 'settings', 'contact_email', 'abs@byu.edu', 'text'),
  ('global', 'settings', 'instagram_url', 'https://www.instagram.com/abs.byu/', 'url'),
  ('global', 'settings', 'linkedin_url', 'https://www.linkedin.com/company/ai-in-business-society/', 'url'),
  ('global', 'settings', 'club_url', 'https://clubs.byu.edu/link/club/18295873491185562', 'url'),
  ('student', 'hero', 'heading', 'Join as a Student', 'text'),
  ('student', 'hero', 'description', 'Sign up to receive updates, access events, and build your AI skills.', 'text'),
  ('teacher', 'hero', 'heading', 'Join as Faculty', 'text'),
  ('teacher', 'hero', 'description', 'Connect with students and stay informed about AI developments at BYU.', 'text')
ON CONFLICT (page, section, content_key) DO NOTHING;
