# Job Board Scraper Setup

The Modal job scraper runs **every Friday at 10:00 AM UTC**, fetches from **RemoteOK** and **OpenWeb Ninja JSearch**, filters for titles containing "AI", and upserts into the Supabase `jobs` table.

## Data sources

- **RemoteOK** – https://remoteok.com/api (no API key)
- **OpenWeb Ninja JSearch** – https://api.openwebninja.com/v1/job-search (API key required)

## 1. Create the `jobs` table in Supabase

Run the migration in your Supabase SQL editor:

```sql
-- Copy contents from supabase/migrations/001_create_jobs_table.sql
```

Or run the file directly in Supabase Dashboard → SQL Editor.

## 2. Create Modal secret `job-scraper-secrets`

Create a secret in Modal with these keys:

| Key | Description |
|-----|-------------|
| `SUPABASE_URL` | Your Supabase project URL (e.g. `https://xxx.supabase.co`) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (Settings → API) |
| `OPENWEB_NINJA_API_KEY` | OpenWeb Ninja API key from https://app.openwebninja.com |

Create the secret:

```bash
modal secret create job-scraper-secrets \
  SUPABASE_URL="https://your-project.supabase.co" \
  SUPABASE_SERVICE_ROLE_KEY="your-service-role-key" \
  OPENWEB_NINJA_API_KEY="ak_your-openwebninja-api-key"
```

## 3. Deploy the scraper

```bash
modal deploy job_scraper.py
```

This deploys the scheduled function. It will run every Friday at 10:00 AM UTC.

## 4. Run manually (optional)

```bash
modal run job_scraper.py
```

## RemoteOK terms

Per [RemoteOK API Terms](https://remoteok.com/api): link back to Remote OK and mention it as a source when displaying jobs. Do not use their logo without permission.

## Timezone

The cron `0 10 * * 5` is 10:00 AM **UTC** (Friday). To use 10:00 AM Mountain Time (Denver/BYU), change to `0 17 * * 5` in `job_scraper.py` (17:00 UTC ≈ 10:00 AM MST).
