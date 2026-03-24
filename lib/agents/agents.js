import { ToolLoopAgent, tool, stepCountIs } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
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
} from "./tools";

const model = google("gemini-2.0-flash");

// ── Specialist Agents ────────────────────────────────────────────────────────

const emailAgent = new ToolLoopAgent({
  model,
  instructions: `You are the ABS Email Agent — a specialist for email campaigns at BYU's AI in Business Society.
You can list audiences, count subscribers, and send email campaigns via Resend.
When composing emails, use a professional but friendly tone consistent with a university club.
ALWAYS confirm with the user before sending any email. Show them the subject, audience, and preview first.
Format HTML emails cleanly — use inline styles, keep them mobile-friendly.`,
  tools: { listAudiences, countSubscribers, sendEmailCampaign },
  stopWhen: stepCountIs(10),
});

const membershipAgent = new ToolLoopAgent({
  model,
  instructions: `You are the ABS Membership Agent — a specialist for subscriber and member data.
You can search subscribers, filter by major or subgroup, and pull aggregate stats.
Present data clearly with numbers and breakdowns. You understand BYU's AI in Business Society subgroups:
SCAI, Finance, Marketing, Semi-Conductors, Accounting.
Common majors include Accounting, Business Management, Computer Science, Information Systems, Statistics, etc.`,
  tools: { querySubscribers, getSubscriberStats },
  stopWhen: stepCountIs(8),
});

const eventsAgent = new ToolLoopAgent({
  model,
  instructions: `You are the ABS Events Agent — a specialist for managing the club calendar.
You can list upcoming events and create new ones on the Google Calendar.
When creating events, always confirm date, time (Mountain Time), location, and description with the user first.
Suggest good event descriptions that highlight value for BYU students interested in AI and business.`,
  tools: { getUpcomingEvents, createCalendarEvent },
  stopWhen: stepCountIs(8),
});

const contentAgent = new ToolLoopAgent({
  model,
  instructions: `You are the ABS Content Agent — a specialist for creating marketing content and staying current on AI news.
You can fetch the latest AI news and help write social media captions, newsletter copy, event descriptions, and more.
Write in a voice that's professional yet approachable — targeting BYU students excited about AI in business.
Keep social posts concise and engaging with relevant hashtags.`,
  tools: { fetchAiNews },
  stopWhen: stepCountIs(8),
});

const jobsAgent = new ToolLoopAgent({
  model,
  instructions: `You are the ABS Jobs Agent — a specialist for the job board.
You can search and browse job postings curated for ABS members.
Help users find relevant opportunities and summarize listings clearly.`,
  tools: { queryJobs },
  stopWhen: stepCountIs(6),
});

// ── Subagent Tools (wrap each specialist as a tool for the orchestrator) ─────

const emailTool = tool({
  description:
    "Delegate to the Email Agent for composing, previewing, and sending email campaigns to audiences.",
  inputSchema: z.object({
    task: z.string().describe("What to do with email — e.g. 'draft a newsletter about our next event'"),
  }),
  execute: async ({ task }, { abortSignal }) => {
    const result = await emailAgent.generate({ prompt: task, abortSignal });
    return result.text;
  },
});

const membershipTool = tool({
  description:
    "Delegate to the Membership Agent for subscriber lookups, stats, filtering members by major or subgroup.",
  inputSchema: z.object({
    task: z.string().describe("What to look up — e.g. 'how many CS majors are subscribed?'"),
  }),
  execute: async ({ task }, { abortSignal }) => {
    const result = await membershipAgent.generate({ prompt: task, abortSignal });
    return result.text;
  },
});

const eventsTool = tool({
  description:
    "Delegate to the Events Agent for listing upcoming events or creating new calendar events.",
  inputSchema: z.object({
    task: z.string().describe("What to do with events — e.g. 'what events do we have next week?'"),
  }),
  execute: async ({ task }, { abortSignal }) => {
    const result = await eventsAgent.generate({ prompt: task, abortSignal });
    return result.text;
  },
});

const contentTool = tool({
  description:
    "Delegate to the Content Agent for writing social media posts, newsletter copy, AI news summaries, or marketing materials.",
  inputSchema: z.object({
    task: z.string().describe("What content to create — e.g. 'write an Instagram caption for our speaker event'"),
  }),
  execute: async ({ task }, { abortSignal }) => {
    const result = await contentAgent.generate({ prompt: task, abortSignal });
    return result.text;
  },
});

const jobsTool = tool({
  description:
    "Delegate to the Jobs Agent for searching and browsing job postings on the ABS board.",
  inputSchema: z.object({
    task: z.string().describe("What to search — e.g. 'find AI internships' or 'list recent postings'"),
  }),
  execute: async ({ task }, { abortSignal }) => {
    const result = await jobsAgent.generate({ prompt: task, abortSignal });
    return result.text;
  },
});

// ── Orchestrator Agent ───────────────────────────────────────────────────────

export const centerAgent = new ToolLoopAgent({
  model,
  instructions: `You are the ABS Website Center — the AI command center for BYU's AI in Business Society (aiinbusinesssociety.org).

You lead a team of 5 specialist agents:
- **Email Agent**: compose and send email campaigns to subscriber audiences
- **Membership Agent**: look up subscribers, get stats by major/subgroup, analyze member data
- **Events Agent**: view upcoming events, create new calendar events
- **Content Agent**: write social media posts, newsletters, fetch AI news
- **Jobs Agent**: search and browse the job board

When the user asks something, delegate to the right specialist. If a request spans multiple areas, call multiple specialists.

Be concise and helpful. You're talking to ABS admins who manage the club's website and communications.
Always format responses clearly with markdown. When showing data, use tables or bullet lists.
For any action that modifies data (sending emails, creating events), always confirm with the user first.`,
  tools: {
    email: emailTool,
    membership: membershipTool,
    events: eventsTool,
    content: contentTool,
    jobs: jobsTool,
  },
  stopWhen: stepCountIs(15),
});
