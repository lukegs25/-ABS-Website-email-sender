import { cookies } from "next/headers";

/**
 * Get admin session from request cookies
 * @returns {Promise<{email: string, admin_type: string} | null>}
 */
export async function getAdminSession() {
  try {
    const cookieStore = await cookies();
    const auth = cookieStore.get('admin_auth');
    
    if (!auth) {
      return null;
    }
    
    const session = JSON.parse(auth.value);
    return {
      email: session.email,
      admin_type: session.admin_type
    };
  } catch (error) {
    console.error('Error parsing admin session:', error);
    return null;
  }
}

/**
 * Check if admin is SuperAdmin
 * @param {Object} session - Admin session object
 * @returns {boolean}
 */
export function isSuperAdmin(session) {
  if (!session || !session.admin_type) return false;
  const tokens = parseAdminTypeTokens(session);
  return tokens.some(tok => typeof tok === 'string' && tok.toLowerCase() === 'superadmin');
}

/**
 * Get allowed audience IDs for admin based on their type
 * If SuperAdmin, returns null (meaning all audiences allowed)
 * Otherwise returns array of audience IDs they can access
 * @param {Object} session - Admin session object
 * @returns {number[] | null}
 */
export function getAllowedAudienceIds(session) {
  if (!session) {
    return [];
  }
  
  // SuperAdmin has access to all audiences
  if (isSuperAdmin(session)) {
    return null; // null means all audiences
  }
  
  // Parse admin_type as comma-separated audience IDs
  // Example: "8,7" means access to audiences 8 and 7
  try {
    const audienceIds = session.admin_type
      .split(',')
      .map(id => parseInt(id.trim(), 10))
      .filter(id => !isNaN(id));
    
    return audienceIds.length > 0 ? audienceIds : [];
  } catch (error) {
    return [];
  }
}

/**
 * Verify admin has permission to access specific audience
 * @param {Object} session - Admin session object
 * @param {number} audienceId - Audience ID to check
 * @returns {boolean}
 */
export function canAccessAudience(session, audienceId) {
  if (!session) {
    return false;
  }
  
  const allowedIds = getAllowedAudienceIds(session);
  
  // null means all audiences allowed (SuperAdmin)
  if (allowedIds === null) {
    return true;
  }
  
  return allowedIds.includes(audienceId);
}

/**
 * Filter audience IDs based on admin permissions
 * @param {Object} session - Admin session object
 * @param {number[]} requestedIds - Requested audience IDs
 * @returns {number[]} Filtered audience IDs
 */
export function filterAudienceIds(session, requestedIds) {
  if (!session) {
    return [];
  }
  
  const allowedIds = getAllowedAudienceIds(session);
  
  // SuperAdmin can access all
  if (allowedIds === null) {
    return requestedIds;
  }
  
  // Filter to only allowed audiences
  return requestedIds.filter(id => allowedIds.includes(id));
}

/**
 * Parse admin_type into tokens that can be either numeric IDs or audience names.
 * Always lowercases string tokens. Returns empty array for invalid/missing.
 * @param {Object} session
 * @returns {Array<string|number>}
 */
export function parseAdminTypeTokens(session) {
  if (!session || !session.admin_type) {
    return [];
  }
  console.log("Admin type:", session.admin_type, "Type:", typeof session.admin_type);
  
  try {
    let tokens;
    
    // Handle if admin_type is already an array
    if (Array.isArray(session.admin_type)) {
      tokens = session.admin_type;
    } else if (typeof session.admin_type === 'string') {
      // Handle string format (comma-separated or JSON string)
      if (session.admin_type.trim().startsWith('[')) {
        // Try to parse as JSON array
        tokens = JSON.parse(session.admin_type);
      } else {
        // Split by comma
        tokens = session.admin_type.split(',');
      }
    } else {
      return [];
    }
    
    return tokens
      .map(tok => typeof tok === 'string' ? tok.trim() : tok)
      .filter(tok => tok && tok.length > 0)
      .map(tok => {
        const num = parseInt(tok, 10);
        if (!isNaN(num)) return num;
        return tok.toLowerCase();
      });
  } catch (error) {
    console.error("Error parsing admin_type:", error);
    return [];
  }
}

/**
 * Given a list of audiences, filter to those allowed by the admin tokens.
 * Tokens can be numeric IDs or lowercased names.
 * @param {Object} session
 * @param {{id:number, name:string}[]} audiences
 * @returns {{id:number, name:string}[]}
 */
export function filterAudiencesByAdmin(session, audiences) {
  if (!session) return [];
  if (isSuperAdmin(session)) return audiences;

  const tokens = parseAdminTypeTokens(session);
  console.log("Admin tokens:", tokens);
  if (tokens.length === 0) return [];

  return (audiences || []).filter(aud => {
    const nameLc = (aud.name || '').toLowerCase();
    return tokens.some(tok => {
      if (typeof tok === 'number') return tok === aud.id;
      return tok === nameLc;
    });
  });
}

/**
 * From a provided set of audience rows, return the IDs allowed per admin tokens.
 * Useful when you already fetched specific audiences (e.g. POST with requested IDs).
 * @param {Object} session
 * @param {{id:number, name:string}[]} audienceRows
 * @returns {number[]}
 */
export function filterAudienceIdsFromRows(session, audienceRows) {
  if (!session) return [];
  if (isSuperAdmin(session)) return (audienceRows || []).map(r => r.id);

  const tokens = parseAdminTypeTokens(session);
  if (tokens.length === 0) return [];

  return (audienceRows || [])
    .filter(aud => {
      const nameLc = (aud.name || '').toLowerCase();
      return tokens.some(tok => {
        if (typeof tok === 'number') return tok === aud.id;
        return tok === nameLc;
      });
    })
    .map(a => a.id);
}
