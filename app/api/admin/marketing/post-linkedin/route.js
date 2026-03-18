import { postLinkedIn } from '@/lib/social-media';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function POST(req) {
  try {
    const { imageBase64, caption, campaignId } = await req.json();

    if (!imageBase64 || !caption) {
      return Response.json({ error: 'imageBase64 and caption are required' }, { status: 400 });
    }
    if (!process.env.LINKEDIN_ACCESS_TOKEN || !process.env.LINKEDIN_ORGANIZATION_URN) {
      return Response.json({ error: 'LinkedIn credentials not configured' }, { status: 500 });
    }

    const imageBuffer = Buffer.from(imageBase64, 'base64');
    const result = await postLinkedIn({ imageBuffer, caption });

    // Update campaign record in Supabase
    if (campaignId) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        await supabase
          .from('marketing_campaigns')
          .update({ linkedin_post_id: result.postId })
          .eq('id', campaignId);
      }
    }

    return Response.json({ success: true, postId: result.postId });
  } catch (err) {
    console.error('[marketing/post-linkedin]', err);
    return Response.json({ error: err.message || 'LinkedIn post failed' }, { status: 500 });
  }
}
