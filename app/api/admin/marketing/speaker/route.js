import { generateText, Output } from 'ai';
import { anthropic } from '@ai-sdk/anthropic';
import { z } from 'zod';

// Find a guest speaker's public profile info via Serper web search
// Uses public search results only — no LinkedIn scraping (against ToS)
export async function POST(req) {
  try {
    const { speakerName, eventDescription } = await req.json();
    if (!speakerName) {
      return Response.json({ error: 'speakerName is required' }, { status: 400 });
    }

    const serperKey = process.env.SERPER_API_KEY;
    if (!serperKey) {
      return Response.json({ error: 'SERPER_API_KEY not configured' }, { status: 500 });
    }

    // Search Google for the speaker's LinkedIn profile and public info
    const query = `"${speakerName}" site:linkedin.com/in OR "${speakerName}" professional bio`;
    const serperRes = await fetch('https://google.serper.dev/search', {
      method: 'POST',
      headers: {
        'X-API-KEY': serperKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ q: query, num: 5 }),
    });

    if (!serperRes.ok) {
      return Response.json({ error: 'Search request failed' }, { status: 500 });
    }

    const serperData = await serperRes.json();

    // Collect relevant text snippets from search results
    const snippets = [
      ...(serperData.organic || []).map(r => `Title: ${r.title}\nURL: ${r.link}\nSnippet: ${r.snippet}`),
      ...(serperData.knowledgeGraph ? [`Knowledge Graph: ${serperData.knowledgeGraph.description || ''}`] : []),
    ].join('\n\n');

    const speakerSchema = z.object({
      name: z.string().describe('Full name of the speaker'),
      title: z.string().describe('Current job title'),
      company: z.string().describe('Current employer or organization'),
      bio: z.string().describe('1-2 sentence professional bio suitable for event marketing'),
      linkedinUrl: z.string().describe('LinkedIn profile URL if found, otherwise empty string'),
    });

    const { output: speakerInfo } = await generateText({
      model: anthropic('claude-haiku-4-5-20251001'),
      output: Output.object({ schema: speakerSchema }),
      system: 'You extract structured speaker profile information from web search results for event marketing. Be accurate and concise.',
      prompt: `Extract profile info for speaker "${speakerName}" from these search results:\n\n${snippets}\n\nEvent context: ${eventDescription || 'University club event'}`,
    });

    return Response.json({ speakerInfo });
  } catch (err) {
    console.error('[marketing/speaker]', err);
    return Response.json({ error: err.message || 'Speaker lookup failed' }, { status: 500 });
  }
}
