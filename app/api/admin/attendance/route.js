import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getAdminSession } from "@/lib/auth-helpers";

// POST /api/admin/attendance — mark a single member as attended
// Automatically creates a member_stars record for the event's star_value
export async function POST(req) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const member_id = body?.member_id?.trim();
    const event_id = body?.event_id?.trim();
    const check_in_method = body?.check_in_method || "manual";

    if (!member_id || !event_id) {
      return NextResponse.json(
        { error: "member_id and event_id are required" },
        { status: 400 }
      );
    }

    // Fetch the event to get star_value
    const { data: event, error: eventError } = await supabase
      .from("events")
      .select("id, title, star_value")
      .eq("id", event_id)
      .single();

    if (eventError || !event) {
      return NextResponse.json({ error: "Event not found" }, { status: 404 });
    }

    // Insert attendance record
    const { data: attendanceRecord, error: attendanceError } = await supabase
      .from("attendance")
      .insert({ member_id, event_id, check_in_method })
      .select("*")
      .single();

    if (attendanceError) {
      if (attendanceError.code === "23505") {
        return NextResponse.json(
          { error: "Member is already marked as attended for this event" },
          { status: 409 }
        );
      }
      console.error("[POST /api/admin/attendance] attendance insert:", attendanceError);
      return NextResponse.json({ error: attendanceError.message }, { status: 500 });
    }

    // Award stars if the event has star_value > 0
    let starRecord = null;
    if (event.star_value > 0) {
      const { data: star, error: starError } = await supabase
        .from("member_stars")
        .insert({
          member_id,
          event_id,
          source: "event_attendance",
          star_count: event.star_value,
          event_name: event.title,
        })
        .select("*")
        .single();

      if (starError) {
        // Best-effort: attendance was recorded but star creation failed — roll back attendance
        console.error("[POST /api/admin/attendance] star insert failed:", starError);
        await supabase.from("attendance").delete().eq("id", attendanceRecord.id);
        return NextResponse.json(
          { error: "Attendance recorded but star award failed. Operation rolled back." },
          { status: 500 }
        );
      }
      starRecord = star;
    }

    return NextResponse.json({
      success: true,
      message: `Attendance recorded${starRecord ? ` and ${event.star_value} star(s) awarded` : ""}`,
      data: { attendance: attendanceRecord, star: starRecord },
    });
  } catch (e) {
    console.error("[POST /api/admin/attendance]", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
