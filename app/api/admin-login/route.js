import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(req) {
  try {
    const body = await req.json();
    const email = (body?.email || "").trim().toLowerCase();
    const password = body?.password || "";

    if (!email || !password) {
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const expectedPassword = process.env.ADMIN_PASSWORD || process.env.SUPABASE_ADMIN_PASSWORD;
    if (!expectedPassword) {
      return NextResponse.json({ error: "Admin password not configured" }, { status: 500 });
    }
    if (password !== expectedPassword) {
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Check admin record with non-null email
    // Primary check: new_subscribers with is_admin = true and email not null
    const { data: adminRow, error } = await supabase
      .from('new_subscribers')
      .select('*')
      .eq('email', email)
      .not('email', 'is', null)
      .limit(1)
      .maybeSingle();

    if (error) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Enforce non-null admin_type only if the column exists
    const hasAdminType = Object.prototype.hasOwnProperty.call(adminRow || {}, 'admin_type');
    if (!adminRow || !adminRow.email || (hasAdminType && !adminRow.admin_type)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    const cookieStore = await cookies();
    cookieStore.set('admin_auth', JSON.stringify({ email, t: Date.now() }), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 2,
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}


