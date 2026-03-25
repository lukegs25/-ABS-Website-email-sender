import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

// GET /api/member/history?email=...
// Returns all events a student has checked into, with event details and dates
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get("email");

  if (!email?.trim()) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { data, error } = await supabase
      .from("event_checkins")
      .select(`
        id,
        checked_in_at,
        checkin_method,
        star_awarded,
        events (
          id,
          title,
          event_date,
          location,
          event_type
        )
      `)
      .eq("subscriber_email", email.trim().toLowerCase())
      .order("checked_in_at", { ascending: false });

    if (error) {
      console.error("[GET /api/member/history]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data: data || [] });
  } catch (e) {
    console.error("[GET /api/member/history]", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
