# Dynamic Audiences Update

## Problem
New audiences created in the admin panel were not appearing as options on the student and teacher signup forms. The forms were using hardcoded audience IDs and names from the constants file.

## Solution
Made the signup forms dynamically fetch and display all available audiences from the database.

## Changes Made

### 1. New API Endpoint: `/app/api/audiences/route.js`
- **Purpose**: Public endpoint to fetch all audiences for signup forms
- **Returns**: List of audiences with their IDs, names, and subgroup mappings
- **No authentication required** - needed for public signup pages

### 2. Updated: `components/forms/StudentForm.jsx`
- Added `useEffect` to fetch audiences on component mount
- Dynamically maps database audiences to form checkboxes
- Includes audiences for:
  - SCAI Students
  - Finance
  - Marketing
  - Semi-conductors
  - Accounting
- Updated `onSubmit` to dynamically resolve audience IDs by name patterns
- Shows "Loading available groups..." message while fetching
- Automatically detects and includes new audiences that match naming patterns

### 3. Updated: `components/forms/TeacherForm.jsx`
- Added `useEffect` to fetch audiences on component mount
- Dynamically maps database audiences to form checkboxes (excludes SCAI Students)
- Includes audiences for:
  - Finance
  - Marketing
  - Semi-conductors
  - Accounting
  - SCAI Teachers
  - Teachers supporting student groups
- Updated `onSubmit` to dynamically resolve audience IDs by name patterns
- Shows "Loading available groups..." message while fetching
- Automatically detects and includes new audiences that match naming patterns

## How It Works

### Audience Detection Logic
The forms use **name pattern matching** to identify and categorize audiences:

```javascript
// Example patterns:
- "Finance" → matches any audience with "finance" in the name
- "SCAI - Students" → matches "scai" AND "student" in name
- "SCAI - Teachers" → matches "scai" AND "teacher" in name
- "Semi-conductors" → matches "semi" OR "conductor" in name
```

### Dynamic ID Resolution
When submitting the form:
1. Fetches all audiences from `/api/audiences`
2. Searches for matching audience by name pattern
3. Uses the database ID instead of hardcoded values
4. Falls back gracefully if audience not found

## Benefits

1. **Automatic Updates**: New audiences automatically appear in forms
2. **No Code Changes**: Admin can create new audiences without developer intervention
3. **Flexible Naming**: Works with renamed audiences as long as keywords match
4. **Backwards Compatible**: Still works with existing audiences
5. **User-Friendly**: Shows loading state while fetching data

## Testing

To verify the fix works:

1. **Create a new audience** in the admin panel (e.g., "Data Science")
2. **Refresh** the student or teacher signup page
3. **Check** if the new audience appears in the appropriate checkboxes
4. **Submit** the form and verify subscription is created

## Important Notes

### Naming Conventions
For audiences to appear in forms, they should include recognizable keywords:
- Finance → "finance"
- Marketing → "marketing"
- Accounting → "accounting"
- Semi-conductors → "semi" or "conductor"
- Students → "student" (for student-specific)
- Teachers → "teacher" (for teacher-specific)

### Main Newsletter
The "AI in Business" main newsletter is detected by:
- Name containing "ai in business"
- OR name containing "main"

### Other/General Audience
The "other areas" option maps to:
- Name containing "etc"
- OR "general"
- OR "other"

## API Details

### GET `/api/audiences`
**Description**: Fetch all audiences for signup forms

**Response**:
```json
{
  "audiences": [
    {
      "id": 7,
      "name": "SCAI - Students",
      "subgroupId": "scai"
    },
    {
      "id": 6,
      "name": "Finance",
      "subgroupId": "finance"
    }
  ]
}
```

**No authentication required** - this is a public endpoint for signup forms.

