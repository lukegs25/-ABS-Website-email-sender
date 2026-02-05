# Subdomain Setup - Action Plan ✅

## Quick Summary

**Status:** Code is ready! ✅  
**What's Left:** Add subdomains in Resend and configure DNS records  
**Time Required:** ~15-30 minutes  
**Difficulty:** Easy (just follow the steps)

---

## ✅ What's Already Done

- ✅ All code updated to use subdomains
- ✅ Automatic fallback to root domain (works immediately)
- ✅ Centralized email configuration created
- ✅ All email endpoints updated

**The application will work right now** - it will use the root domain until subdomains are configured, then automatically switch to subdomains.

---

## 📋 What You Need to Do

### Step 1: Log into Resend (5 minutes)

1. Go to [https://resend.com](https://resend.com)
2. Log into your account
3. Navigate to **Domains** in the sidebar
4. Click on your domain: **`aiinbusinesssociety.org`**

### Step 2: Add Subdomains in Resend (5 minutes)

For each subdomain below, click **"Add Subdomain"** or **"Add Domain"**:

1. **`news.aiinbusinesssociety.org`**
   - Purpose: Newsletter and campaign emails
   - Click "Add" → Enter `news` → Save

2. **`notify.aiinbusinesssociety.org`**
   - Purpose: Notifications and reports
   - Click "Add" → Enter `notify` → Save

3. **`test.aiinbusinesssociety.org`**
   - Purpose: Test and diagnostic emails
   - Click "Add" → Enter `test` → Save

**Note:** Resend might show these as "pending" until DNS is configured - that's normal!

### Step 3: Get DNS Records from Resend (2 minutes)

For each subdomain you just added:

1. Click on the subdomain in Resend
2. You'll see DNS records that need to be added:
   - **SPF record** (TXT record)
   - **DKIM record(s)** (usually 2-3 CNAME records)
   - **DMARC record** (optional but recommended - TXT record)

3. **Copy all the DNS records** - you'll need them in the next step

### Step 4: Add DNS Records to Your Domain (10-15 minutes)

Go to your domain registrar (where you bought `aiinbusinesssociety.org`):

**Common registrars:**
- GoDaddy
- Namecheap
- Google Domains
- Cloudflare
- AWS Route 53

**Steps:**
1. Log into your domain registrar
2. Find **DNS Management** or **DNS Settings**
3. For each subdomain, add the DNS records from Resend:

   **Example for `news.aiinbusinesssociety.org`:**
   ```
   Type: TXT
   Name: news
   Value: [SPF record from Resend]
   
   Type: CNAME
   Name: [DKIM selector 1 from Resend]
   Value: [DKIM value from Resend]
   
   Type: CNAME
   Name: [DKIM selector 2 from Resend]
   Value: [DKIM value from Resend]
   ```

   **Repeat for:**
   - `notify` subdomain
   - `test` subdomain

4. **Save** all DNS records

### Step 5: Wait for DNS Propagation (5-60 minutes)

- DNS changes can take 5 minutes to 24 hours to propagate
- Usually takes 15-30 minutes
- You can check status at: [whatsmydns.net](https://www.whatsmydns.net)

### Step 6: Verify in Resend (2 minutes)

1. Go back to Resend Dashboard → Domains
2. Click on each subdomain
3. Click **"Verify"** button
4. Wait for green checkmark ✅

**All three subdomains should show:**
- ✅ Verified
- ✅ Status: Active

---

## 🎉 That's It!

Once all subdomains are verified:
- ✅ The application will automatically start using them
- ✅ No code changes needed
- ✅ No deployment needed (if already deployed)
- ✅ Emails will come from the new subdomains

---

## 🆘 Need Help?

### Can't find DNS settings?
- Look for: "DNS Management", "DNS Records", "Name Servers", or "Zone File"
- Contact your domain registrar's support

### DNS records not working?
- Double-check you copied them exactly from Resend
- Make sure there are no extra spaces
- Wait longer (up to 24 hours for full propagation)

### Resend verification failing?
- Check DNS records are correct
- Wait for DNS propagation (use whatsmydns.net to check)
- Contact Resend support if still failing after 24 hours

### Want to test before subdomains are ready?
The application works right now with the root domain! Just deploy and test. Subdomains will activate automatically once verified.

---

## 📝 Checklist

- [ ] Logged into Resend
- [ ] Added `news.aiinbusinesssociety.org` subdomain
- [ ] Added `notify.aiinbusinesssociety.org` subdomain  
- [ ] Added `test.aiinbusinesssociety.org` subdomain
- [ ] Copied DNS records from Resend for all 3 subdomains
- [ ] Added DNS records to domain registrar
- [ ] Waited for DNS propagation (15-30 min)
- [ ] Verified all 3 subdomains in Resend (green checkmarks)
- [ ] Tested sending an email (should use subdomain automatically)

---

## 🔍 How to Verify It's Working

After subdomains are verified, send a test email:

```bash
# Test newsletter email
curl -X POST https://your-domain.com/api/test-email

# Or test a signup notification
# Go to /student or /teacher and sign up
```

Check the email headers - the "From" address should show:
- `hello@news.aiinbusinesssociety.org` (for campaigns)
- `notifications@notify.aiinbusinesssociety.org` (for notifications)
- `diagnostics@test.aiinbusinesssociety.org` (for diagnostics)

---

**You've got this!** The hard part (code) is done. This is just clicking buttons and copying DNS records. 🚀
