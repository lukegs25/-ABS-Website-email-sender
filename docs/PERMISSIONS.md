# Admin Permissions System

This document explains how the role-based access control (RBAC) system works in the ABS Website Email Sender.

## Overview

The system supports two types of admin users:
1. **SuperAdmin** - Full access to all features
2. **Audience-specific Admin** - Limited access to specific audiences

## How It Works

### Admin Type Field

In Supabase, the `new_subscribers` table has an `admin_type` field that determines user permissions:

- **`admin_type = "SuperAdmin"`** - User has full access:
  - Can send emails to ANY audience
  - Can manage (create/view) audiences
  - Can view all subscribers
  - Sees all tabs in the admin dashboard

- **`admin_type = "[audience_ids_or_names]"`** - User has limited access:
  - Format: Comma-separated audience IDs or names
  - Both forms are supported and can be mixed: `"8,7"`, `"Accounting,Marketing"`, or `"8,Marketing"`
  - Can ONLY send emails to their assigned audiences
  - Cannot manage audiences (no "Audiences" tab)
  - Only sees their assigned audiences in the email composer
  - Examples:
    - `admin_type = "8,7"` → access to "AI in Business (main)" and "SCAI - Students"
    - `admin_type = "Accounting"` → access to "Accounting" audience
    - `admin_type = "Accounting,Marketing"` → access to those two audiences

### Database Setup

To set up admin users in Supabase:

```sql
-- Create a SuperAdmin
UPDATE new_subscribers 
SET admin_type = 'SuperAdmin' 
WHERE email = 'admin@example.com';

-- Create an audience-specific admin (can access audiences 8 and 7)
UPDATE new_subscribers 
SET admin_type = '8,7' 
WHERE email = 'limited-admin@example.com';

-- Create an admin for a single audience
UPDATE new_subscribers 
SET admin_type = '8' 
WHERE email = 'single-audience-admin@example.com';

-- Create an admin using audience NAMES (case-insensitive match)
UPDATE new_subscribers 
SET admin_type = 'Accounting' 
WHERE email = 'accounting-admin@example.com';

-- Mixed IDs and Names
UPDATE new_subscribers 
SET admin_type = 'Marketing,8' 
WHERE email = 'mixed-admin@example.com';
```

## Features by Role

| Feature | SuperAdmin | Audience-specific Admin |
|---------|-----------|------------------------|
| View Templates | ✅ | ✅ |
| Compose Email | ✅ | ✅ (limited audiences) |
| Test Email | ✅ | ✅ |
| View Subscribers | ✅ | ✅ |
| Manage Audiences | ✅ | ❌ |
| Send to All Audiences | ✅ | ❌ |
| Send to Assigned Audiences | ✅ | ✅ |

## Implementation Details

### Frontend

1. **AdminAuth Component** (`components/AdminAuth.jsx`)
   - Parses admin session from cookie
   - Provides `useAdmin()` hook for accessing session data
   - Exposes: `email`, `admin_type`, `isSuperAdmin`

2. **EmailComposer Component** (`components/EmailComposer.jsx`)
   - Displays permission notice for non-SuperAdmin users
   - Audiences are filtered by the backend API

3. **Admin Dashboard** (`app/admin/page.jsx`)
   - Hides "Audiences" tab for non-SuperAdmin users
   - Displays user email and role badge

### Backend

1. **Authentication Helpers** (`lib/auth-helpers.js`)
   - `getAdminSession()` - Gets admin session from cookies
   - `isSuperAdmin(session)` - Checks if user is SuperAdmin
   - `getAllowedAudienceIds(session)` - Returns allowed audience IDs (null for SuperAdmin)
   - `filterAudienceIds(session, requestedIds)` - Filters audience IDs based on permissions

2. **API Routes**
   - **`/api/admin/send-email`** (POST)
     - Validates admin session
     - Filters requested audience IDs based on permissions
     - Rejects if user has no permission for any requested audience
   
   - **`/api/admin/send-email`** (GET)
     - Returns only audiences the admin has permission to access
   
   - **`/api/admin/audiences`** (POST)
     - Restricted to SuperAdmin only
     - Returns 403 Forbidden for non-SuperAdmin users

## Security Notes

1. **Server-side Enforcement**: All permissions are enforced on the backend. The frontend only hides UI elements for better UX, but cannot bypass backend checks.

2. **Cookie-based Auth**: Admin session is stored in HTTP-only cookies to prevent XSS attacks.

3. **Permission Filtering**: When a non-SuperAdmin tries to send to unauthorized audiences, the backend silently filters them out and logs the attempt.

## Example Audience IDs

| ID | Audience Name |
|----|--------------|
| 1 | SCAI - Teachers |
| 2 | Teachers supporting student group |
| 3 | Etc/general |
| 4 | Semi-conductors |
| 5 | Marketing |
| 6 | Finance |
| 7 | SCAI - Students |
| 8 | AI in Business (main) |
| 9 | Accounting |

## Troubleshooting

**Problem**: Admin user can't see any audiences
- **Solution**: Check that their `admin_type` field is set correctly in Supabase
- Verify the audience IDs exist in the `audiences` table

**Problem**: SuperAdmin can't manage audiences
- **Solution**: Ensure `admin_type = 'SuperAdmin'` (exact match, case-sensitive)

**Problem**: Changes to admin_type not taking effect
- **Solution**: Log out and log back in to refresh the session cookie
