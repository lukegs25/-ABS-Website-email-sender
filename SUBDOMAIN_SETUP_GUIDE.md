# Subdomain Email Setup Guide

## Overview

This application now uses subdomains to segment email sending by purpose. This provides:

✅ **Better Reputation Management** - Issues with one email type don't affect others  
✅ **Clear Sending Purpose** - Recipients can see what type of email it is  
✅ **Improved Deliverability** - Better tracking and segmentation  
✅ **Professional Organization** - Cleaner email infrastructure  

## Email Types & Subdomains

The application uses the following subdomains:

| Purpose | Subdomain | Example Address | Used For |
|---------|-----------|----------------|----------|
| **Newsletters** | `news.aiinbusinesssociety.org` | `hello@news.aiinbusinesssociety.org` | Campaign emails, newsletters to subscribers |
| **Notifications** | `notify.aiinbusinesssociety.org` | `notifications@notify.aiinbusinesssociety.org` | Signup alerts, system notifications |
| **Reports** | `notify.aiinbusinesssociety.org` | `reports@notify.aiinbusinesssociety.org` | Campaign confirmation emails |
| **Diagnostics** | `test.aiinbusinesssociety.org` | `diagnostics@test.aiinbusinesssociety.org` | System diagnostics and testing |
| **Test Emails** | `test.aiinbusinesssociety.org` | `test@test.aiinbusinesssociety.org` | Manual test emails |

## Setup Instructions

### Step 1: Add Subdomains in Resend

1. Go to your [Resend Dashboard](https://resend.com/domains)
2. Click on your domain (`aiinbusinesssociety.org`)
3. Add the following subdomains:
   - `news.aiinbusinesssociety.org`
   - `notify.aiinbusinesssociety.org`
   - `test.aiinbusinesssociety.org`

### Step 2: Configure DNS Records

For each subdomain, Resend will provide DNS records to add. Typically you'll need:

**For `news.aiinbusinesssociety.org`:**
- SPF record
- DKIM record(s)
- DMARC record (optional but recommended)

**For `notify.aiinbusinesssociety.org`:**
- SPF record
- DKIM record(s)
- DMARC record

**For `test.aiinbusinesssociety.org`:**
- SPF record
- DKIM record(s)
- DMARC record

### Step 3: Verify Subdomains

1. After adding DNS records, wait for DNS propagation (usually 5-60 minutes)
2. In Resend dashboard, click "Verify" for each subdomain
3. Wait for verification to complete (green checkmark)

### Step 4: Enable Subdomains in Application

The application will automatically use subdomains once they're verified in Resend. 

**To temporarily disable subdomains** (fallback to root domain), set:
```bash
USE_SUBDOMAINS=false
```
in your environment variables.

## Fallback Behavior

If subdomains aren't configured or verified yet, the application will automatically fall back to using the root domain (`aiinbusinesssociety.org`) for all emails. This ensures the application continues working while you set up subdomains.

## Testing

After setting up subdomains:

1. **Test Newsletter Emails:**
   ```bash
   # Send a test campaign
   curl -X POST /api/test-email
   ```

2. **Test Notifications:**
   - Sign up a new subscriber at `/student` or `/teacher`
   - Check that notification email comes from `notify.aiinbusinesssociety.org`

3. **Test Diagnostics:**
   ```bash
   # Run diagnostic endpoint
   curl /api/diagnose-email
   ```

## Verification Checklist

- [ ] All three subdomains added in Resend dashboard
- [ ] DNS records configured for each subdomain
- [ ] All subdomains verified (green checkmarks)
- [ ] Test email sent successfully from each subdomain
- [ ] Checked spam folder - emails should arrive normally
- [ ] Verified email headers show correct subdomain

## Troubleshooting

### Emails Not Sending

1. **Check Resend Dashboard:**
   - Verify subdomains are added and verified
   - Check for any error messages

2. **Check DNS Records:**
   - Use `dig` or online DNS checker to verify records are propagated
   - Ensure SPF/DKIM records are correct

3. **Check Application Logs:**
   - Look for email sending errors
   - Verify `RESEND_API_KEY` is set correctly

4. **Fallback to Root Domain:**
   - Temporarily set `USE_SUBDOMAINS=false` to use root domain
   - This helps isolate if issue is subdomain-specific

### Subdomain Verification Failing

- **DNS Propagation:** Wait 24-48 hours for full propagation
- **Record Format:** Double-check DNS record format matches Resend's requirements exactly
- **Multiple DNS Providers:** If using multiple DNS providers, ensure records are added to the correct one

### Emails Going to Spam

- **SPF Records:** Ensure SPF records include Resend's servers
- **DKIM:** Verify DKIM records are properly configured
- **DMARC:** Consider adding DMARC policy for better deliverability
- **Warm-up:** New subdomains may need gradual warm-up (start with low volume)

## Benefits After Setup

Once subdomains are configured:

1. **Segmented Reputation:** Marketing emails won't affect transactional email deliverability
2. **Better Analytics:** Track open rates and engagement by email type
3. **Professional Appearance:** Clear email addresses show purpose
4. **Scalability:** Easy to add more subdomains for new purposes

## Code Reference

Email addresses are configured in `/lib/email-config.js`. To modify addresses or add new types, edit this file.

The application uses `getEmailAddressWithFallback()` function which:
- Uses subdomains when `USE_SUBDOMAINS` is not `false`
- Falls back to root domain if subdomains aren't available
- Allows custom "from" names while maintaining subdomain structure

## Support

If you encounter issues:
1. Check Resend documentation: https://resend.com/docs
2. Review DNS configuration in your domain registrar
3. Contact Resend support if verification continues to fail

---

**Note:** This setup is optional but recommended. The application will work with the root domain, but subdomains provide better email deliverability and organization.
