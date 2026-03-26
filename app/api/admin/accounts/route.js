import { NextResponse } from "next/server";
import { getAdminSession, isSuperAdmin } from "@/lib/auth-helpers";
import { getSupabaseServerClient } from "@/lib/supabase";

// GET — list LinkedIn members with their admin status
export async function GET() {
  const session = await getAdminSession();
  if (!session || !isSuperAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  // Fetch all LinkedIn profiles (admin_type may or may not exist yet)
  const { data: members, error: memberErr } = await supabase
    .from("profiles")
    .select("id, email, full_name, avatar_url, linkedin_url, admin_type, created_at")
    .not("email", "is", null)
    .order("full_name");

  if (memberErr) {
    // If admin_type column doesn't exist, retry without it
    if (memberErr.message?.includes("admin_type")) {
      const { data: fallback } = await supabase
        .from("profiles")
        .select("id, email, full_name, avatar_url, linkedin_url, created_at")
        .not("email", "is", null)
        .order("full_name");
      return NextResponse.json({
        members: (fallback || []).map((m) => ({ ...m, admin_type: null })),
        needsColumn: true,
      });
    }
    return NextResponse.json({ error: memberErr.message }, { status: 500 });
  }

  // Split into admins and all members
  const admins = (members || []).filter((m) => m.admin_type);

  return NextResponse.json({
    admins,
    members: members || [],
  });
}

// POST — set or update admin_type on a LinkedIn profile
export async function POST(req) {
  const session = await getAdminSession();
  if (!session || !isSuperAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  const body = await req.json();
  const profileId = body.profileId;
  const email = (body.email || "").trim().toLowerCase();
  const adminType = (body.adminType || "").trim();

  if (!profileId && !email) {
    return NextResponse.json({ error: "Profile ID or email is required" }, { status: 400 });
  }

  // Find the profile
  let query = supabase.from("profiles").select("id, email, admin_type");
  if (profileId) {
    query = query.eq("id", profileId);
  } else {
    query = query.eq("email", email);
  }
  const { data: profile, error: lookupError } = await query.maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  if (!profile) {
    return NextResponse.json(
      { error: "No LinkedIn profile found. They must log in with LinkedIn first." },
      { status: 404 }
    );
  }

  // Update admin_type (empty string = remove admin access)
  const newAdminType = adminType || null;
  const { error: updateError } = await supabase
    .from("profiles")
    .update({ admin_type: newAdminType })
    .eq("id", profile.id);

  if (updateError) {
    // If admin_type column doesn't exist, return helpful error
    if (updateError.message?.includes("admin_type")) {
      return NextResponse.json(
        { error: "The admin_type column needs to be added to the profiles table. Run: ALTER TABLE profiles ADD COLUMN admin_type text;" },
        { status: 500 }
      );
    }
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    profileId: profile.id,
    email: profile.email,
    adminType: newAdminType,
    action: newAdminType ? "updated" : "removed",
  });
}
