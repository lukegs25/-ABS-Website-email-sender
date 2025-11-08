# Email Send Error: "An error o... is not valid JSON"

## Problem
When trying to send an email from www.aiinbusinesssociety.org, you're getting:
```
Failed to send email: Unexpected token 'A', "An error o"... is not valid JSON
```

## What This Means
The server is returning **plain text or HTML** instead of JSON. The API endpoint is either:
1. Crashing before it can return a proper error
2. Being redirected by Next.js
3. Returning an error page instead of JSON

## What I've Fixed
I've improved the error handling in two places:

### 1. Frontend (`components/EmailComposer.jsx`)
- ✅ Now checks if response is JSON before parsing
- ✅ Shows a clear error message if not JSON
- ✅ Logs the actual response to console for debugging

### 2. Backend (`app/api/admin/send-email/route.js`)
- ✅ Added detailed logging at each step
- ✅ Better error handling for request body parsing
- ✅ More detailed error messages

## How to Diagnose

### Step 1: Check Browser Console
1. Open your website: www.aiinbusinesssociety.org
2. Open browser DevTools (F12 or right-click → Inspect)
3. Go to the **Console** tab
4. Try sending an email again
5. Look for red error messages that say:
   - `Non-JSON response:` followed by the actual text returned

**If you see this**, copy the full error text and we can figure out what's happening.

### Step 2: Check Server Logs
Look at your server console (where you run `pnpm dev` or check Vercel logs) for these messages:

- `🔵 [send-email] Starting email send request` - Did the request reach the API?
- `🔵 [send-email] Session check:` - Are you authenticated?
- `🔵 [send-email] Request body parsed successfully` - Did the body parse correctly?
- `❌` Any red X messages show where it's failing

### Step 3: Test Authentication
The most common cause is **not being logged in as admin**. To check:

1. Go to: www.aiinbusinesssociety.org/admin
2. Are you logged in?
3. Try logging out and logging back in
4. Then try sending the email again

## Common Causes & Solutions

### Cause 1: Not Logged In as Admin ⚠️ MOST COMMON
**Symptom**: Error says "Check if you're logged in as admin"

**Solution**:
1. Go to `/admin` 
2. Log in with your admin email
3. Try sending again

### Cause 2: Session Expired
**Symptom**: You were logged in but it's been a while

**Solution**:
1. Refresh the page
2. Log out and log back in
3. Clear cookies for the site

### Cause 3: Attachment Too Large
**Symptom**: Error when trying to send with attachments

**Solution**:
- Resend has a 40MB limit per email
- Try sending without attachments first
- Reduce attachment file sizes

### Cause 4: Invalid Email Data
**Symptom**: Error parsing request body

**Solution**:
- Check that subject and content are filled out
- Make sure at least one audience is selected
- Try removing special characters from subject/content

### Cause 5: Database Connection Issue
**Symptom**: Logs show "Database connection not available"

**Solution**:
- Check Supabase is running
- Verify `.env.local` has correct Supabase credentials
- Check Supabase service status

### Cause 6: Resend API Issue
**Symptom**: Gets past authentication but fails during send

**Solution**:
- Check Resend API key in `.env.local`
- Verify Resend account is active
- Check Resend API status

## Quick Test

Try this simpler API endpoint first to test if the server is working:

```bash
curl http://localhost:3000/api/audiences
```

**If this works**: Your server is fine, it's an authentication or email-specific issue

**If this fails**: Server/database issue

## Next Steps

1. **Refresh the page** and try sending again with the improved error handling
2. **Check the browser console** - you'll now see much more detailed errors
3. **Check server logs** - look for the 🔵 and ❌ emoji messages
4. **Share the error details** - tell me what the console says and we can fix it

## Files Changed
- ✅ `components/EmailComposer.jsx` - Better error handling
- ✅ `app/api/admin/send-email/route.js` - More logging and error details

The error message should now be much clearer about what's actually wrong!

