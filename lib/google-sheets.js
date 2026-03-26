import { google } from 'googleapis';

const SPREADSHEET_ID = '1ZUqaGA2xDBDeAMNdInHrzqokoYEI-JhWfqVmu7A41C8';
const SHEET_GID = '1147665346';

// Column indices (0-based, after header row)
const COL = {
  WEEK: 0,       // A - date like "Wed 14-Jan-2026"
  TIME: 1,       // B - time like "7:00 PM"
  OFF_CAMPUS: 2, // C - Yes/No
  TYPE: 3,       // D - Social, Speaker Event, AI Bootcamp, Hackathon
  ACTIVITY: 4,   // E - Activity/Speaker name
  AFFILIATION: 5,// F - Speaker's org
  PLANNER: 6,    // G - ABS Planner
  SPEAKER_STATUS: 7, // H
  EVENT_STATUS: 8,   // I
  LOCATION: 9,   // J - Room/location
};

/**
 * Parse a date string like "Wed 14-Jan-2026" into a Date object.
 */
function parseWeekDate(dateStr) {
  if (!dateStr) return null;
  // Remove day-of-week prefix (e.g., "Wed ")
  const cleaned = dateStr.replace(/^[A-Za-z]+\s+/, '');
  // Parse "14-Jan-2026" → Date
  const d = new Date(cleaned);
  if (isNaN(d.getTime())) {
    // Try manual parse for "DD-Mon-YYYY"
    const match = cleaned.match(/^(\d{1,2})-([A-Za-z]+)-(\d{4})$/);
    if (match) {
      const [, day, mon, year] = match;
      const monthStr = `${mon} ${day}, ${year}`;
      const parsed = new Date(monthStr);
      if (!isNaN(parsed.getTime())) return parsed;
    }
    return null;
  }
  return d;
}

/**
 * Parse a time string like "7:00 PM" and combine with a date.
 * Produces an ISO string in America/Denver timezone so it displays correctly everywhere.
 */
function combineDateAndTime(date, timeStr) {
  if (!date || !timeStr) return date;
  const match = timeStr.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return date;
  let [, hours, minutes, period] = match;
  hours = parseInt(hours, 10);
  minutes = parseInt(minutes, 10);
  if (period?.toUpperCase() === 'PM' && hours !== 12) hours += 12;
  if (period?.toUpperCase() === 'AM' && hours === 12) hours = 0;

  // Build an explicit Mountain Time date string so it's correct regardless of server timezone
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hh = String(hours).padStart(2, '0');
  const mm = String(minutes).padStart(2, '0');

  // Determine Mountain Time offset (MDT = -06:00, MST = -07:00)
  // Create a temp date to check if DST is active
  const temp = new Date(`${year}-${month}-${day}T12:00:00`);
  const denverStr = temp.toLocaleString('en-US', { timeZone: 'America/Denver', timeZoneName: 'short' });
  const isDST = denverStr.includes('MDT');
  const offset = isDST ? '-06:00' : '-07:00';

  return new Date(`${year}-${month}-${day}T${hh}:${mm}:00${offset}`);
}

/**
 * Fetch events from the Google Sheet.
 * Uses the public CSV export (no auth needed if sheet is public),
 * or falls back to the Sheets API with service account credentials.
 */
export async function getSheetEvents() {
  // Try service account first (more reliable)
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  if (credentials) {
    try {
      return await fetchWithServiceAccount(credentials);
    } catch (err) {
      console.error('[google-sheets] Service account failed, trying public CSV:', err.message);
    }
  }

  // Fallback: public CSV export (works if sheet is shared publicly)
  return await fetchPublicCSV();
}

async function fetchWithServiceAccount(credentials) {
  const key = typeof credentials === 'string' ? JSON.parse(credentials) : credentials;
  const auth = new google.auth.GoogleAuth({
    credentials: key,
    scopes: ['https://www.googleapis.com/auth/spreadsheets.readonly'],
  });
  const sheets = google.sheets({ version: 'v4', auth });

  // Get sheet name from GID
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
    fields: 'sheets.properties',
  });
  const sheet = spreadsheet.data.sheets?.find(
    (s) => String(s.properties?.sheetId) === SHEET_GID
  );
  const sheetName = sheet?.properties?.title || 'Sheet1';

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: SPREADSHEET_ID,
    range: `${sheetName}!A1:N100`,
  });

  return parseRows(res.data.values || []);
}

async function fetchPublicCSV() {
  const url = `https://docs.google.com/spreadsheets/d/${SPREADSHEET_ID}/export?format=csv&gid=${SHEET_GID}`;
  const res = await fetch(url, { next: { revalidate: 300 } }); // cache 5 min
  if (!res.ok) throw new Error(`CSV fetch failed: ${res.status}`);
  const text = await res.text();

  // Parse CSV into rows
  const rows = text.split('\n').map((line) => {
    const cells = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        cells.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    cells.push(current.trim());
    return cells;
  });

  return parseRows(rows);
}

function parseRows(rows) {
  // Find the header row (look for "Week" in column A)
  let headerIndex = -1;
  for (let i = 0; i < Math.min(rows.length, 10); i++) {
    if (rows[i]?.[COL.WEEK]?.toLowerCase()?.includes('week')) {
      headerIndex = i;
      break;
    }
  }

  if (headerIndex === -1) headerIndex = 5; // default: row 6 (0-indexed = 5)

  const dataRows = rows.slice(headerIndex + 1);
  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const events = [];

  for (const row of dataRows) {
    const weekStr = row[COL.WEEK];
    if (!weekStr || weekStr.trim() === '') continue;

    const date = parseWeekDate(weekStr);
    if (!date) continue;

    const timeStr = row[COL.TIME] || '';
    const activity = row[COL.ACTIVITY] || '';
    const type = row[COL.TYPE] || '';
    const location = row[COL.LOCATION] || '';
    const affiliation = row[COL.AFFILIATION] || '';

    if (!activity.trim()) continue;

    const startDateTime = combineDateAndTime(date, timeStr);

    events.push({
      id: `sheet-${date.toISOString().slice(0, 10)}-${events.length}`,
      summary: type && !activity.toLowerCase().includes(type.toLowerCase())
        ? `${type}: ${activity}`
        : activity,
      type,
      location,
      affiliation,
      start: startDateTime.toISOString(),
      allDay: !timeStr.trim(),
      date: date.toISOString().slice(0, 10),
    });
  }

  // Sort by date ascending
  events.sort((a, b) => new Date(a.start) - new Date(b.start));

  return events;
}

/**
 * Get only upcoming events (today and forward).
 */
export async function getUpcomingSheetEvents(daysAhead = 30) {
  const events = await getSheetEvents();
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  const max = new Date(now);
  max.setDate(max.getDate() + daysAhead);

  return events.filter((e) => {
    const d = new Date(e.start);
    return d >= now && d <= max;
  });
}
