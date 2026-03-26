import { NextResponse } from "next/server";
import { getAdminSession, isSuperAdmin } from "@/lib/auth-helpers";
import { getSupabaseServerClient } from "@/lib/supabase";

// GET — list all subscribers that have an adminType set
export async function GET() {
  const session = await getAdminSession();
  if (!session || !isSuperAdmin(session)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }

  // Fetch all subscribers (admins have non-null adminType)
  const { data: admins, error } = await supabase
    .from("new_subscribers")
    .select("id, email, adminType, created_at")
    .not("adminType", "is", null)
    .order("email");

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ admins: admins || [] });
}

// POST — set or update adminType for a subscriber by email
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
  const email = (body.email || "").trim().toLowerCase();
  const adminType = (body.adminType || "").trim();

  if (!email) {
    return NextResponse.json({ error: "Email is required" }, { status: 400 });
  }

  // Check if subscriber exists
  const { data: existing, error: lookupError } = await supabase
    .from("new_subscribers")
    .select("id, email, adminType")
    .eq("email", email)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json({ error: lookupError.message }, { status: 500 });
  }

  if (!existing) {
    return NextResponse.json(
      { error: `No subscriber found with email: ${email}` },
      { status: 404 }
    );
  }

  // Update adminType (empty string = remove admin access)
  const newAdminType = adminType || null;
  const { error: updateError } = await supabase
    .from("new_subscribers")
    .update({ adminType: newAdminType })
    .eq("id", existing.id);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  return NextResponse.json({
    ok: true,
    email,
    adminType: newAdminType,
    action: newAdminType ? "updated" : "removed",
  });
}
