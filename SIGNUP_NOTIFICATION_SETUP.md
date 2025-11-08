# Signup Notification Feature

## Overview
This feature automatically sends an email notification to `lukegsine@gmail.com` whenever someone signs up for the **AI in Business Society** main email list.

## What Was Implemented

### 1. New API Endpoint (`/app/api/subscribers/route.js`)
Created a server-side API endpoint that:
- Handles new subscriber signups
- Inserts records into the Supabase database
- Detects when someone signs up for the main "AI in Business Society" audience
- Automatically sends a notification email to `lukegsine@gmail.com` with subscriber details

### 2. Updated Forms
Modified both `StudentForm.jsx` and `TeacherForm.jsx` to:
- Use the new API endpoint instead of directly inserting into Supabase
- Maintain all existing functionality (duplicate detection, multiple audience support, etc.)
- Now trigger automatic notifications when appropriate

### 3. Notification Email Format
When someone signs up for the AI in Business Society email, you'll receive an email with:
- **Subject**: 🎉 New AI in Business Society Signup!
- **Details**:
  - Subscriber's email address
  - Type (Student or Teacher/Faculty)
  - Major/Department
  - Which audiences they signed up for
  - Additional interests (if provided)

## Configuration

### Required Environment Variables
Make sure these are set in your environment (Vercel, .env.local, etc.):
- `RESEND_API_KEY` - Your Resend API key (already in use for sending emails)
- `NEXT_PUBLIC_SUPABASE_URL` - Your Supabase URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key
- `SUPABASE_SERVICE_ROLE_KEY` - Your Supabase service role key (for server-side operations)

### Resend "From" Address
The notification emails are sent from: `notifications@abs.resend.dev`

**Important**: You may need to update this to match your verified domain in Resend. To change it, edit line 76 in `/app/api/subscribers/route.js`:

```javascript
from: 'ABS Notifications <notifications@your-verified-domain.com>',
```

## How It Works

1. User visits `/student` or `/teacher` page and fills out the signup form
2. User checks the box for "AI in Business Society Email" (mainOptIn)
3. Form submits to `/api/subscribers` with subscription data
4. API endpoint:
   - Inserts new subscriptions into the database
   - Checks if any subscription is for the main "AI in Business Society" audience
   - If yes, sends notification email to `lukegsine@gmail.com`
5. User sees success message
6. You receive notification email with subscriber details

## Testing

To test the notification:
1. Visit `/student` or `/teacher` on your website
2. Enter a test email address
3. Check the "AI in Business Society Email" checkbox
4. Submit the form
5. Check `lukegsine@gmail.com` for the notification email

## Troubleshooting

### Notification Email Not Received
1. Check Resend dashboard for delivery status
2. Verify the "from" address is from a verified domain in Resend
3. Check spam folder in Gmail
4. Look at server logs for any error messages

### Signup Works But No Notification
1. Check if `RESEND_API_KEY` is set correctly
2. Verify the main audience is correctly identified (check database for audience names)
3. The notification will only be skipped if Resend client fails to initialize (logs will show "Resend client not available")

## Database Structure

The system identifies the main "AI in Business Society" audience by looking for:
- Audience names containing "ai in business"
- Audience names containing "main" (but not "scai")

If your audience has a different name, you may need to adjust the detection logic in `/app/api/subscribers/route.js` lines 46-50.


