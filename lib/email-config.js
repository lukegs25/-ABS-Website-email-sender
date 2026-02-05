/**
 * Centralized Email Configuration with Subdomain Support
 * 
 * Using subdomains helps segment email sending by purpose:
 * - Protects reputation: issues with one type don't affect others
 * - Shows clear sending purpose
 * - Better deliverability and tracking
 * 
 * To use these subdomains, you need to:
 * 1. Add them in your Resend dashboard (Settings > Domains)
 * 2. Configure DNS records as instructed by Resend
 * 3. Verify each subdomain
 */

const DOMAIN = 'aiinbusinesssociety.org';

/**
 * Email address configurations by purpose
 */
export const emailAddresses = {
  // Newsletter/Campaign emails - main audience communications
  newsletter: {
    from: `AI in Business Society <hello@news.${DOMAIN}>`,
    name: 'AI in Business Society',
    purpose: 'Newsletters and campaign emails to subscribers'
  },

  // Notification emails - system notifications and alerts
  notifications: {
    from: `ABS Notifications <notifications@notify.${DOMAIN}>`,
    name: 'ABS Notifications',
    purpose: 'System notifications and signup alerts'
  },

  // Campaign reports - admin confirmation emails
  reports: {
    from: `ABS Campaign Reports <reports@notify.${DOMAIN}>`,
    name: 'ABS Campaign Reports',
    purpose: 'Campaign confirmation and summary emails'
  },

  // Diagnostic/Test emails - system testing and diagnostics
  diagnostics: {
    from: `ABS Diagnostics <diagnostics@test.${DOMAIN}>`,
    name: 'ABS Diagnostics',
    purpose: 'System diagnostics and test emails'
  },

  // Test emails - manual testing
  test: {
    from: `ABS Club <test@test.${DOMAIN}>`,
    name: 'ABS Club',
    purpose: 'Manual test emails'
  },

  // No-reply address for automated emails that shouldn't receive replies
  noreply: {
    from: `AI in Business Society <no-reply@notify.${DOMAIN}>`,
    name: 'AI in Business Society',
    purpose: 'Automated emails that don\'t accept replies'
  }
};

/**
 * Get email address by type
 * @param {string} type - One of: 'newsletter', 'notifications', 'reports', 'diagnostics', 'test', 'noreply'
 * @param {string} customName - Optional custom name to override the default
 * @returns {string} Formatted email address
 */
export function getEmailAddress(type, customName = null) {
  const config = emailAddresses[type];
  if (!config) {
    console.warn(`Unknown email type: ${type}, falling back to newsletter`);
    return emailAddresses.newsletter.from;
  }

  if (customName) {
    // Extract email from config and replace name
    const emailMatch = config.from.match(/<(.+)>/);
    if (emailMatch) {
      return `${customName} <${emailMatch[1]}>`;
    }
  }

  return config.from;
}

/**
 * Fallback to root domain if subdomains aren't configured yet
 * Set USE_SUBDOMAINS=false in environment to use root domain
 */
export function getEmailAddressWithFallback(type, customName = null) {
  const useSubdomains = process.env.USE_SUBDOMAINS !== 'false';
  
  if (useSubdomains) {
    return getEmailAddress(type, customName);
  }

  // Fallback to root domain
  const rootDomain = 'aiinbusinesssociety.org';
  const fallbackMap = {
    newsletter: `AI in Business Society <hello@${rootDomain}>`,
    notifications: `ABS Notifications <hello@${rootDomain}>`,
    reports: `ABS Campaign Reports <hello@${rootDomain}>`,
    diagnostics: `ABS Diagnostics <hello@${rootDomain}>`,
    test: `ABS Club <hello@${rootDomain}>`,
    noreply: `AI in Business Society <no-reply@${rootDomain}>`
  };

  const address = fallbackMap[type] || fallbackMap.newsletter;
  
  if (customName) {
    const emailMatch = address.match(/<(.+)>/);
    if (emailMatch) {
      return `${customName} <${emailMatch[1]}>`;
    }
  }

  return address;
}
