import { NextResponse } from 'next/server';
import { listUpcomingEvents } from '@/lib/google-calendar';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get('days') || '7', 10) || 7, 30);

  const { ok, events, error } = await listUpcomingEvents(days);

  if (!ok) {
    return NextResponse.json({ events: [], error: error || 'Calendar not configured' }, { status: 200 });
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
