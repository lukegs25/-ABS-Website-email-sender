import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getAdminSession } from "@/lib/auth-helpers";

// GET /api/admin/attendance/[eventId] — get attendance list for an event
export async function GET(req, { params }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { eventId } = await params;

  const { data: attendees, error } = await supabase
    .from("attendance")
    .select("id, member_id, checked_in_at, check_in_method, profiles(id, full_name, email, avatar_url)")
    .eq("event_id", eventId)
    .order("checked_in_at", { ascending: true });

  if (error) {
    console.error("[GET /api/admin/attendance/[eventId]]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: attendees || [] });
}

// DELETE /api/admin/attendance/[eventId] — remove a member's attendance for an event
// Query: ?member_id=<uuid>
export async function DELETE(req, { params }) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { eventId } = await params;
  const { searchParams } = new URL(req.url);
  const member_id = searchParams.get("member_id");

  if (!member_id) {
    return NextResponse.json({ error: "member_id query parameter is required" }, { status: 400 });
  }

  // Delete the attendance record
  const { error: attendanceError } = await supabase
    .from("attendance")
    .delete()
    .eq("event_id", eventId)
    .eq("member_id", member_id);

  if (attendanceError) {
    console.error("[DELETE /api/admin/attendance/[eventId]]", attendanceError);
    return NextResponse.json({ error: attendanceError.message }, { status: 500 });
  }

  // Also remove the event-based star record for this member/event
  const { error: starError } = await supabase
    .from("member_stars")
    .delete()
    .eq("event_id", eventId)
    .eq("member_id", member_id)
    .eq("source", "event_attendance");

  if (starError) {
    console.error("[DELETE /api/admin/attendance/[eventId]] star removal:", starError);
    // Non-fatal: attendance was deleted, star removal failed — log but continue
  }

  return NextResponse.json({ success: true, message: "Attendance and associated stars removed" });
}
