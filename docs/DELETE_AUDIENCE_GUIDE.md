# Delete Audience Feature Guide

## Overview

Super admins can now delete audiences with automatic email migration to the main ABS audience to prevent data loss.

## Features

### 🗑️ **Delete Audience Button**
- Located next to each audience in the "Manage Audiences" section
- **Only visible to Super Admins**
- **Protected**: Cannot delete the main ABS audience (ID 8)

### 📧 **Automatic Email Migration**
Before deleting an audience, the system automatically:
1. **Retrieves all subscribers** from the audience being deleted
2. **Checks for duplicates** in the main ABS audience
3. **Migrates non-duplicate emails** to the main ABS audience
4. **Deletes the audience** from both Resend and the database

### ✅ **Migration Statistics**
After deletion, you'll see a report showing:
- Total subscribers in the deleted audience
- Number of emails migrated to main ABS
- Number of duplicates skipped
- Any errors encountered during migration

## How to Use

### Step 1: Navigate to Audiences
1. Log in as a **Super Admin**
2. Go to the **Admin Dashboard**
3. Click on the **"Audiences"** tab

### Step 2: Delete an Audience
1. Find the audience you want to delete
2. Click the **🗑️ Delete** button next to it
3. A confirmation modal will appear

### Step 3: Confirm Deletion
The confirmation modal shows:
- The audience name being deleted
- An explanation of the email migration process
- A warning that this action cannot be undone

Click **"Delete Audience"** to proceed or **"Cancel"** to abort.

### Step 4: View Results
After deletion completes, you'll see migration statistics:
```
✅ Audience deleted successfully!

📊 Total subscribers in audience: 50
✨ Migrated to main ABS: 35
🔄 Duplicates skipped: 15
⚠️ Errors: 0
```

The modal will automatically close after 3 seconds.

## Technical Details

### API Endpoint
- **Method**: `DELETE`
- **URL**: `/api/admin/audiences`
- **Auth**: Super Admin only
- **Body**:
  ```json
  {
    "audienceId": 5,
    "audienceName": "Marketing",
    "resendId": "abc123..."
  }
  ```

### Email Migration Process
1. **Get Main ABS Audience**: Finds the "AI in Business (main)" audience in Resend
2. **Fetch Contacts**: Retrieves all contacts from both audiences
3. **Duplicate Detection**: Uses a Set to identify duplicate emails
4. **Migration**: Adds non-duplicate emails one by one to main ABS audience
5. **Cleanup**: Removes the audience from Resend and database

### Protected Audiences
- **Main ABS Audience (ID 8)**: Cannot be deleted
- Attempting to delete it will result in an error: "Cannot delete the main ABS audience"

### Error Handling
The system handles various error scenarios:
- **Resend API errors**: Returns 502 with error details
- **Database errors**: Continues even if DB deletion fails
- **Migration errors**: Tracks failed email migrations in the error count
- **Missing main ABS audience**: Returns 500 error

## Security

### Authorization
- Only users with `admin_type: "SuperAdmin"` can delete audiences
- Regular admins will not see the delete button
- API endpoint validates super admin status before proceeding

### Data Safety
- Main ABS audience is protected from deletion
- All emails are migrated before deletion
- Duplicates are automatically detected and skipped
- Migration statistics provide transparency

## Best Practices

### Before Deleting
1. **Review subscribers**: Check what emails are in the audience
2. **Verify main ABS**: Ensure the main ABS audience exists in Resend
3. **Consider timing**: Delete during low-traffic periods

### After Deleting
1. **Review statistics**: Check migration results for errors
2. **Verify emails**: Confirm important emails were migrated
3. **Update documentation**: Note the deletion in your records

## Troubleshooting

### "Main ABS audience not found in Resend"
- **Cause**: The "AI in Business (main)" audience doesn't exist in your Resend account
- **Solution**: Create the main audience in Resend first

### "Failed to delete audience from Resend"
- **Cause**: Resend API error (network issue, invalid ID, etc.)
- **Solution**: Check Resend API status, verify audience ID, try again

### High error count in migration
- **Cause**: Email validation failures, rate limiting, or API issues
- **Solution**: Review error logs, check email formats, contact Resend support if needed

## Future Enhancements

Potential improvements for future versions:
- Batch email migration for better performance
- Dry-run mode to preview migration results
- Export deleted audience data before deletion
- Undo/restore deleted audiences
- Email notification to super admin after deletion

## Related Files

### Backend
- `/app/api/admin/audiences/route.js` - DELETE handler
- `/lib/resend.js` - Resend API client
- `/lib/auth-helpers.js` - Super admin verification

### Frontend
- `/components/AudienceManager.jsx` - UI and delete logic

### Database
- `audiences` table - Stores audience records

