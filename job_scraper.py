"""
Job board scraper for AI in Business Society.
Runs every Friday at 10:00 AM UTC (adjust cron if you need a different timezone).
Fetches from RemoteOK and OpenWeb Ninja JSearch, filters for titles containing "AI",
and upserts into Supabase.
"""
import os
import modal
from supabase import create_client

app = modal.App("ai in business society")

# Modal secret "job-scraper-secrets" must contain:
#   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
#   OPENWEB_NINJA_API_KEY (for JSearch jobs API)
JOB_SCRAPER_SECRETS = modal.Secret.from_name("job-scraper-secrets")

REMOTEOK_API = "https://remoteok.com/api"
OPENWEB_NINJA_BASE = "https://api.openwebninja.com/v1"


def normalize_job(raw: dict, source: str) -> dict | None:
    """Extract {title, company, url} from API response. Return None if missing/invalid."""
    # Support common field names across job APIs
    title = (
        raw.get("title")
        or raw.get("job_title")
        or raw.get("name")
        or raw.get("position")
    )
    company = (
        raw.get("company")
        or raw.get("company_name")
        or raw.get("employer")
        or raw.get("employer_name")
        or raw.get("organization", "")
    )
    url = (
        raw.get("url")
        or raw.get("link")
        or raw.get("apply_url")
        or raw.get("application_url")
        or raw.get("job_url")
        or raw.get("job_apply_link", "")
    )
    description = raw.get("description") or raw.get("job_description") or ""

    if not title or not isinstance(title, str):
        return None
    if not url or not isinstance(url, str):
        return None

    # Must contain "AI" in title (case-insensitive)
    if "ai" not in title.lower():
        return None

    return {
        "title": str(title).strip(),
        "company": str(company).strip() if company else "Unknown",
        "url": str(url).strip(),
        "description": str(description).strip()[:2000] if description else None,
        "source": source,
    }


def fetch_remoteok() -> list[dict]:
    """Fetch jobs from RemoteOK API (no auth). Returns list of job dicts."""
    import httpx

    try:
        resp = httpx.get(REMOTEOK_API, timeout=60)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"[job_scraper] RemoteOK fetch error: {e}")
        return []

    if not isinstance(data, list):
        return []
    # First element is metadata; rest are jobs
    jobs = [j for j in data[1:] if isinstance(j, dict)]
    return jobs


def fetch_openwebninja(api_key: str) -> list[dict]:
    """Fetch AI jobs from OpenWeb Ninja JSearch API."""
    import httpx

    if not api_key:
        print("[job_scraper] OPENWEB_NINJA_API_KEY not set")
        return []

    url = f"{OPENWEB_NINJA_BASE}/job-search"
    headers = {"X-API-Key": api_key}
    params = {"query": "AI engineer", "num_pages": 3}

    try:
        resp = httpx.get(url, headers=headers, params=params, timeout=60)
        resp.raise_for_status()
        data = resp.json()
    except Exception as e:
        print(f"[job_scraper] OpenWeb Ninja fetch error: {e}")
        return []

    if isinstance(data, list):
        return data
    if isinstance(data, dict):
        for key in ("jobs", "results", "data", "data"):
            if isinstance(data.get(key), list):
                return data[key]
    return []


@app.function(
    schedule=modal.Cron("0 10 * * 5"),  # Fridays 10:00 AM UTC
    secrets=[JOB_SCRAPER_SECRETS],
    image=modal.Image.debian_slim().pip_install("supabase", "httpx"),
)
def scrape_and_upsert_jobs():
    """Fetch from RemoteOK + OpenWeb Ninja, filter for AI titles, upsert into Supabase."""
    supabase_url = os.environ.get("SUPABASE_URL")
    supabase_key = os.environ.get("SUPABASE_SERVICE_ROLE_KEY")
    openweb_key = os.environ.get("OPENWEB_NINJA_API_KEY")

    if not all([supabase_url, supabase_key]):
        print("[job_scraper] Missing env: SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY")
        return

    supabase = create_client(supabase_url, supabase_key)
    rows = []

    # RemoteOK (no API key)
    for raw in fetch_remoteok():
        job = normalize_job(raw, "remoteok")
        if job:
            rows.append(job)

    # OpenWeb Ninja JSearch
    for raw in fetch_openwebninja(openweb_key or ""):
        job = normalize_job(raw, "openwebninja")
        if job:
            rows.append(job)

    if not rows:
        print("[job_scraper] No AI jobs found from either API")
        return

    # Dedupe by (title, company) to avoid duplicates
    seen = set()
    unique = []
    for r in rows:
        key = (r["title"].lower(), r["company"].lower())
        if key not in seen:
            seen.add(key)
            unique.append(r)

    # Upsert: insert new jobs; skip duplicates by (title, company)
    inserted = 0
    for r in unique:
        try:
            supabase.table("jobs").upsert(r, on_conflict=["title", "company"], ignore_duplicates=True).execute()
            inserted += 1
        except Exception as e:
            print(f"[job_scraper] Insert skip for {r.get('title')}: {e}")

    print(f"[job_scraper] Upserted {inserted} AI jobs (filtered from {len(rows)} candidates)")


@app.local_entrypoint()
def main():
    """Run scraper manually (for testing)."""
    scrape_and_upsert_jobs.remote()
