import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getAdminSession } from "@/lib/auth-helpers";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url")
    .order("full_name");

  if (error) {
    console.error("[GET /api/admin/star-users]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ members: profiles || [] });
}

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
    const skill = body?.skill?.trim() || null;
    const note = body?.note?.trim() || null;
    const event_name = body?.event_name?.trim() || null;
    const source = body?.source || "manual";
    const event_id = body?.event_id?.trim() || null;
    const star_count = parseInt(body?.star_count ?? 1, 10);

    if (!member_id) {
      return NextResponse.json(
        { error: "member_id is required (profile ID of the member)" },
        { status: 400 }
      );
    }

    if (isNaN(star_count) || star_count < 1) {
      return NextResponse.json(
        { error: "star_count must be a positive integer" },
        { status: 400 }
      );
    }

    const { data, error } = await supabase
      .from("member_stars")
      .insert({ member_id, skill, note, event_name, source, event_id, star_count })
      .select("id, member_id, skill, note, event_name, source, event_id, star_count, created_at")
      .single();

    if (error) {
      console.error("[POST /api/admin/star-users]", error);
      if (error.code === "23503") {
        return NextResponse.json(
          { error: "Member not found. Ensure they have signed in with LinkedIn first." },
          { status: 404 }
        );
      }
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true, star: data });
  } catch (e) {
    console.error("[POST /api/admin/star-users]", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
