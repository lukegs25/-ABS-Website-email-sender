import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Perplexity API key not configured" }, { status: 500 });
    }

    const body = await req.json();
    const niche = (body?.niche || "").trim();
    const refine = (body?.refine || "").trim();
    if (!niche) {
      return NextResponse.json({ error: "niche is required" }, { status: 400 });
    }

    const base = `Give a concise 2-3 bullet summary of the latest noteworthy news in ${niche} over the last 7 days. Keep each bullet under 30 words. Include links.`;
    const prompt = refine ? `${base}\nRefine with: ${refine}` : base;

    const resp = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: "sonar-pro",
        messages: [
          { role: "system", content: "You are a helpful assistant that writes concise newsletter-ready bullets with markdown links." },
          { role: "user", content: prompt }
        ],
        temperature: 0.2,
        max_tokens: 400
      })
    });

    if (!resp.ok) {
      const text = await resp.text();
      return NextResponse.json({ error: `Perplexity error: ${text}` }, { status: 502 });
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content || "";
    return NextResponse.json({ ok: true, content });
  } catch (e) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}


