import { generateText, Output } from 'ai';
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

    // ── 1. Generate flyer with Gemini image model ────────────────────────────
    // Images are returned in result.files
    const flyerPrompt = `Create a professional square (1080x1080) event flyer for "AI in Business Society" at BYU.

Design specs:
- Solid background: ${palette.bg}
- Accent/highlight color: ${palette.accent}
- Text color: ${palette.text}
- Modern clean layout with bold sans-serif typography
- Subtle geometric hex-grid or diagonal-lines pattern overlay in slightly lighter background shade
- TOP: "AI in Business Society" in small caps, thin accent-color underline below
- CENTER: Large bold title "${eventName}"
- BELOW TITLE: "${date}" and "${time}" in accent color, small location pin + "${location}"
${speakerName ? `- SPEAKER SECTION: circular headshot placeholder, "${speakerName}" bold, "${speakerTitle}${speakerCompany ? ` · ${speakerCompany}` : ''}" in smaller text` : ''}
- BOTTOM: thin accent-color horizontal rule + "abs.byu.edu" in small text
- Premium Instagram-ready aesthetic`;

    let flyerBase64 = null;
    let flyerMimeType = 'image/png';

    try {
      const imageResult = await generateText({
        model: 'google/gemini-3.1-flash-image-preview',
        prompt: flyerPrompt,
      });
      // Images are in result.files
      const imageFile = (imageResult.files || []).find(f => f.mediaType?.startsWith('image/'));
      if (imageFile) {
        flyerBase64 = Buffer.from(imageFile.data).toString('base64');
        flyerMimeType = imageFile.mediaType;
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
      model: 'google/gemini-2.0-flash',
      output: Output.object({ schema: captionSchema }),
      system: 'You are a marketing copywriter for AI in Business Society (ABS), a BYU university club focused on AI and business. Write engaging, professional content. Instagram handle: @abs.byu',
      prompt: `Generate social media captions and a BYU club announcement email:\n\n${captionContext}`,
    });

    // ── 3. Persist in Supabase ───────────────────────────────────────────────
    const supabase = getSupabaseServerClient();
    let campaignId = null;

    if (supabase) {
      const { data, error } = await supabase
        .from('marketing_campaigns')
        .insert({
          event_id: eventData.id || null,
          event_name: eventName,
          event_date: eventData.start?.dateTime || eventData.start?.date || null,
          speaker_name: speakerName || null,
          speaker_title: speakerTitle || null,
          speaker_linkedin: speakerInfo?.linkedinUrl || null,
          flyer_url: null, // updated after client uploads to UploadThing
          instagram_caption: captions?.instagramCaption || null,
          linkedin_caption: captions?.linkedinCaption || null,
          byu_template: captions?.byuTemplate || null,
          color_palette: palette,
          status: 'draft',
        })
        .select('id')
        .single();

      if (!error && data) campaignId = data.id;
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
