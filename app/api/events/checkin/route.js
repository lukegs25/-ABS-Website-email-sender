import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

// POST /api/events/checkin — student submits check-in with event_id + code + email
export async function POST(req) {
  let body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const { event_id, checkin_code, email } = body || {};

  if (!event_id?.trim()) {
    return NextResponse.json({ error: "event_id is required" }, { status: 400 });
  }
  if (!checkin_code?.trim()) {
    return NextResponse.json({ error: "checkin_code is required" }, { status: 400 });
  }
  if (!email?.trim()) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    // Fetch event with check-in config
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title, star_value, checkin_code, checkin_enabled, checkin_start, checkin_end, event_password")
      .eq("id", event_id.trim())
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Check if check-in is enabled (accept either checkin_code or legacy event_password)
    const validCode = event.checkin_code || event.event_password;
    if (!event.checkin_enabled && !validCode) {
      return NextResponse.json({ error: "Check-in is not active for this event" }, { status: 403 });
    }

    // Validate the code
    if (!validCode || validCode.trim().toLowerCase() !== checkin_code.trim().toLowerCase()) {
      return NextResponse.json({ error: "Invalid check-in code" }, { status: 403 });
    }

    // Validate time window if set
    if (event.checkin_start || event.checkin_end) {
      const now = new Date();
      if (event.checkin_start && now < new Date(event.checkin_start)) {
        return NextResponse.json({ error: "Check-in has not started yet" }, { status: 403 });
      }
      if (event.checkin_end && now > new Date(event.checkin_end)) {
        return NextResponse.json({ error: "Check-in has ended for this event" }, { status: 403 });
      }
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Insert into event_checkins (UNIQUE constraint prevents duplicate)
    const { error: checkinError } = await supabase
      .from("event_checkins")
      .insert({
        event_id: event.id,
        subscriber_email: normalizedEmail,
        checkin_method: "code",
        star_awarded: false,
      });

    if (checkinError) {
      if (checkinError.code === "23505") {
        return NextResponse.json(
          { error: "You've already checked in to this event!" },
          { status: 409 }
        );
      }
      console.error("[POST /api/events/checkin] checkin insert:", checkinError);
      return NextResponse.json({ error: checkinError.message }, { status: 500 });
    }

    // Try to find profile by email to award stars and record attendance
    let starsAwarded = 0;
    const { data: profileRow } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", normalizedEmail)
      .single();

    if (profileRow) {
      const memberId = profileRow.id;
      const starValue = event.star_value ?? 1;

      // Insert attendance record (ignore duplicate — member may have already checked in)
      const { error: attendanceError } = await supabase
        .from("attendance")
        .insert({
          member_id: memberId,
          event_id: event.id,
          check_in_method: "code",
        });

      if (attendanceError && attendanceError.code !== "23505") {
        console.error("[POST /api/events/checkin] attendance insert:", attendanceError);
        // Non-fatal — continue to award stars
      }

      // Award stars
      if (starValue > 0) {
        const { error: starError } = await supabase
          .from("member_stars")
          .insert({
            member_id: memberId,
            event_id: event.id,
            source: "event_attendance",
            star_count: starValue,
            event_name: event.title,
          });

        if (!starError) {
          starsAwarded = starValue;
          // Mark star as awarded on the checkin record
          await supabase
            .from("event_checkins")
            .update({ star_awarded: true })
            .eq("event_id", event.id)
            .eq("subscriber_email", normalizedEmail);
        } else {
          console.error("[POST /api/events/checkin] star insert:", starError);
        }
      }
    }

    return NextResponse.json({
      success: true,
      eventTitle: event.title,
      starsAwarded,
    });
  } catch (e) {
    console.error("[POST /api/events/checkin]", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
