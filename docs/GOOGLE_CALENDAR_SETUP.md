# Google Calendar Integration Setup

This guide walks you through connecting your site to Google Calendar so admins can create events that sync to your calendar, and the home page can display upcoming events.

## Overview

- **Admin**: Log in at `/admin`, go to the **Events** tab, and create events. They are created directly in your Google Calendar.
- **Home page**: Shows an "Upcoming Events" section with the next 7 days from that calendar.

## Prerequisites

- A Google account
- A Google Calendar for the club (you can use your existing one)

---

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click the project dropdown → **New Project**
3. Name it (e.g. "ABS Website") and create
4. Select the new project

---

## Step 2: Enable the Calendar API

1. Go to **APIs & Services** → **Library**
2. Search for **Google Calendar API**
3. Open it and click **Enable**

---

## Step 3: Create a Service Account

1. Go to **APIs & Services** → **Credentials**
2. Click **Create Credentials** → **Service Account**
3. Name it (e.g. "ABS Calendar Sync") → **Create and Continue**
4. Skip optional steps → **Done**
5. Click the new service account
6. Go to the **Keys** tab → **Add Key** → **Create new key** → **JSON** → **Create**
7. A JSON file downloads. Keep it safe; you'll add it to your env.

---

## Step 4: Share the Calendar with the Service Account

1. Get the service account email from the JSON file: `"client_email": "something@project-id.iam.gserviceaccount.com"`
2. Open [Google Calendar](https://calendar.google.com/)
3. Find your club calendar → click the three dots → **Settings and sharing**
4. Under **Share with specific people**, click **Add people**
5. Paste the service account email
6. Set permission to **Make changes to events**
7. Save

---

## Step 5: Get the Calendar ID

1. In Google Calendar, open your club calendar
2. Scroll to **Integrate calendar** in the left sidebar
3. Copy the **Calendar ID** (e.g. `xxxxx@group.calendar.google.com`)

For your existing ABS calendar, the ID is typically:
`c240123c3faa5646577759508b44ade28fc0856486fa89ce91a7e69824214aef@group.calendar.google.com`

---

## Step 6: Add Environment Variables

Add these to `.env.local` (and your production environment):

```env
# Google Calendar (paste the entire JSON as a single line, or use the format below)
GOOGLE_SERVICE_ACCOUNT_JSON={"type":"service_account","project_id":"...","private_key_id":"...","private_key":"-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n","client_email":"...@....iam.gserviceaccount.com","client_id":"...","auth_uri":"...","token_uri":"...","auth_provider_x509_cert_url":"...","client_x509_cert_url":"..."}

# Your calendar ID (from Step 5)
GOOGLE_CALENDAR_ID=c240123c3faa5646577759508b44ade28fc0856486fa89ce91a7e69824214aef@group.calendar.google.com
```

For `GOOGLE_SERVICE_ACCOUNT_JSON`:

- Use the contents of the downloaded JSON file
- It must be a single line (no line breaks inside the string)
- Escape any quotes if needed, or use a string that your env loader accepts

**Alternative (if your host supports multi-line secrets):** Some platforms let you paste the full JSON. Ensure the variable name is `GOOGLE_SERVICE_ACCOUNT_JSON` and the value is valid JSON.

---

## Step 7: Restart and Test

1. Restart your dev server or redeploy
2. Go to `/admin` → **Events** tab
3. Create a test event
4. Check that it appears in Google Calendar
5. Confirm the home page shows it in "Upcoming Events"

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| "Calendar not configured" | Ensure `GOOGLE_SERVICE_ACCOUNT_JSON` and `GOOGLE_CALENDAR_ID` are set and the server was restarted |
| "Invalid credentials" | Confirm the JSON is valid and not truncated. Check for encoding issues |
| Events don't appear | Confirm the calendar is shared with the service account email with "Make changes to events" |
| Home page shows nothing | The public `/api/calendar/events` endpoint fetches from the same calendar; if the admin can create events, it should work |

---

## Summary

- **Admin login**: Already exists at `/admin` (same as email admin)
- **Events tab**: Create events that sync to Google Calendar
- **Home page**: Shows next 7 days of events from that calendar
- **Timezone**: Events use America/Denver (BYU)
