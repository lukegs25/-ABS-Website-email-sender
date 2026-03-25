import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

// GET /api/events/checkin/status?event_id=...&email=...
export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const event_id = searchParams.get("event_id");
  const email = searchParams.get("email");

  if (!event_id || !email) {
    return NextResponse.json({ error: "event_id and email are required" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { data, error } = await supabase
      .from("event_checkins")
      .select("id, checked_in_at, star_awarded")
      .eq("event_id", event_id)
      .eq("subscriber_email", email.trim().toLowerCase())
      .maybeSingle();

    if (error) {
      console.error("[GET /api/events/checkin/status]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      checkedIn: !!data,
      checkin: data || null,
    });
  } catch (e) {
    console.error("[GET /api/events/checkin/status]", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
