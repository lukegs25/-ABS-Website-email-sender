import { streamText, convertToModelMessages, stepCountIs } from "ai";
import { anthropic } from "@ai-sdk/anthropic";
import { cookies } from "next/headers";
import {
  listAudiences,
  countSubscribers,
  sendEmailCampaign,
  querySubscribers,
  getSubscriberStats,
  getUpcomingEvents,
  createCalendarEvent,
  fetchAiNews,
  queryJobs,
} from "@/lib/agents/tools";

export async function POST(req) {
  // Admin auth check
  const cookieStore = await cookies();
  const adminCookie = cookieStore.get("admin_auth");
  if (!adminCookie?.value) {
    return new Response("Unauthorized", { status: 401 });
  }

  const { messages } = await req.json();
  const modelMessages = await convertToModelMessages(messages);

  const result = streamText({
    model: anthropic("claude-haiku-4-5-20251001"),
    system: `You are the ABS Website Center — the AI command center for BYU's AI in Business Society (aiinbusinesssociety.org).

You have access to a team of specialized tools:
- **Email tools**: list audiences, count subscribers, send email campaigns
- **Membership tools**: search subscribers, get stats by major/subgroup
- **Events tools**: view upcoming events, create new calendar events
- **Content tools**: fetch AI news and trends
- **Jobs tools**: search job postings on the board

When the user asks something, use the right tools to help. If a request spans multiple areas, use multiple tools.

Be concise and helpful. You're talking to ABS admins who manage the club's website and communications.
Format responses with markdown. Use tables or bullet lists for data.
For any action that modifies data (sending emails, creating events), ALWAYS confirm with the user first — show them a preview and ask for explicit approval before executing.

Today's date: ${new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}`,
    messages: modelMessages,
    tools: {
      listAudiences,
      countSubscribers,
      sendEmailCampaign,
      querySubscribers,
      getSubscriberStats,
      getUpcomingEvents,
      createCalendarEvent,
      fetchAiNews,
      queryJobs,
    },
    stopWhen: stepCountIs(12),
  });

  return result.toUIMessageStreamResponse();
}
