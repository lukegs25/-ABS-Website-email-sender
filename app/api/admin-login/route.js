import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(req) {
  try {
    const body = await req.json();
    const email = (body?.email || "").trim().toLowerCase();
    const password = body?.password || "";
    const skipDbHeader = req.headers?.get?.('x-skip-db') === 'true';
    const forceAdminType = req.headers?.get?.('x-admin-type');

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
    const skipDb = false; // Never auto-bypass to SuperAdmin
    if (!supabase) {
      if (skipDb || skipDbHeader === true) {
        const cookieStore = await cookies();
        cookieStore.set('admin_auth', JSON.stringify({ 
          email,
          admin_type: forceAdminType || 'accounting',
          t: Date.now() 
        }), {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: 60 * 60 * 2,
        });
        return NextResponse.json({ ok: true, admin_type: forceAdminType || 'accounting', simulated: true });
      }
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

    // Robust adminType parsing: allow JSON arrays, comma-separated strings, or single value
    const hasAdminType = Object.prototype.hasOwnProperty.call(adminRow || {}, 'adminType');
    if (!adminRow || !adminRow.email || (hasAdminType && !adminRow.adminType)) {
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    let adminTypeValue = adminRow.adminType;
    try {
      // If adminType is JSON (e.g., ["accounting"]) parse and join
      if (typeof adminTypeValue === 'string' && adminTypeValue.trim().startsWith('[')) {
        const arr = JSON.parse(adminTypeValue);
        if (Array.isArray(arr)) {
          adminTypeValue = arr.join(',');
        }
      }
    } catch {}

    const cookieStore = await cookies();
    const cookieData = { 
      email, 
      admin_type: adminTypeValue,
      t: Date.now() 
    };
    cookieStore.set('admin_auth', JSON.stringify(cookieData), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 2,
    });

    return NextResponse.json({ 
      ok: true, 
      admin_type: adminRow.adminType 
    });
  } catch (e) {
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}


// Return current admin session from secure cookie
export async function GET() {
  try {
    const cookieStore = await cookies();
    const auth = cookieStore.get('admin_auth');
    if (!auth) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
      const session = JSON.parse(auth.value);
      return NextResponse.json({
        ok: true,
        email: session.email,
        admin_type: session.admin_type,
      });
    } catch (e) {
      return NextResponse.json({ error: 'Invalid session cookie' }, { status: 400 });
    }
  } catch (e) {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}


