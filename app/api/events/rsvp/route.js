import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const event_id = searchParams.get("event_id");

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  if (!event_id) {
    return NextResponse.json({ error: "event_id is required" }, { status: 400 });
  }

  // Get count of RSVPs for this event
  const { count, error: countError } = await supabase
    .from("event_rsvps")
    .select("id", { count: "exact", head: true })
    .eq("event_id", event_id);

  if (countError) {
    return NextResponse.json({ error: countError.message }, { status: 500 });
  }

  // Check if current user has RSVP'd
  let user_has_rsvpd = false;
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    const { data: existingRsvp } = await supabase
      .from("event_rsvps")
      .select("id")
      .eq("event_id", event_id)
      .eq("user_id", user.id)
      .single();

    user_has_rsvpd = !!existingRsvp;
  }

  return NextResponse.json({ count: count || 0, user_has_rsvpd });
}

export async function POST(request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { event_id, event_title, event_date } = body;

  if (!event_id) {
    return NextResponse.json({ error: "event_id is required" }, { status: 400 });
  }

  const { data: rsvp, error } = await supabase
    .from("event_rsvps")
    .upsert(
      {
        user_id: user.id,
        event_id,
        event_title,
        event_date,
      },
      { onConflict: "user_id,event_id" }
    )
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ rsvp }, { status: 201 });
}

export async function DELETE(request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { event_id } = body;

  if (!event_id) {
    return NextResponse.json({ error: "event_id is required" }, { status: 400 });
  }

  const { error } = await supabase
    .from("event_rsvps")
    .delete()
    .eq("event_id", event_id)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
