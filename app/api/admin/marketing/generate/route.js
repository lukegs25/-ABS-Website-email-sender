import { generateText, Output } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';
import { getSupabaseServerClient } from '@/lib/supabase';
import { getWeeklyPalette } from '@/lib/social-media';

export const maxDuration = 120;

function formatEventDate(event) {
  const start = event.start?.dateTime || event.start?.date;
  if (!start) return { date: 'TBD', time: 'TBD' };
  const d = new Date(start);
  const date = d.toLocaleDateString('en-US', {
    weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    timeZone: 'America/Denver',
  });
  const time = event.start?.dateTime
    ? d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Denver' })
    : 'All Day';
  return { date, time };
}

export async function POST(req) {
  try {
    const { eventData, speakerInfo, flyerOnly } = await req.json();
    if (!eventData) {
      return Response.json({ error: 'eventData is required' }, { status: 400 });
    }

    const palette = getWeeklyPalette();
    const { date, time } = formatEventDate(eventData);
    const location = eventData.location || 'BYU Campus';
    const eventName = eventData.summary || 'ABS Event';
    const description = eventData.description || '';
    const speakerName = speakerInfo?.name || '';
    const speakerTitle = speakerInfo?.title || '';
    const speakerCompany = speakerInfo?.company || '';
    const speakerBio = speakerInfo?.bio || '';

    // ── 1. Generate flyer with Flux 2 via fal.ai ─────────────────────────────
    const flyerPrompt = `Professional square event flyer for "AI in Business Society" at BYU.
Solid background color ${palette.bg}, accent color ${palette.accent}, white text.
Modern clean layout, bold sans-serif typography, subtle geometric pattern overlay.
Top: "AI in Business Society" in small caps with thin accent underline.
Center: Large bold title "${eventName}".
Below title: "${date}" and "${time}" in accent color, location pin icon + "${location}".
${speakerName ? `Speaker section: "${speakerName}" bold, "${speakerTitle}${speakerCompany ? ` · ${speakerCompany}` : ''}" smaller text.` : ''}
Bottom: thin accent horizontal rule + "abs.byu.edu" small text.
Premium Instagram-ready aesthetic, no watermark.`;

    let flyerBase64 = null;
    let flyerMimeType = 'image/jpeg';

    try {
      const falKey = process.env.FAL_KEY;
      if (!falKey) throw new Error('FAL_KEY not configured');

      const falRes = await fetch('https://fal.run/fal-ai/flux-pro/v1.1', {
        method: 'POST',
        headers: {
          Authorization: `Key ${falKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: flyerPrompt,
          image_size: { width: 1080, height: 1080 },
          num_images: 1,
        }),
      });

      if (!falRes.ok) {
        const errData = await falRes.json().catch(() => ({}));
        throw new Error(errData.detail || `fal.ai returned ${falRes.status}`);
      }

      const falData = await falRes.json();
      const imageUrl = falData.images?.[0]?.url;

      if (imageUrl) {
        // Download the image and convert to base64
        const imgRes = await fetch(imageUrl);
        const imgBuffer = Buffer.from(await imgRes.arrayBuffer());
        flyerBase64 = imgBuffer.toString('base64');
        flyerMimeType = falData.images[0].content_type || 'image/jpeg';
      }
    } catch (imgErr) {
      console.error('[marketing/generate] Image generation error:', imgErr.message);
      // Captions still generate even if flyer fails
    }

    if (flyerOnly) {
      return Response.json({ flyerBase64, flyerMimeType, palette });
    }

    // ── 2. Generate captions + BYU announcement template ─────────────────────
    const captionSchema = z.object({
      instagramCaption: z.string().describe('Instagram caption with emojis, hashtags, CTA. 150-220 chars.'),
      linkedinCaption: z.string().describe('Professional LinkedIn caption, 200-300 chars with relevant hashtags.'),
      byuSubject: z.string().describe('Email subject line for BYU club announcement'),
      byuTemplate: z.string().describe('Full ready-to-send BYU club announcement email body'),
    });

    const captionContext = [
      `Event: ${eventName}`,
      `Date: ${date}`,
      `Time: ${time}`,
      `Location: ${location}`,
      description && `Description: ${description}`,
      speakerName && `Speaker: ${speakerName}${speakerTitle ? `, ${speakerTitle}` : ''}${speakerCompany ? ` at ${speakerCompany}` : ''}`,
      speakerBio && `Speaker bio: ${speakerBio}`,
    ].filter(Boolean).join('\n');

    const { output: captions } = await generateText({
      model: anthropic('claude-haiku-4-5-20251001'),
      output: Output.object({ schema: captionSchema }),
      system: 'You are a marketing copywriter for AI in Business Society (ABS), a BYU university club focused on AI and business. Write engaging, professional content. Instagram handle: @abs.byu',
      prompt: `Generate social media captions and a BYU club announcement email:\n\n${captionContext}`,
    });

    // ── 3. Persist in Supabase (optional — skipped if tables not set up) ────────
    const supabase = getSupabaseServerClient();
    let campaignId = null;

    if (supabase) {
      try {
        const { data, error } = await supabase
          .from('marketing_campaigns')
          .insert({
            event_id: eventData.id || null,
            event_name: eventName,
            event_date: eventData.start?.dateTime || eventData.start?.date || null,
            speaker_name: speakerName || null,
            speaker_title: speakerTitle || null,
            speaker_linkedin: speakerInfo?.linkedinUrl || null,
            flyer_url: null,
            instagram_caption: captions?.instagramCaption || null,
            linkedin_caption: captions?.linkedinCaption || null,
            byu_template: captions?.byuTemplate || null,
            color_palette: palette,
            status: 'draft',
          })
          .select('id')
          .single();

        if (!error && data) campaignId = data.id;
      } catch {
        // Tables not set up yet — generation continues without persisting
      }
    }

    return Response.json({
      campaignId,
      flyerBase64,
      flyerMimeType,
      palette,
      instagramCaption: captions?.instagramCaption || '',
      linkedinCaption: captions?.linkedinCaption || '',
      byuSubject: captions?.byuSubject || `${eventName} — AI in Business Society`,
      byuTemplate: captions?.byuTemplate || '',
    });
  } catch (err) {
    console.error('[marketing/generate]', err);
    return Response.json({ error: err.message || 'Generation failed' }, { status: 500 });
  }
}
