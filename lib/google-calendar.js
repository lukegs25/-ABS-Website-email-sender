import { google } from 'googleapis';

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const TIMEZONE = 'America/Denver';

function getCalendarClient() {
  const credentials = process.env.GOOGLE_SERVICE_ACCOUNT_JSON;
  const calendarId = process.env.GOOGLE_CALENDAR_ID;

  if (!credentials) return { client: null, calendarId: null, error: 'GOOGLE_SERVICE_ACCOUNT_JSON not configured' };
  if (!calendarId) return { client: null, calendarId: null, error: 'GOOGLE_CALENDAR_ID not configured' };

  try {
    const key = typeof credentials === 'string' ? JSON.parse(credentials) : credentials;
    const auth = new google.auth.GoogleAuth({ credentials: key, scopes: SCOPES });
    const calendar = google.calendar({ version: 'v3', auth });
    return { client: calendar, calendarId, error: null };
  } catch (e) {
    return { client: null, calendarId: null, error: e.message || 'Invalid credentials' };
  }
}

export async function createEvent({ summary, description, location, start, end, allDay = false }) {
  const { client, calendarId, error } = getCalendarClient();
  if (error) return { ok: false, error };

  let endDate = end;
  if (allDay && start === end) {
    const d = new Date(start + 'T12:00:00');
    d.setDate(d.getDate() + 1);
    endDate = d.toISOString().slice(0, 10);
  }

  const startObj = allDay
    ? { date: start }
    : { dateTime: new Date(start).toISOString(), timeZone: TIMEZONE };
  const endObj = allDay
    ? { date: endDate }
    : { dateTime: new Date(end).toISOString(), timeZone: TIMEZONE };

  try {
    const res = await client.events.insert({
      calendarId,
      requestBody: {
        summary: summary || 'Untitled Event',
        description: description || '',
        location: location || '',
        start: startObj,
        end: endObj,
      },
    });
    return { ok: true, event: res.data };
  } catch (e) {
    return { ok: false, error: e.message || 'Failed to create event' };
  }
}

export async function listUpcomingEvents(daysAhead = 7) {
  const { client, calendarId, error } = getCalendarClient();
  if (error) return { ok: false, events: [], error };

  const now = new Date();
  const max = new Date(now);
  max.setDate(max.getDate() + daysAhead);

  try {
    const res = await client.events.list({
      calendarId,
      timeMin: now.toISOString(),
      timeMax: max.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });
    const events = (res.data.items || []).filter(e => e.status !== 'cancelled');
    return { ok: true, events };
  } catch (e) {
    return { ok: false, events: [], error: e.message || 'Failed to fetch events' };
  }
}
