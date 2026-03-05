import { NextResponse } from "next/server";

/** Parse job description text into structured fields using AI (OpenAI) */
export async function POST(request) {
  try {
    const apiKey = process.env.CHATGPT_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "AI parsing not configured. Add CHATGPT_API_KEY to environment." },
        { status: 503 }
      );
    }

    const body = await request.json();
    const text = (body?.text || "").trim();
    if (!text) {
      return NextResponse.json(
        { error: "No text provided" },
        { status: 400 }
      );
    }

    const prompt = `Extract job posting information from the following text. Return ONLY a valid JSON object with these keys (use empty string if not found):
- title: job title/position
- company: company or organization name
- description: full job description
- url: application URL or email. If an email is mentioned for applying, use mailto:email@example.com format. If a URL is mentioned, use it. Otherwise empty string.

Text:
${text.slice(0, 6000)}`;

    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You extract structured job posting data. Reply with ONLY a valid JSON object, no markdown or extra text.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.1,
        max_tokens: 800,
      }),
    });

    if (!resp.ok) {
      const errText = await resp.text();
      console.error("[parse-description] OpenAI error:", errText);
      return NextResponse.json(
        { error: "Failed to parse job description" },
        { status: 502 }
      );
    }

    const data = await resp.json();
    const content = data?.choices?.[0]?.message?.content?.trim() || "{}";
    const parsed = parseJsonFromResponse(content);
    return NextResponse.json(parsed);
  } catch (e) {
    console.error("[parse-description]", e);
    return NextResponse.json(
      { error: "Failed to parse" },
      { status: 500 }
    );
  }
}

function parseJsonFromResponse(content) {
  const cleaned = content.replace(/^```json\s*/i, "").replace(/\s*```\s*$/i, "").trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    return { title: "", company: "", description: content || "", url: "" };
  }
}
