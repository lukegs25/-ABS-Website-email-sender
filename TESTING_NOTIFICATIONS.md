# Testing the Email Notification Feature

## Quick Test Steps

### 1. Deploy or Run Locally
```bash
# For local testing
npm run dev

# Or deploy to Vercel (recommended for testing Resend integration)
git add .
git commit -m "Add signup notification feature"
git push
```

### 2. Test a Signup

1. Go to your website's student signup page: `/student` or `/teacher`
2. Fill out the form with:
   - A test email (e.g., `test-user@byu.edu`)
   - Select a major/department
   - **Important**: Check the "AI in Business Society Email" checkbox
   - Optionally select other interest groups
3. Submit the form

### 3. Check for Notification

You should receive an email at `lukegsine@gmail.com` with:
- Subject: "🎉 New AI in Business Society Signup!"
- Details about the subscriber
- Their major, interests, etc.

### 4. Verify in Database

Check your Supabase database to confirm the subscriber was added:
```sql
SELECT * FROM new_subscribers 
WHERE email = 'test-user@byu.edu' 
ORDER BY created_at DESC;
```

## Important Notes

### Notification Triggers
The notification will **ONLY** be sent when:
- ✅ The user checks the "AI in Business Society Email" checkbox
- ✅ The subscription is successfully created in the database
- ✅ It's a new subscription (not a duplicate)

The notification will **NOT** be sent when:
- ❌ User only signs up for other groups (not the main AI in Business Society list)
- ❌ User is already subscribed to the main list
- ❌ There's an error creating the subscription

### Resend Configuration
⚠️ **IMPORTANT**: The notification email is configured to come from:
```
notifications@abs.resend.dev
```

If you haven't verified this domain in Resend, you'll need to either:
1. Verify `abs.resend.dev` in your Resend account, OR
2. Update the `from` address in `/app/api/subscribers/route.js` (line 76) to use your verified domain

Example:
```javascript
from: 'ABS Notifications <notifications@yourdomain.com>',
```

## Troubleshooting

### No Email Received?

1. **Check Resend Dashboard**
   - Log into your Resend account
   - Check the "Emails" section for delivery status
   - Look for any errors or bounces

2. **Check Gmail Spam Folder**
   - Sometimes first-time emails land in spam
   - Mark as "Not Spam" to train Gmail

3. **Verify Environment Variables**
   - Make sure `RESEND_API_KEY` is set correctly
   - Check Vercel dashboard or `.env.local` file

4. **Check Server Logs**
   - Look for console logs: "Notification email sent to..."
   - Or error messages: "Error sending notification email:"

5. **Test Resend Directly**
   - Use the test email API at `/api/test-email` to verify Resend is working

### Signup Works But No Notification?

- Check if the user actually selected the "AI in Business Society Email" checkbox
- Verify the audience name in your database matches the detection logic
- The main audience should have a name containing "ai in business" or "main" (case-insensitive)

### Check Audience Detection

Run this query in Supabase to see your audience names:
```sql
SELECT id, name FROM audiences ORDER BY id;
```

If your main audience has a different name, update the detection logic in `/app/api/subscribers/route.js` around line 46.

## What Gets Logged

You'll see console logs like:
```
Notification email sent to lukegsine@gmail.com for new subscriber: test-user@byu.edu
```

Or if there's an issue:
```
Error sending notification email: [error details]
Resend client not available - skipping notification
```

## Next Steps

Once you confirm it's working:
1. Test with multiple different scenarios (student, teacher, multiple groups)
2. Verify duplicate detection still works properly
3. Check that all email details are correct in the notification
4. Set up email filters in Gmail if you want to organize these notifications

## Need Help?

If you encounter issues:
1. Check the Resend dashboard first
2. Review server logs for error messages
3. Verify all environment variables are set
4. Make sure your Resend domain is verified


