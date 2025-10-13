import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function POST(req) {
  try {
    console.log('[POST /api/admin-login] Starting login request');
    
    const body = await req.json();
    console.log('[POST /api/admin-login] Request body:', { email: body?.email, hasPassword: !!body?.password });
    
    const email = (body?.email || "").trim().toLowerCase();
    const password = body?.password || "";
    const skipDbHeader = req.headers?.get?.('x-skip-db') === 'true';
    const forceAdminType = req.headers?.get?.('x-admin-type');
    
    console.log('[POST /api/admin-login] Parsed data:', { 
      email, 
      skipDbHeader, 
      forceAdminType 
    });

    if (!email || !password) {
      console.log('[POST /api/admin-login] Missing email or password - returning 400');
      return NextResponse.json({ error: "Email and password required" }, { status: 400 });
    }

    const expectedPassword = process.env.ADMIN_PASSWORD || process.env.SUPABASE_ADMIN_PASSWORD;
    console.log('[POST /api/admin-login] Expected password configured?', !!expectedPassword);
    
    if (!expectedPassword) {
      console.log('[POST /api/admin-login] Admin password not configured - returning 500');
      return NextResponse.json({ error: "Admin password not configured" }, { status: 500 });
    }
    
    const passwordMatch = password === expectedPassword;
    console.log('[POST /api/admin-login] Password match?', passwordMatch);
    
    if (!passwordMatch) {
      console.log('[POST /api/admin-login] Invalid password - returning 401');
      return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();
    console.log('[POST /api/admin-login] Supabase client:', supabase ? 'connected' : 'null');
    
    const skipDb = process.env.SKIP_DB_ON_LOGIN === 'true'; // Check env variable
    console.log('[POST /api/admin-login] SKIP_DB_ON_LOGIN env var:', process.env.SKIP_DB_ON_LOGIN);
    
    if (!supabase) {
      console.log('[POST /api/admin-login] No Supabase - checking skip conditions');
      console.log('[POST /api/admin-login] skipDb:', skipDb, 'skipDbHeader:', skipDbHeader);
      
      if (skipDb || skipDbHeader === true) {
        console.log('[POST /api/admin-login] Skipping DB - setting simulated session');
        const cookieStore = await cookies();
        const sessionData = { 
          email,
          admin_type: forceAdminType || 'SuperAdmin',
          t: Date.now() 
        };
        console.log('[POST /api/admin-login] Session data:', sessionData);
        
        cookieStore.set('admin_auth', JSON.stringify(sessionData), {
          httpOnly: true,
          sameSite: 'lax',
          secure: process.env.NODE_ENV === 'production',
          path: '/',
          maxAge: 60 * 60 * 2,
        });
        return NextResponse.json({ ok: true, admin_type: forceAdminType || 'SuperAdmin', simulated: true });
      }
      console.log('[POST /api/admin-login] Cannot skip DB - returning 500');
      return NextResponse.json({ error: "Server configuration error" }, { status: 500 });
    }

    // Check admin record with non-null email
    // Primary check: new_subscribers with is_admin = true and email not null
    console.log('[POST /api/admin-login] Querying database for admin record with email:', email);
    
    const { data: adminRow, error } = await supabase
      .from('new_subscribers')
      .select('*')
      .eq('email', email)
      .not('email', 'is', null)
      .limit(1)
      .maybeSingle();

    console.log('[POST /api/admin-login] Query result:', { 
      hasData: !!adminRow, 
      error: error ? error.message : null,
      adminRow: adminRow ? { email: adminRow.email, adminType: adminRow.adminType } : null
    });

    if (error) {
      console.log('[POST /api/admin-login] Database error:', error);
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // Robust adminType parsing: allow JSON arrays, comma-separated strings, or single value
    const hasAdminType = Object.prototype.hasOwnProperty.call(adminRow || {}, 'adminType');
    console.log('[POST /api/admin-login] Has adminType property?', hasAdminType);
    console.log('[POST /api/admin-login] Checking authorization:', {
      hasAdminRow: !!adminRow,
      hasEmail: !!(adminRow?.email),
      hasAdminType,
      adminTypeValue: adminRow?.adminType
    });
    
    if (!adminRow || !adminRow.email || (hasAdminType && !adminRow.adminType)) {
      console.log('[POST /api/admin-login] Authorization failed - returning 403');
      return NextResponse.json({ error: "Not authorized" }, { status: 403 });
    }

    let adminTypeValue = adminRow.adminType;
    console.log('[POST /api/admin-login] Original adminType value:', adminTypeValue, 'Type:', typeof adminTypeValue);
    
    // Handle different adminType formats
    if (Array.isArray(adminTypeValue)) {
      // Already a JavaScript array like ["Accounting"]
      console.log('[POST /api/admin-login] adminType is already an array');
      adminTypeValue = adminTypeValue.join(',');
      console.log('[POST /api/admin-login] Converted array to comma-separated:', adminTypeValue);
    } else if (typeof adminTypeValue === 'string') {
      try {
        // If adminType is JSON string (e.g., '["accounting"]') parse and join
        if (adminTypeValue.trim().startsWith('[')) {
          console.log('[POST /api/admin-login] Parsing adminType as JSON array');
          const arr = JSON.parse(adminTypeValue);
          if (Array.isArray(arr)) {
            adminTypeValue = arr.join(',');
            console.log('[POST /api/admin-login] Converted JSON to comma-separated:', adminTypeValue);
          }
        }
      } catch (parseError) {
        console.log('[POST /api/admin-login] Error parsing adminType JSON:', parseError);
      }
    }

    const cookieStore = await cookies();
    const cookieData = { 
      email, 
      admin_type: adminTypeValue,
      t: Date.now() 
    };
    console.log('[POST /api/admin-login] Setting cookie with data:', cookieData);
    
    cookieStore.set('admin_auth', JSON.stringify(cookieData), {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 2,
    });

    console.log('[POST /api/admin-login] Login successful');
    return NextResponse.json({ 
      ok: true, 
      admin_type: adminRow.adminType 
    });
  } catch (e) {
    console.error('[POST /api/admin-login] ❌ UNEXPECTED ERROR:', e);
    console.error('[POST /api/admin-login] Error stack:', e.stack);
    console.error('[POST /api/admin-login] Error message:', e.message);
    return NextResponse.json({ 
      error: "Unexpected error",
      details: e.message,
      stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
    }, { status: 500 });
  }
}


// Return current admin session from secure cookie
export async function GET() {
  try {
    console.log('[GET /api/admin-login] Checking session');
    
    const cookieStore = await cookies();
    const auth = cookieStore.get('admin_auth');
    console.log('[GET /api/admin-login] Cookie found?', !!auth);
    
    if (!auth) {
      console.log('[GET /api/admin-login] No auth cookie - returning 401');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    try {
      const session = JSON.parse(auth.value);
      console.log('[GET /api/admin-login] Session data:', {
        email: session.email,
        admin_type: session.admin_type
      });
      
      return NextResponse.json({
        ok: true,
        email: session.email,
        admin_type: session.admin_type,
      });
    } catch (parseError) {
      console.log('[GET /api/admin-login] Error parsing cookie:', parseError);
      return NextResponse.json({ error: 'Invalid session cookie' }, { status: 400 });
    }
  } catch (e) {
    console.error('[GET /api/admin-login] ❌ UNEXPECTED ERROR:', e);
    console.error('[GET /api/admin-login] Error stack:', e.stack);
    return NextResponse.json({ 
      error: 'Unexpected error',
      details: e.message
    }, { status: 500 });
  }
}


