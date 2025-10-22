# Supabase Configuration Fix

## Problem
Users are receiving this error when trying to sign up:
> "@supabase/ssr: Your project's URL and API key are required to create a Supabase client!"

## Root Cause
The `.env.local` file is missing the **public/anon API key** for Supabase. 

Your current `.env.local` has:
- ✅ `NEXT_PUBLIC_SUPABASE_URL` - Set correctly
- ✅ `SUPABASE_SERVICE_ROLE_KEY` - Set correctly (for server-side)
- ❌ `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` - **MISSING** (for client-side)

## Solution

### Step 1: Get Your Supabase Anon Key

1. Go to your Supabase dashboard: https://supabase.com/dashboard
2. Select your project: **xbwxneswahlzaqosnqft**
3. Go to **Settings** → **API**
4. Copy the **anon/public** key (NOT the service_role key)

### Step 2: Update Your .env.local File

Open `/Users/lukesine/Desktop/AI/-ABS-Website-email-sender/.env.local` and replace this line:

```bash
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=your-anon-key-here
```

With:

```bash
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=eyJhbGciOiJI... [paste your actual anon key here]
```

The anon key typically starts with `eyJhbGciOiJI` and is very long (like a JWT token).

### Step 3: Restart Your Development Server

```bash
# Stop the current server (Ctrl+C)
# Then restart
pnpm dev
```

### Step 4: Update Vercel Environment Variables (IMPORTANT!)

**If your site is deployed on Vercel** (which it appears to be), you MUST also add the environment variable there:

1. Go to https://vercel.com/dashboard
2. Select your project
3. Go to **Settings** → **Environment Variables**
4. Add a new variable:
   - **Name**: `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY`
   - **Value**: [paste your anon key]
   - **Environments**: Select all (Production, Preview, Development)
5. Click **Save**
6. **Redeploy** your site (go to Deployments → click the three dots on the latest deployment → Redeploy)

⚠️ **Without this step, the production site will still show the error!**

### Step 5: Test the Signup

Go to your website and try signing up as a student or teacher. The error should be gone!

## Why This Happened

- **Client-side code** (StudentForm.jsx, TeacherForm.jsx) runs in the browser and needs the **public/anon key**
- **Server-side code** (API routes) uses the **service role key** which you already have
- The student and teacher signup forms use `createClient()` from `/utils/supabase/client.js` which expects the anon key

## Security Note

The **anon/public key** is safe to expose in client-side code (hence the NEXT_PUBLIC_ prefix). It has limited permissions controlled by your Supabase Row Level Security (RLS) policies.

The **service role key** should NEVER be exposed to the client (no NEXT_PUBLIC_ prefix).

## Quick Reference: Your Environment Variables

You should have all these in `.env.local`:

```bash
# Supabase URL (same for both client and server)
NEXT_PUBLIC_SUPABASE_URL=https://xbwxneswahlzaqosnqft.supabase.co

# Supabase anon key (for client-side - BROWSER)
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY=[GET THIS FROM SUPABASE DASHBOARD]

# Supabase service role key (for server-side - API routes)
SUPABASE_SERVICE_ROLE_KEY=[you already have this]

# Other keys (you already have these)
RESEND_API_KEY=[you already have this]
PERPLEXITY_API_KEY=[you already have this]
ADMIN_PASSWORD=[you already have this]
SKIP_DB_ON_LOGIN=true
```

