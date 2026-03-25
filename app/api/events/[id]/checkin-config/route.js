import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getAdminSession } from "@/lib/auth-helpers";

// GET /api/events/[id]/checkin-config — returns check-in config for an event (admin only)
export async function GET(req, { params }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Event id is required" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { data: event, error } = await supabase
      .from("events")
      .select("id, title, checkin_code, checkin_enabled, checkin_start, checkin_end")
      .eq("id", id)
      .single();

    if (error || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Get live check-in count
    const { count } = await supabase
      .from("event_checkins")
      .select("id", { count: "exact", head: true })
      .eq("event_id", id);

    return NextResponse.json({
      success: true,
      data: { ...event, checkin_count: count || 0 },
    });
  } catch (e) {
    console.error("[GET /api/events/[id]/checkin-config]", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// PUT /api/events/[id]/checkin-config — updates check-in config (admin only)
export async function PUT(req, { params }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  if (!id) {
    return NextResponse.json({ error: "Event id is required" }, { status: 400 });
  }

  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { checkin_code, checkin_enabled, checkin_start, checkin_end } = body || {};

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { data, error } = await supabase
      .from("events")
      .update({
        checkin_code: checkin_code?.trim() || null,
        checkin_enabled: !!checkin_enabled,
        checkin_start: checkin_start || null,
        checkin_end: checkin_end || null,
      })
      .eq("id", id)
      .select("id, title, checkin_code, checkin_enabled, checkin_start, checkin_end")
      .single();

    if (error) {
      console.error("[PUT /api/events/[id]/checkin-config]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, data });
  } catch (e) {
    console.error("[PUT /api/events/[id]/checkin-config]", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
