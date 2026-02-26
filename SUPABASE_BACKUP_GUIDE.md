# Supabase Backup Guide

## Your Current Situation

**Free tier Supabase projects do not get automatic daily backups.** Only Pro ($25/mo), Team, and Enterprise plans include built-in daily backups.

Without backups, if something goes wrong (accidental delete, corrupted data, project issue), you could lose your subscriber data, audiences, and everything in your database.

---

## What We've Set Up

### Automated GitHub Actions Backup (Free)

A workflow runs **daily at 6 AM UTC** and **on every push to main**. It:

1. Dumps your Supabase database (roles, schema, data) using the Supabase CLI
2. Stores the backup as a **workflow artifact** for 90 days
3. Can also be triggered manually via "Run workflow" in GitHub Actions

### One-Time Setup Required

1. **Get your database connection URL** from Supabase:
   - Go to [Supabase Dashboard](https://supabase.com/dashboard) → Your Project → **Settings** → **Database**
   - Use the **Direct connection** string (port 5432), not the pooler (6543)—pg_dump needs direct access
   - Format: `postgresql://postgres:[YOUR-PASSWORD]@db.[project-ref].supabase.co:5432/postgres`
   - Replace `[YOUR-PASSWORD]` with your database password (found in Project Settings → Database)

2. **Add it as a GitHub secret**:
   - Repo → **Settings** → **Secrets and variables** → **Actions**
   - **New repository secret** → Name: `SUPABASE_DB_URL` → Value: your connection string

3. **Test it**:
   - Go to **Actions** tab → "Supabase Database Backup" → **Run workflow**
   - After it completes, open the run → **Artifacts** → download and verify the files

### How to Restore

If you ever need to restore from a backup:

1. Download the artifact from a successful backup run
2. Use Supabase SQL Editor or `psql` to run the SQL files in order: `roles.sql` → `schema.sql` → `data.sql`
3. Or use `supabase db push` / manual restore—see [Supabase Restore docs](https://supabase.com/docs/guides/platform/backups)

---

## Backup Options Comparison

| Option | Cost | RPO (max data loss) | Best for |
|--------|------|---------------------|----------|
| **GitHub Actions** (what we set up) | Free | Up to 24 hours | Free tier, peace of mind |
| **Supabase Pro daily backups** | $25/mo | Up to 24 hours | Production apps |
| **Point-in-Time Recovery (PITR)** | $100–400/mo | ~2 minutes | Mission-critical data |

---

## Other Recommendations

1. **Verify the workflow runs**: Check Actions tab after the first scheduled run
2. **Download a backup now**: Run the workflow manually once and store a copy somewhere safe (e.g., password manager, encrypted drive)
3. **Keep this repo private**: Backup artifacts contain your data—don't make the repo public
4. **Consider Pro if this is critical**: If subscriber data is mission-critical, Supabase Pro ($25/mo) gives you built-in daily backups plus more resources

---

## Quick Checklist

- [ ] Add `SUPABASE_DB_URL` to GitHub Actions secrets
- [ ] Run the backup workflow manually and confirm it succeeds
- [ ] Download one backup and store it safely
- [ ] Check that this repository is **private**
