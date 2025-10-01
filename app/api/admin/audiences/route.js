import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getResendClient } from "@/lib/resend";

// Fallback built-in audiences
const AUDIENCE_MAP = {
  8: { name: "AI in Business (main)" },
  7: { name: "SCAI - Students" },
  6: { name: "Finance" },
  5: { name: "Marketing" },
  4: { name: "Semi-conductors" },
  9: { name: "Accounting" },
  3: { name: "Etc/general" },
  1: { name: "SCAI - Teachers" },
  2: { name: "Teachers supporting student group" }
};

export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    const buildFallback = () => {
      const audiences = Object.entries(AUDIENCE_MAP).map(([id, info]) => ({
        id: parseInt(id, 10),
        name: info.name,
        resend_id: info.resendId || null
      }));
      return NextResponse.json({ audiences });
    };

    if (!supabase) {
      return buildFallback();
    }

    // Fetch custom audiences from DB (table: audiences)
    const { data, error } = await supabase
      .from('audiences')
      .select('id, name, resend_id')
      .order('id', { ascending: true });

    if (error) {
      return buildFallback();
    }

    // Merge built-in + DB
    const base = new Map(Object.entries(AUDIENCE_MAP).map(([id, info]) => [parseInt(id, 10), { id: parseInt(id, 10), name: info.name, resend_id: info.resendId || null }]));
    (data || []).forEach(row => {
      base.set(row.id, { id: row.id, name: row.name, resend_id: row.resend_id || null });
    });
    return NextResponse.json({ audiences: Array.from(base.values()).sort((a,b) => a.id - b.id) });
  } catch (e) {
    const audiences = Object.entries(AUDIENCE_MAP).map(([id, info]) => ({
      id: parseInt(id, 10),
      name: info.name,
      resend_id: info.resendId || null
    }));
    return NextResponse.json({ audiences });
  }
}

export async function POST(req) {
  try {
    // Require admin cookie
    const cookieStore = await cookies();
    const auth = cookieStore.get('admin_auth');
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
    }

    const body = await req.json();
    const name = (body?.name || '').trim();
    const createOnResend = body?.createOnResend !== false; // default true
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    let resend_id = null;
    if (createOnResend) {
      const resend = getResendClient();
      if (!resend) {
        return NextResponse.json({ error: 'Resend API not configured' }, { status: 500 });
      }
      // Create audience on Resend
      const { data: created, error: rerr } = await resend.audiences.create({ name });
      if (rerr) {
        return NextResponse.json({ error: 'Failed to create audience in Resend' }, { status: 502 });
      }
      resend_id = created?.id || null;
    }

    // Compute next ID (max existing id + 1 across built-in and db)
    let nextId = 1;
    try {
      const { data: rows } = await supabase.from('audiences').select('id');
      const dbMax = Math.max(0, ...(rows || []).map(r => r.id || 0));
      const builtInMax = Math.max(...Object.keys(AUDIENCE_MAP).map(k => parseInt(k, 10)));
      nextId = Math.max(dbMax, builtInMax) + 1;
    } catch {}

    // Insert into Supabase with new id
    const { error: serr } = await supabase
      .from('audiences')
      .insert({ id: nextId, name, resend_id });
    if (serr) {
      return NextResponse.json({ error: 'Failed to save audience' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: nextId, name, resend_id });
  } catch (e) {
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}


