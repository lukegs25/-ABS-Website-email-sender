import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getAdminSession } from "@/lib/auth-helpers";

// POST /api/admin/attendance/bulk — mark multiple members as attended
// Body: { event_id: string, member_ids: string[], check_in_method?: string }
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
    const event_id = body?.event_id?.trim();
    const member_ids = body?.member_ids;
    const check_in_method = body?.check_in_method || "manual";

    if (!event_id) {
      return NextResponse.json({ error: "event_id is required" }, { status: 400 });
    }
    if (!Array.isArray(member_ids) || member_ids.length === 0) {
      return NextResponse.json({ error: "member_ids must be a non-empty array" }, { status: 400 });
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

    const results = { succeeded: [], skipped: [], failed: [] };

    for (const member_id of member_ids) {
      const memberId = typeof member_id === "string" ? member_id.trim() : null;
      if (!memberId) {
        results.failed.push({ member_id, reason: "Invalid member_id" });
        continue;
      }

      // Insert attendance
      const { data: attendanceRecord, error: attendanceError } = await supabase
        .from("attendance")
        .insert({ member_id: memberId, event_id, check_in_method })
        .select("id")
        .single();

      if (attendanceError) {
        if (attendanceError.code === "23505") {
          results.skipped.push({ member_id: memberId, reason: "Already attended" });
        } else {
          results.failed.push({ member_id: memberId, reason: attendanceError.message });
        }
        continue;
      }

      // Award stars
      if (event.star_value > 0) {
        const { error: starError } = await supabase
          .from("member_stars")
          .insert({
            member_id: memberId,
            event_id,
            source: "event_attendance",
            star_count: event.star_value,
            event_name: event.title,
          });

        if (starError) {
          // Roll back attendance if star creation fails
          console.error("[POST /api/admin/attendance/bulk] star insert failed:", starError);
          await supabase.from("attendance").delete().eq("id", attendanceRecord.id);
          results.failed.push({ member_id: memberId, reason: "Star award failed, attendance rolled back" });
          continue;
        }
      }

      results.succeeded.push(memberId);
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${member_ids.length} member(s)`,
      data: results,
    });
  } catch (e) {
    console.error("[POST /api/admin/attendance/bulk]", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
