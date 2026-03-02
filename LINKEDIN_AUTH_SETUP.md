# LinkedIn Sign-In Setup

This guide explains how to enable "Sign in with LinkedIn" and build member profiles from LinkedIn data.

## ⚠️ Security: Regenerate Your Client Secret

**If you shared your LinkedIn Client Secret in plain text anywhere**, regenerate it immediately:

1. Go to [LinkedIn Developer Dashboard](https://www.linkedin.com/developers/apps)
2. Select your app (ai in business society)
3. Open **Auth** tab → **Client Secret** → **Regenerate**
4. Update the new secret in Supabase (see below)

The secret must never appear in your codebase or version control.

---

## 1. LinkedIn Developer Portal

1. Go to [LinkedIn Developer Dashboard](https://www.linkedin.com/developers/apps)
2. Select your app (or create one)
3. **Products**: Ensure "Sign In with LinkedIn using OpenID Connect" is added
   - Click **Products** → Request access for "Sign In with LinkedIn using OpenID Connect"
4. **Auth** tab:
   - Add your Supabase callback URL to **Authorized Redirect URLs**:
   - `https://<YOUR_SUPABASE_PROJECT_REF>.supabase.co/auth/v1/callback`
   - Example: `https://xbwxneswahlzaqosnqft.supabase.co/auth/v1/callback`
   - For local dev with Supabase CLI: `http://localhost:54321/auth/v1/callback`
5. Save your **Client ID** and **Client Secret** (you’ll need these for Supabase)

---

## 2. Supabase Dashboard

1. Go to [Supabase Dashboard](https://supabase.com/dashboard) → your project
2. **Authentication** → **Providers**
3. Expand **LinkedIn (OIDC)**
4. Enable it
5. Set:
   - **Client ID**: `86tdpqf5pfp3hs` (or your app’s Client ID)
   - **Client Secret**: your LinkedIn Client Secret (from step 1)

**Do not put the Client Secret in `.env` or code.** It is only configured in the Supabase Dashboard.

---

## 3. Database Migration

Run the profiles migration:

```bash
npx supabase db push
# or
supabase migration up
```

Or apply `supabase/migrations/002_create_profiles_table.sql` manually in the Supabase SQL Editor.

---

## 4. Redirect URLs (Supabase)

1. In Supabase Dashboard → **Authentication** → **URL Configuration**
2. Add your site’s callback to **Redirect URLs**:
   - Dev: `http://localhost:3000/auth/callback`
   - Prod: `https://yourdomain.com/auth/callback`

---

## 5. Test the Flow

1. Open `/login`
2. Click **Sign in with LinkedIn**
3. Authorize the app on LinkedIn
4. You should be redirected to `/member` with your profile populated from LinkedIn (name, photo, etc.)

---

## Environment Variables

Your app uses:

- `NEXT_PUBLIC_SUPABASE_URL` – Supabase project URL
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY` – Supabase anon/publishable key (for client-side auth)

LinkedIn credentials are stored only in Supabase (Authentication → Providers → LinkedIn OIDC), not in `.env`.
