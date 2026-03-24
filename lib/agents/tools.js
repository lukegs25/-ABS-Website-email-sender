import { tool } from "ai";
import { z } from "zod";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getResendClient } from "@/lib/resend";
import { getEmailAddressWithFallback } from "@/lib/email-config";
import { listUpcomingEvents, createEvent } from "@/lib/google-calendar";

// ── Email Tools ──────────────────────────────────────────────────────────────

export const listAudiences = tool({
  description: "List all email audiences/groups available for sending campaigns.",
  inputSchema: z.object({}),
  execute: async () => {
    const supabase = getSupabaseServerClient();
    if (!supabase) return { error: "Database not configured" };
    const { data, error } = await supabase
      .from("audiences")
      .select("id, name, Resend_ID")
      .order("name");
    if (error) return { error: error.message };
    return { audiences: data };
  },
});

export const countSubscribers = tool({
  description:
    "Count subscribers in a specific audience or across all audiences.",
  inputSchema: z.object({
    audienceId: z
      .string()
      .optional()
      .describe("Audience ID to filter by. Omit for total count."),
  }),
  execute: async ({ audienceId }) => {
    const supabase = getSupabaseServerClient();
    if (!supabase) return { error: "Database not configured" };
    let query = supabase
      .from("new_subscribers")
      .select("id", { count: "exact", head: true });
    if (audienceId) {
      query = query.eq("audience_id", audienceId);
    }
    const { count, error } = await query;
    if (error) return { error: error.message };
    return { count };
  },
});

export const sendEmailCampaign = tool({
  description:
    "Send an email campaign to a Resend audience. Use this only after the user explicitly confirms they want to send.",
  inputSchema: z.object({
    audienceResendId: z
      .string()
      .describe("The Resend audience ID to send to"),
    subject: z.string().describe("Email subject line"),
    htmlBody: z.string().describe("HTML email body content"),
  }),
  execute: async ({ audienceResendId, subject, htmlBody }) => {
    const resend = getResendClient();
    if (!resend) return { error: "Resend not configured" };
    try {
      const result = await resend.emails.send({
        from: getEmailAddressWithFallback("newsletter"),
        to: audienceResendId,
        subject,
        html: htmlBody,
      });
      return { success: true, id: result.data?.id };
    } catch (e) {
      return { error: e.message };
    }
  },
});

// ── Subscriber / Membership Tools ────────────────────────────────────────────

export const querySubscribers = tool({
  description:
    "Search or filter subscribers. Can search by name, email, major, or subgroup.",
  inputSchema: z.object({
    search: z
      .string()
      .optional()
      .describe("Search term to match against name or email"),
    major: z.string().optional().describe("Filter by major"),
    subgroup: z.string().optional().describe("Filter by subgroup"),
    limit: z
      .number()
      .optional()
      .default(20)
      .describe("Max results to return"),
  }),
  execute: async ({ search, major, subgroup, limit }) => {
    const supabase = getSupabaseServerClient();
    if (!supabase) return { error: "Database not configured" };
    let query = supabase
      .from("new_subscribers")
      .select("id, first_name, last_name, email, major, subgroup, created_at")
      .order("created_at", { ascending: false })
      .limit(limit || 20);
    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,last_name.ilike.%${search}%,email.ilike.%${search}%`
      );
    }
    if (major) query = query.ilike("major", `%${major}%`);
    if (subgroup) query = query.ilike("subgroup", `%${subgroup}%`);
    const { data, error } = await query;
    if (error) return { error: error.message };
    return { subscribers: data, total: data?.length };
  },
});

export const getSubscriberStats = tool({
  description:
    "Get aggregate subscriber statistics — counts by major, subgroup, and sign-up trends.",
  inputSchema: z.object({}),
  execute: async () => {
    const supabase = getSupabaseServerClient();
    if (!supabase) return { error: "Database not configured" };
    const { data, error } = await supabase
      .from("new_subscribers")
      .select("major, subgroup, created_at");
    if (error) return { error: error.message };

    const byMajor = {};
    const bySubgroup = {};
    const byMonth = {};
    for (const row of data || []) {
      if (row.major) byMajor[row.major] = (byMajor[row.major] || 0) + 1;
      if (row.subgroup)
        bySubgroup[row.subgroup] = (bySubgroup[row.subgroup] || 0) + 1;
      if (row.created_at) {
        const month = row.created_at.slice(0, 7);
        byMonth[month] = (byMonth[month] || 0) + 1;
      }
    }
    return {
      totalSubscribers: data?.length || 0,
      byMajor,
      bySubgroup,
      signUpsByMonth: byMonth,
    };
  },
});

// ── Calendar / Events Tools ──────────────────────────────────────────────────

export const getUpcomingEvents = tool({
  description: "List upcoming ABS events from the Google Calendar.",
  inputSchema: z.object({
    daysAhead: z
      .number()
      .optional()
      .default(14)
      .describe("How many days ahead to look"),
  }),
  execute: async ({ daysAhead }) => {
    const result = await listUpcomingEvents(daysAhead || 14);
    if (!result.ok) return { error: result.error };
    return {
      events: result.events.map((e) => ({
        summary: e.summary,
        description: e.description,
        location: e.location,
        start: e.start?.dateTime || e.start?.date,
        end: e.end?.dateTime || e.end?.date,
      })),
    };
  },
});

export const createCalendarEvent = tool({
  description:
    "Create a new event on the ABS Google Calendar. Only use after the user confirms the details.",
  inputSchema: z.object({
    summary: z.string().describe("Event title"),
    description: z.string().optional().describe("Event description"),
    location: z.string().optional().describe("Event location"),
    start: z.string().describe("Start date/time (ISO 8601)"),
    end: z.string().describe("End date/time (ISO 8601)"),
    allDay: z.boolean().optional().default(false),
  }),
  execute: async (params) => {
    const result = await createEvent(params);
    if (!result.ok) return { error: result.error };
    return { success: true, eventId: result.event?.id };
  },
});

// ── Content / AI News Tools ──────────────────────────────────────────────────

export const fetchAiNews = tool({
  description:
    "Fetch the latest AI news headlines and summaries for a given niche or topic.",
  inputSchema: z.object({
    niche: z
      .string()
      .optional()
      .default("AI in business")
      .describe("Topic or niche for news"),
  }),
  execute: async ({ niche }) => {
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) return { error: "Perplexity API key not configured" };
    try {
      const res = await fetch("https://api.perplexity.ai/chat/completions", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "sonar-pro",
          messages: [
            {
              role: "system",
              content:
                "You are a news summarizer. Return 3-5 bullet points of the latest news. Include source links.",
            },
            {
              role: "user",
              content: `Latest news about: ${niche}`,
            },
          ],
        }),
      });
      const data = await res.json();
      return {
        summary:
          data.choices?.[0]?.message?.content || "No news found.",
      };
    } catch (e) {
      return { error: e.message };
    }
  },
});

// ── Job Board Tools ──────────────────────────────────────────────────────────

export const queryJobs = tool({
  description: "Search job postings on the ABS job board.",
  inputSchema: z.object({
    search: z.string().optional().describe("Search term for job title or company"),
    limit: z.number().optional().default(10),
  }),
  execute: async ({ search, limit }) => {
    const supabase = getSupabaseServerClient();
    if (!supabase) return { error: "Database not configured" };
    let query = supabase
      .from("jobs")
      .select("id, title, company, location, url, created_at")
      .order("created_at", { ascending: false })
      .limit(limit || 10);
    if (search) {
      query = query.or(
        `title.ilike.%${search}%,company.ilike.%${search}%`
      );
    }
    const { data, error } = await query;
    if (error) return { error: error.message };
    return { jobs: data, total: data?.length };
  },
});
