import { NextResponse } from 'next/server';
import { getUpcomingSheetEvents } from '@/lib/google-sheets';

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const days = Math.min(parseInt(searchParams.get('days') || '30', 10) || 30, 90);

  try {
    const events = await getUpcomingSheetEvents(days);
    return NextResponse.json({ events });
  } catch (err) {
    console.error('[calendar/sheet]', err.message);
    return NextResponse.json(
      { events: [], error: err.message || 'Failed to fetch sheet events' },
      { status: 200 }
    );
  }
}
