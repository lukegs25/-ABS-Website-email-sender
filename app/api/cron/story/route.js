import { getSupabaseServerClient } from '@/lib/supabase';
import { postInstagramStory } from '@/lib/social-media';

// Runs daily at 15:00 UTC (8:00 AM MT / 9:00 AM MDT) via Vercel Cron
// Checks for any stories scheduled for today and posts them
export async function GET(req) {
  // Validate the cron secret to prevent unauthorized calls
  const authHeader = req.headers.get('authorization');
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return Response.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return Response.json({ error: 'Database not configured' }, { status: 500 });
  }

  const today = new Date().toISOString().slice(0, 10);

  // Fetch all pending stories scheduled for today
  const { data: pending, error } = await supabase
    .from('scheduled_posts')
    .select('*, marketing_campaigns(flyer_url, event_name)')
    .eq('scheduled_for', today)
    .eq('status', 'pending')
    .eq('post_type', 'story');

  if (error) {
    console.error('[cron/story] DB error:', error.message);
    return Response.json({ error: error.message }, { status: 500 });
  }

  const results = [];

  for (const post of pending || []) {
    const flyerUrl = post.marketing_campaigns?.flyer_url;
    if (!flyerUrl) {
      results.push({ id: post.id, status: 'skipped', reason: 'no flyer_url' });
      continue;
    }

    try {
      const { postId } = await postInstagramStory({ imageUrl: flyerUrl });

      await supabase
        .from('scheduled_posts')
        .update({ status: 'posted', posted_at: new Date().toISOString() })
        .eq('id', post.id);

      results.push({ id: post.id, status: 'posted', postId });
    } catch (err) {
      console.error(`[cron/story] Failed to post story ${post.id}:`, err.message);

      await supabase
        .from('scheduled_posts')
        .update({ status: 'failed' })
        .eq('id', post.id);

      results.push({ id: post.id, status: 'failed', error: err.message });
    }
  }

  console.log(`[cron/story] ${today}: processed ${results.length} stories`, results);
  return Response.json({ date: today, processed: results.length, results });
}
