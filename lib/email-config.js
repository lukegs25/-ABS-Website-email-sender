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

const DOMAIN = 'mail.aiinbusinesssociety.org';

/**
 * Email address configurations by purpose
 * All emails use the verified mail.aiinbusinesssociety.org subdomain
 */
export const emailAddresses = {
  // Newsletter/Campaign emails - main audience communications
  newsletter: {
    from: `AI in Business Society <hello@${DOMAIN}>`,
    name: 'AI in Business Society',
    purpose: 'Newsletters and campaign emails to subscribers'
  },

  // Notification emails - system notifications and alerts
  notifications: {
    from: `ABS Notifications <notifications@${DOMAIN}>`,
    name: 'ABS Notifications',
    purpose: 'System notifications and signup alerts'
  },

  // Campaign reports - admin confirmation emails
  reports: {
    from: `ABS Campaign Reports <reports@${DOMAIN}>`,
    name: 'ABS Campaign Reports',
    purpose: 'Campaign confirmation and summary emails'
  },

  // Diagnostic/Test emails - system testing and diagnostics
  diagnostics: {
    from: `ABS Diagnostics <diagnostics@${DOMAIN}>`,
    name: 'ABS Diagnostics',
    purpose: 'System diagnostics and test emails'
  },

  // Test emails - manual testing
  test: {
    from: `ABS Club <test@${DOMAIN}>`,
    name: 'ABS Club',
    purpose: 'Manual test emails'
  },

  // No-reply address for automated emails that shouldn't receive replies
  noreply: {
    from: `AI in Business Society <no-reply@${DOMAIN}>`,
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
 * Set USE_SUBDOMAINS=true in environment to use subdomains (default: root domain)
 */
export function getEmailAddressWithFallback(type, customName = null) {
  // Default to root domain (safer) - set USE_SUBDOMAINS=true explicitly to use subdomains
  const useSubdomains = process.env.USE_SUBDOMAINS === 'true';
  
  if (useSubdomains) {
    return getEmailAddress(type, customName);
  }

  // Use verified mail subdomain
  const mailDomain = 'mail.aiinbusinesssociety.org';
  const fallbackMap = {
    newsletter: `AI in Business Society <hello@${mailDomain}>`,
    notifications: `ABS Notifications <notifications@${mailDomain}>`,
    reports: `ABS Campaign Reports <reports@${mailDomain}>`,
    diagnostics: `ABS Diagnostics <diagnostics@${mailDomain}>`,
    test: `ABS Club <test@${mailDomain}>`,
    noreply: `AI in Business Society <no-reply@${mailDomain}>`
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
