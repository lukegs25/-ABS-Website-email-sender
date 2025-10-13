# Subscriber CSV Upload/Download Guide

## Overview
The Subscriber Management page now supports CSV upload and download functionality, allowing admins to efficiently manage subscriber lists.

## Features

### 1. CSV Upload
Upload subscribers in bulk to a specific audience using a CSV file.

**Steps:**
1. Navigate to Admin Dashboard → Subscribers tab
2. In the "Upload Subscribers from CSV" section (blue gradient box):
   - Select the target audience from the dropdown
   - Click "Download Template" to get a sample CSV file (optional)
   - Drag and drop your CSV file or click to browse
3. The system will process the file and display results:
   - Number of new subscribers added
   - Number of duplicates skipped (if any)

**CSV Format:**
- Required column: `email`
- Optional columns: `major`, `is_student` (or `role`)

Example CSV:
```csv
email,major,is_student
example@byu.edu,Computer Science,true
teacher@byu.edu,Business,false
student@college.edu,Marketing,true
```

**Features:**
- Automatic duplicate detection (prevents adding the same email to the same audience twice)
- Case-insensitive email handling
- Validation of email format
- Real-time upload status and results

### 2. CSV Download
Download subscriber lists from specific audiences or all audiences (super admin only).

**Steps:**
1. Navigate to Admin Dashboard → Subscribers tab
2. In the "Download Subscribers" section (green gradient box):
   - Select the audience you want to download (or "All Audiences" if you're a super admin)
   - Click "Download CSV" button
3. A CSV file will be downloaded with all subscribers from the selected audience(s)

**Downloaded CSV Format:**
The exported CSV includes the following columns:
- `email`: Subscriber's email address
- `audience`: Name of the audience
- `major`: Subscriber's major (if provided)
- `is_student`: "Student" or "Teacher"
- `created_at`: Date when the subscriber was added

**Permissions:**
- **Regular Admins**: Can download subscribers from their assigned audiences
- **Super Admins**: Can download from individual audiences OR all audiences combined

## API Endpoints

### POST /api/admin/subscribers
Uploads subscribers from CSV to a specific audience.

**Request Body:**
```json
{
  "audienceId": "8",
  "subscribers": [
    {
      "email": "user@example.com",
      "major": "Computer Science",
      "is_student": true
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "inserted": 5,
  "skipped": 2,
  "total": 7,
  "message": "Successfully added 5 new subscriber(s). Skipped 2 duplicate(s)."
}
```

### GET /api/admin/subscribers
Retrieves all subscribers with statistics (existing endpoint, unchanged).

## Technical Details

### Dependencies Added
- `motion`: For smooth animations in the file upload component
- `@tabler/icons-react`: For upload icons
- `react-dropzone`: For drag-and-drop file upload functionality

### File Upload Component
Located at: `components/ui/file-upload.jsx`
- Supports drag-and-drop
- Visual feedback during upload
- File size and type display
- Animated transitions

### CSV Parsing
- Native browser FileReader API
- Server-side validation and processing
- Flexible column matching (case-insensitive)
- Error handling and user feedback

## Security
- Admin authentication required for all upload/download operations
- Super admin privileges checked for "All Audiences" download
- Email validation on both client and server
- Duplicate prevention to avoid data corruption

## Troubleshooting

**Issue: "No valid subscribers found in CSV"**
- Ensure your CSV has a column with "email" in the header
- Check that emails are properly formatted (contain @)

**Issue: "Please select an audience first"**
- Make sure to select an audience from the dropdown before uploading

**Issue: File upload component is disabled**
- The upload area is disabled until you select an audience
- Select an audience to enable it

**Issue: CSV not parsing correctly**
- Ensure your CSV uses comma delimiters
- Remove any special characters from headers
- Make sure there are no empty rows in the CSV

## Future Enhancements
Potential improvements for consideration:
- Support for more file formats (Excel, JSON)
- Bulk edit/delete functionality
- Import history and rollback
- Email validation preview before import
- Progress bar for large uploads


