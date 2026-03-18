import { getSupabaseServerClient } from '@/lib/supabase';

// Save a scheduled story post to Supabase — Vercel Cron picks it up at 8 AM
export async function POST(req) {
  try {
    const { campaignId, scheduledFor, platform } = await req.json();

    if (!campaignId || !scheduledFor) {
      return Response.json({ error: 'campaignId and scheduledFor are required' }, { status: 400 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return Response.json({ error: 'Database not configured' }, { status: 500 });
    }

    // scheduledFor: ISO date string like "2025-04-10"
    const { data, error } = await supabase
      .from('scheduled_posts')
      .insert({
        campaign_id: campaignId,
        platform: platform || 'instagram',
        post_type: 'story',
        scheduled_for: scheduledFor,
        status: 'pending',
      })
      .select('id')
      .single();

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }

    return Response.json({ success: true, scheduleId: data.id, scheduledFor });
  } catch (err) {
    console.error('[marketing/schedule]', err);
    return Response.json({ error: err.message || 'Scheduling failed' }, { status: 500 });
  }
}

// List scheduled posts for the admin UI
export async function GET() {
  try {
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return Response.json({ schedules: [] });
    }

    const today = new Date().toISOString().slice(0, 10);
    const { data, error } = await supabase
      .from('scheduled_posts')
      .select('*, marketing_campaigns(event_name, flyer_url)')
      .gte('scheduled_for', today)
      .order('scheduled_for', { ascending: true });

    if (error) return Response.json({ schedules: [] });
    return Response.json({ schedules: data || [] });
  } catch (err) {
    console.error('[marketing/schedule GET]', err);
    return Response.json({ schedules: [] });
  }
}
