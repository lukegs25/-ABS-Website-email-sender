import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(req) {
  // Authenticate the member via their session
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const serviceClient = getSupabaseServerClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { password } = await req.json();
    if (!password?.trim()) {
      return NextResponse.json({ error: "Password is required" }, { status: 400 });
    }

    // Find an event with this password (no date restriction — admins can
    // generate passcodes for past events to backfill attendance)
    const { data: events, error: eventError } = await serviceClient
      .from("events")
      .select("id, title, star_value, event_date, password_generated_at")
      .eq("event_password", password.trim())
      .order("event_date", { ascending: false })
      .limit(1);

    if (eventError) {
      console.error("[POST /api/checkin] event lookup:", eventError);
      return NextResponse.json({ error: "Lookup failed" }, { status: 500 });
    }

    if (!events || events.length === 0) {
      return NextResponse.json(
        { error: "Invalid password or no matching event found" },
        { status: 404 }
      );
    }

    const event = events[0];

    // Enforce 5-minute password expiry if password_generated_at is set
    if (event.password_generated_at) {
      const generatedAt = new Date(event.password_generated_at);
      const now = new Date();
      const fiveMinutes = 5 * 60 * 1000;
      if (now - generatedAt > fiveMinutes) {
        return NextResponse.json(
          { error: "This check-in password has expired. Ask your event host for a new one." },
          { status: 410 }
        );
      }
    }

    // Insert attendance record
    const { data: attendanceRecord, error: attendanceError } = await serviceClient
      .from("attendance")
      .insert({
        member_id: user.id,
        event_id: event.id,
        check_in_method: "password",
      })
      .select("*")
      .single();

    if (attendanceError) {
      if (attendanceError.code === "23505") {
        return NextResponse.json(
          { error: "You've already checked in to this event!" },
          { status: 409 }
        );
      }
      console.error("[POST /api/checkin] attendance insert:", attendanceError);
      return NextResponse.json({ error: attendanceError.message }, { status: 500 });
    }

    // Award stars if event has star_value > 0
    let starsAwarded = 0;
    if (event.star_value > 0) {
      const { error: starError } = await serviceClient
        .from("member_stars")
        .insert({
          member_id: user.id,
          event_id: event.id,
          source: "event_attendance",
          star_count: event.star_value,
          event_name: event.title,
        });

      if (starError) {
        console.error("[POST /api/checkin] star insert failed:", starError);
        // Roll back attendance
        await serviceClient.from("attendance").delete().eq("id", attendanceRecord.id);
        return NextResponse.json(
          { error: "Check-in failed. Please try again." },
          { status: 500 }
        );
      }
      starsAwarded = event.star_value;
    }

    // Get total events attended for certificate progress
    const { count: totalAttended } = await serviceClient
      .from("attendance")
      .select("id", { count: "exact", head: true })
      .eq("member_id", user.id);

    return NextResponse.json({
      success: true,
      eventTitle: event.title,
      starsAwarded,
      totalEventsAttended: totalAttended || 0,
      certificateEarned: (totalAttended || 0) >= 3,
    });
  } catch (e) {
    console.error("[POST /api/checkin]", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
