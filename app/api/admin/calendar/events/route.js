import { NextResponse } from 'next/server';
import { getAdminSession } from '@/lib/auth-helpers';
import { createEvent, listUpcomingEvents } from '@/lib/google-calendar';

export async function POST(request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { summary, description, location, start, end, allDay } = body;
  if (!summary?.trim()) {
    return NextResponse.json({ error: 'Event title is required' }, { status: 400 });
  }
  if (!start || !end) {
    return NextResponse.json({ error: 'Start and end date/time are required' }, { status: 400 });
  }

  const result = await createEvent({
    summary: summary.trim(),
    description: (description || '').trim(),
    location: (location || '').trim(),
    start,
    end,
    allDay: !!allDay,
  });

  if (!result.ok) {
    return NextResponse.json({ error: result.error || 'Failed to create event' }, { status: 500 });
  }

  return NextResponse.json({ ok: true, event: result.event });
}

export async function GET(request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get('days') || '30', 10) || 30, 90);

  const { ok, events, error } = await listUpcomingEvents(days);

  if (!ok) {
    return NextResponse.json({ events: [], error: error || 'Calendar not configured' });
  }

  const formatted = events.map((e) => ({
    id: e.id,
    summary: e.summary || 'Untitled',
    description: e.description || '',
    location: e.location || '',
    start: e.start?.dateTime || e.start?.date,
    end: e.end?.dateTime || e.end?.date,
    allDay: !!e.start?.date,
    htmlLink: e.htmlLink || null,
  }));

  return NextResponse.json({ events: formatted });
}
