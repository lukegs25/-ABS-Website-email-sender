# Email System Diagnostic Guide

## 🔍 How to Run Diagnostics

I've created a comprehensive diagnostic tool that will test every component of your email system and tell you exactly what's wrong.

### Access the Diagnostic Page

**Option 1: Via Browser**
1. Go to: `http://localhost:3000/diagnose` (or your deployment URL + `/diagnose`)
2. Click "▶️ Run Diagnostics"
3. Wait for all tests to complete
4. Review the results

**Option 2: Via API (for logs)**
```bash
curl http://localhost:3000/api/diagnose-email
```

## 🧪 What It Tests

The diagnostic tool runs **6 comprehensive tests**:

### 1. ✅ Environment Variables
- Checks if `RESEND_API_KEY` is set
- Shows key preview (first 8 characters)
- Verifies key length

**If this fails:** Your API key isn't set in environment variables

### 2. ✅ Resend Client Initialization
- Tests if the Resend client can initialize
- Verifies the client object is created

**If this fails:** There's an issue with the Resend library or API key format

### 3. ✅ Database Connection
- Tests Supabase connectivity
- Tries to read one subscriber record

**If this fails:** Database connection issues (not related to email sending)

### 4. 🎯 Single Email Send (CRITICAL TEST)
- Sends one test email to `lukegsine@gmail.com`
- Uses the same domain as production: `no-reply@aiinbusinesssociety.org`
- Returns the email ID if successful

**If this fails:** This is likely your core issue!
- Check error message for specifics
- Common issues:
  - Domain not verified in Resend
  - API key invalid or expired
  - Rate limiting
  - DNS/SPF/DKIM issues

### 5. 🎯 Batch Send Test (CRITICAL TEST)
- Sends 2 emails using the batch API (same as production)
- Tests the exact same code path as your 647-email campaign
- Shows response structure

**If this fails but single email passes:**
- Batch API specific issue
- Response format might be different than expected
- Check the response structure in the output

### 6. ✅ Subscriber Count
- Verifies you can read all subscribers from database
- Shows total count

## 📊 Understanding Results

### Status Indicators

- **✅ PASS** - Test succeeded, component working
- **❌ FAIL** - Test failed with a known error
- **🔥 ERROR** - Test threw an exception
- **⏭️ SKIP** - Test was skipped (dependency failed)

### Overall Status

- **✅ ALL TESTS PASSED** - Email system is fully functional
- **⚠️ PARTIAL FAILURE** - Some tests failed, but email might work
- **❌ CRITICAL FAILURE** - Core email functionality broken

## 🔧 Troubleshooting Based on Results

### Scenario 1: "Single Email Send" FAILS
**This is the most likely issue!**

Check the error message. Common errors:

#### Error: "Domain not verified"
**Solution:**
1. Go to https://resend.com/domains
2. Verify `aiinbusinesssociety.org` is listed and verified
3. If not, add it and complete DNS verification (SPF, DKIM)

#### Error: "Invalid API key" or "Unauthorized"
**Solution:**
1. Go to https://resend.com/api-keys
2. Create a new API key
3. Update your `.env.local` or environment variables:
   ```
   RESEND_API_KEY=re_your_new_key_here
   ```
4. Restart your development server or redeploy

#### Error: "Rate limit exceeded"
**Solution:**
- Wait 1 hour
- Check your Resend plan limits
- Reduce batch size (already done in latest code)

### Scenario 2: "Batch Send" FAILS but Single Email PASSES
**This is interesting and tells us it's batch-specific**

Check the response structure in the diagnostic output:
- If `responseType: 'array'` - Expected, check individual email errors
- If `responseType: 'object'` - Batch API returning different format

**Solution:**
The enhanced logging in send-email route will now show exactly what's happening. Look for:
```javascript
{
  hasData: true/false,
  dataType: 'array' or 'object',
  hasError: true/false
}
```

### Scenario 3: ALL TESTS PASS
**This means Resend is working!**

If diagnostics pass but 647-email send fails:
1. **Timeout issue** - 647 emails might take too long
2. **Memory issue** - Too many emails at once
3. **Resend plan limit** - Check your daily/hourly sending limits

**Solutions:**
- Split into smaller campaigns (200 at a time)
- Increase `maxDuration` in send-email route
- Upgrade Resend plan if at limit

## 📧 What Gets Sent During Diagnostics

The diagnostic will send **3 test emails** to `lukegsine@gmail.com`:
1. One single email (test #4)
2. Two batch emails (test #5)

Check your inbox for these. If you receive them, Resend is working!

## 🎯 Next Steps After Running Diagnostics

1. **Run the diagnostic** - Click the button!
2. **Screenshot the results** - Capture the entire page
3. **Check your email** - Did you receive the 3 test emails?
4. **Look at the "Batch Send" test details** - This shows the exact response format

### If All Tests Pass:
- The issue is specific to high-volume sending
- Try sending to a smaller audience first (test with 50 subscribers)
- Check Resend dashboard for rate limit warnings

### If Tests Fail:
- The error message will tell you exactly what to fix
- Most common: Domain not verified in Resend
- Fix the issue and run diagnostics again

## 🚨 Emergency Workaround

If you need to send emails NOW while we debug:

1. Go to Admin Portal
2. Export subscribers for your audience (Download CSV button)
3. Import into Resend directly via their dashboard
4. Send campaign through Resend's interface

This bypasses your app entirely but gets emails out.

## 📝 Files Created

- `/app/api/diagnose-email/route.js` - API endpoint for diagnostics
- `/app/diagnose/page.jsx` - Diagnostic UI page
- `/DIAGNOSTIC_GUIDE.md` - This file

## 🔗 Quick Links

- Diagnostic Page: `/diagnose`
- Resend Dashboard: https://resend.com
- Resend Domains: https://resend.com/domains
- Resend API Keys: https://resend.com/api-keys
- Resend Emails Log: https://resend.com/emails

