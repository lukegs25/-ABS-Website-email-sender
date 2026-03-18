import { postInstagramFeed, postInstagramStory } from '@/lib/social-media';
import { getSupabaseServerClient } from '@/lib/supabase';

export async function POST(req) {
  try {
    const { imageUrl, caption, campaignId, postType } = await req.json();

    if (!imageUrl) {
      return Response.json({ error: 'imageUrl is required' }, { status: 400 });
    }
    if (!process.env.INSTAGRAM_ACCESS_TOKEN || !process.env.INSTAGRAM_BUSINESS_ACCOUNT_ID) {
      return Response.json({ error: 'Instagram credentials not configured' }, { status: 500 });
    }

    let result;
    if (postType === 'story') {
      result = await postInstagramStory({ imageUrl });
    } else {
      if (!caption) return Response.json({ error: 'caption is required for feed posts' }, { status: 400 });
      result = await postInstagramFeed({ imageUrl, caption });
    }

    // Update campaign record in Supabase
    if (campaignId) {
      const supabase = getSupabaseServerClient();
      if (supabase) {
        await supabase
          .from('marketing_campaigns')
          .update({
            instagram_post_id: result.postId,
            status: 'posted',
          })
          .eq('id', campaignId);
      }
    }

    return Response.json({ success: true, postId: result.postId });
  } catch (err) {
    console.error('[marketing/post-instagram]', err);
    return Response.json({ error: err.message || 'Instagram post failed' }, { status: 500 });
  }
}
