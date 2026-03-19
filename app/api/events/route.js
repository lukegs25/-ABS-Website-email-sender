import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

// GET /api/events — public list of events (upcoming first)
export async function GET(req) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ success: true, data: [] });
  }

  const { searchParams } = new URL(req.url);
  const all = searchParams.get("all") === "true";

  let query = supabase
    .from("events")
    .select("id, title, description, event_date, location, event_type, star_value, created_at")
    .order("event_date", { ascending: true });

  if (!all) {
    // Only return upcoming events by default
    query = query.gte("event_date", new Date().toISOString());
  }

  const { data, error } = await query;

  if (error) {
    console.error("[GET /api/events]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data || [] });
}
