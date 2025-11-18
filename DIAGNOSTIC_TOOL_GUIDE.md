# Resend Email Diagnostic Tool

## Purpose
This diagnostic tool tests your Resend email configuration end-to-end to identify why emails are failing to send (0 sent, 647 failed).

## How to Use

### Option 1: Web Interface (Recommended)
1. Navigate to: `http://localhost:3000/diagnostic` (or your deployment URL + `/diagnostic`)
2. Click "▶️ Run Diagnostics"
3. Wait for results (takes ~10 seconds)
4. Review the detailed test results

### Option 2: API Direct Access
Visit: `http://localhost:3000/api/diagnostic-resend`

This will return JSON with all diagnostic results.

## What It Tests

### Test 1: Resend API Key Configuration ✓
- Checks if `RESEND_API_KEY` is set
- Verifies key format
- Shows key preview for verification

### Test 2: Resend Client Initialization ✓
- Confirms the Resend SDK can be initialized
- Validates API key format

### Test 3: Database Connection ✓
- Tests Supabase connection
- Verifies subscriber table access

### Test 4: Single Email Send 📧
**CRITICAL TEST**
- Attempts to send ONE email to lukegsine@gmail.com
- Tests basic email sending functionality
- Verifies domain and authentication

### Test 5: Batch Email Send 📦
**CRITICAL TEST**
- Attempts to send 2 emails using batch API
- Tests the batch send functionality that's failing in production
- Identifies if batch API is the problem

### Test 6: Domain Verification Check ℹ️
- Reminds you to verify domain in Resend dashboard
- Provides link to verify

## Understanding Results

### ✅ All Tests Pass
If all tests pass but 647 emails still fail:
- **Issue is scale/rate limiting** - not configuration
- Try sending smaller batches manually
- Check your Resend plan limits
- May need to upgrade plan or adjust batch sizes

### ❌ Test 4 Fails (Single Email)
**Root cause:** Basic email sending is broken
**Likely reasons:**
1. Domain `aiinbusinesssociety.org` not verified in Resend
2. Invalid API key
3. API key doesn't have send permissions
4. Resend account suspended or limited

**Fix:**
1. Go to https://resend.com/domains
2. Verify domain is listed and verified
3. Check API key in https://resend.com/api-keys
4. Generate new API key if needed

### ❌ Test 5 Fails (Batch Email)
**Root cause:** Batch API is not working
**Likely reasons:**
1. Resend plan doesn't support batch API
2. Batch API permissions not enabled
3. Bug in batch API usage

**Fix:**
1. Check your Resend plan features
2. Try upgrading if batch isn't included
3. Alternatively, send emails one-by-one (slower but works)

### ❌ Test 1 or 2 Fails (API Key)
**Root cause:** Environment variables not set
**Fix:**
1. Check `.env.local` file has `RESEND_API_KEY=re_...`
2. Restart development server
3. For production (Vercel), set in dashboard environment variables

## Common Issues & Solutions

### Issue: "Domain not verified"
**Solution:**
1. Login to https://resend.com
2. Go to Domains section
3. Add `aiinbusinesssociety.org`
4. Follow DNS verification steps
5. Wait for verification (can take up to 24 hours)

### Issue: "Invalid API key"
**Solution:**
1. Go to https://resend.com/api-keys
2. Create new API key
3. Copy the key (starts with `re_`)
4. Update in environment variables
5. Restart server

### Issue: "Rate limit exceeded"
**Solution:**
- This happens at scale, not in tests
- Increase delays between batches
- Reduce batch size
- Check Resend plan limits

### Issue: Tests pass but production fails
**Solution:**
- Likely a scale/volume issue
- Try sending to 10 subscribers first
- Gradually increase batch size
- Monitor Resend dashboard for rate limits

## Files Created
- `/app/api/diagnostic-resend/route.js` - API endpoint
- `/app/diagnostic/page.jsx` - Web interface
- `/DIAGNOSTIC_TOOL_GUIDE.md` - This file

## What to Share If Issues Persist
If the diagnostic tool doesn't resolve your issue, share:
1. Screenshot of the diagnostic results page
2. Any failed test details (error messages)
3. Your Resend plan type
4. Console logs from the diagnostic run

## Expected Timeline
- **Diagnostic runs in:** ~10 seconds
- **If tests pass:** Issue is scale-related, not config
- **If tests fail:** Follow the specific fixes for failed tests

## Next Steps After Running

### If All Pass ✅
The issue is the volume (647 emails), not the configuration. Solutions:
1. Break into smaller sends (100-200 at a time)
2. Increase delays between batches
3. Check Resend plan email quotas
4. Consider upgrading Resend plan

### If Tests Fail ❌
1. Follow the fixes for each failed test
2. Run diagnostics again after fixes
3. Once all pass, try sending to small test audience
4. Gradually scale up

## Technical Details

### Why This Helps
The diagnostic:
- Isolates the problem (config vs scale)
- Tests each component separately
- Provides specific error messages
- Gives actionable fixes

### What's Different from Production
- Sends only 1-2 test emails (not 647)
- Uses same code path as production
- Same API, same domain, same authentication
- If this works, production should too (at smaller scale)

## Pro Tip
Run this diagnostic anytime you:
- Update your Resend API key
- Change domain configuration  
- Experience email sending failures
- Deploy to new environment

