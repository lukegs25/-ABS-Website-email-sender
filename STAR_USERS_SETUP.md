# Star Users with LinkedIn Profiles

Star users are members who earn recognition for AI tool proficiency. Their profiles come from **LinkedIn login**.

## Flow

1. **Member signs in with LinkedIn** at `/login` → profile is created in `profiles`
2. **Admin awards a star** via API (see below)
3. **Star user appears** on the home page and has a public profile at `/stars/[id]`

## Database Setup

Run the migrations:

```bash
npx supabase db push
# or apply supabase/migrations/003_create_member_stars_table.sql manually
```

## Awarding Stars (Admin API)

**POST** `/api/admin/star-users`

Requires admin session (admin login cookie).

Body:
```json
{
  "member_id": "uuid-of-profile",
  "skill": "ChatGPT",
  "note": "Expert at prompt engineering"
}
```

- `member_id` – The `profiles.id` (same as `auth.users.id`) of the member. Get this from Supabase after they sign in with LinkedIn.
- `skill` – Optional. AI tool or skill they’re recognized for.
- `note` – Optional. Admin note.

## Finding `member_id`

From Supabase Dashboard → Table Editor → `profiles`, use the `id` of the member who signed in with LinkedIn.

## Public Profile

- Star users appear in the **Star users** section on the home page.
- Each card links to `/stars/[id]` with a full profile (avatar, name, headline, LinkedIn link, skills, notes).
