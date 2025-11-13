# Troubleshooting: Why didn't deanbean@student.byu.edu receive the Greg Michaelsen event email?

## Quick Summary
Your system pulls subscribers from **Supabase** when sending emails (not from Resend). So if an email didn't go out, it's one of these reasons:

## Most Likely Causes

### 1. **Email is not subscribed to the audience you sent to** ⚠️ MOST COMMON
   - You sent the email to Audience X
   - But deanbean@student.byu.edu is only subscribed to Audience Y
   - **Solution**: Check Query 1 & Query 6 in `DEBUG_QUERIES.sql`

### 2. **Email is not in the database at all**
   - They never signed up through the form
   - Or there was an error during signup
   - **Solution**: Run Query 1 in `DEBUG_QUERIES.sql`

### 3. **Wrong audience selected when sending**
   - You meant to send to "Everyone" but only sent to a specific subgroup
   - **Solution**: Check your email sending logs

### 4. **Email send error (less likely)**
   - Individual email send failed (check console logs)
   - Rate limiting issue
   - **Solution**: Check server logs from when you sent

## How to Debug

### Step 1: Check if the email exists in database
Run this in your Supabase SQL Editor:

```sql
SELECT 
    ns.email,
    ns.audience_id,
    a.name as audience_name,
    ns.created_at as subscribed_at
FROM new_subscribers ns
LEFT JOIN audiences a ON ns.audience_id = a.id
WHERE ns.email = 'deanbean@student.byu.edu'
ORDER BY ns.audience_id;
```

**If this returns nothing** → They never signed up. Add them manually.

**If this returns results** → Note which audience_id(s) they're subscribed to and proceed to Step 2.

### Step 2: Check what audiences exist
```sql
SELECT id, name 
FROM audiences 
ORDER BY id;
```

Look for an audience related to "Greg Michaelsen" or the event you sent about.

### Step 3: Verify which audience you sent to today
- Check your admin panel email history
- Check server logs
- **Critical question**: What audience ID did you select when sending the email?

### Step 4: Compare
- Is deanbean subscribed to Audience ID X?
- Did you send to Audience ID X?
- **If they don't match** → That's why they didn't receive it!

## Solutions

### Solution 1: If they're not in the database at all
Add them manually via Supabase:

```sql
-- Replace 8 with the audience ID you want to add them to
INSERT INTO new_subscribers (email, audience_id, is_student, major)
VALUES ('deanbean@student.byu.edu', 8, true, 'Unknown');
```

### Solution 2: If they're in the wrong audience
Add them to the correct audience:

```sql
-- Replace 8 with the Greg Michaelsen event audience ID
INSERT INTO new_subscribers (email, audience_id, is_student, major)
VALUES ('deanbean@student.byu.edu', 8, true, 'Unknown');
```

Note: One email can be subscribed to multiple audiences!

### Solution 3: Resend the email
Once they're in the right audience:
1. Go to Admin panel
2. Compose new email
3. Select the correct audience
4. Use "Test Mode" to verify they'll receive it
5. Send for real

## How Email Sending Works in Your System

```
[Signup Form] 
    ↓
[Saves to Supabase new_subscribers table]
    ↓
[Admin composes email and selects audience(s)]
    ↓
[System queries: SELECT email FROM new_subscribers WHERE audience_id IN (...)]
    ↓
[Sends individual emails via Resend API]
```

**Key Point**: Resend audiences are NOT used. The system pulls fresh data from Supabase every time.

## Prevention for Next Time

### Create a "All Events" audience
1. Create a new audience called "All Events" or "General Events"
2. When people sign up, also subscribe them to this audience
3. Send all event announcements to this audience

### OR send to main audience
If the Greg Michaelsen event is relevant to everyone:
- Send to Audience ID 8: "AI in Business (main)"
- This is the broadest audience

## Need More Help?

Run all the queries in `DEBUG_QUERIES.sql` and share the results. That will tell us exactly what's happening.

You can also visit:
- http://localhost:3000/admin/debug-subscriber (if dev server is running)
- Or use the Subscriber Manager in the admin panel to search for the email

## Files Created for You

1. **DEBUG_QUERIES.sql** - SQL queries to run in Supabase
2. **debug-subscriber.js** - Node script (needs dependencies)
3. **app/api/debug-subscriber/route.js** - API endpoint
4. **app/admin/debug-subscriber/page.jsx** - Web interface to check subscribers

Visit: http://localhost:3000/admin/debug-subscriber after starting your dev server.






