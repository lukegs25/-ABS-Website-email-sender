import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getResendClient } from "@/lib/resend";
import { getAdminSession, isSuperAdmin } from "@/lib/auth-helpers";

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
        Resend_ID: info.resendId || null
      }));
      return NextResponse.json({ audiences });
    };

    if (!supabase) {
      return buildFallback();
    }

    // Fetch custom audiences from DB (table: audiences)
    const { data, error } = await supabase
      .from('audiences')
      .select('id, name, Resend_ID')
      .order('id', { ascending: true });

    if (error) {
      return buildFallback();
    }

    // Merge built-in + DB
    const base = new Map(Object.entries(AUDIENCE_MAP).map(([id, info]) => [parseInt(id, 10), { id: parseInt(id, 10), name: info.name, Resend_ID: info.resendId || null }]));
    (data || []).forEach(row => {
      base.set(row.id, { id: row.id, name: row.name, Resend_ID: row.Resend_ID || null });
    });
    return NextResponse.json({ audiences: Array.from(base.values()).sort((a,b) => a.id - b.id) });
  } catch (e) {
    const audiences = Object.entries(AUDIENCE_MAP).map(([id, info]) => ({
      id: parseInt(id, 10),
      name: info.name,
      Resend_ID: info.resendId || null
    }));
    return NextResponse.json({ audiences });
  }
}

export async function POST(req) {
  try {
    // Require SuperAdmin permissions
    const session = await getAdminSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized - Missing admin authentication' }, { status: 401 });
    }

    if (!isSuperAdmin(session)) {
      return NextResponse.json({ 
        error: 'Forbidden - Only SuperAdmin can manage audiences' 
      }, { status: 403 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Database not configured - Cannot create new audiences without Supabase connection' 
      }, { status: 500 });
    }

    const body = await req.json();
    const name = (body?.name || '').trim();
    const createOnResend = body?.createOnResend !== false; // default true
    if (!name) {
      return NextResponse.json({ error: 'name is required' }, { status: 400 });
    }

    let Resend_ID = null;
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
      
      Resend_ID = created?.id || null;
    }

    // Compute next ID (max existing id + 1 across built-in and db)
    let nextId = 1;
    try {
      const { data: rows } = await supabase.from('audiences').select('id');
      const dbMax = Math.max(0, ...(rows || []).map(r => r.id || 0));
      const builtInMax = Math.max(...Object.keys(AUDIENCE_MAP).map(k => parseInt(k, 10)));
      nextId = Math.max(dbMax, builtInMax) + 1;
    } catch (idError) {
      // If error computing ID, use fallback
    }

    // Insert into Supabase with new id
    const { error: serr } = await supabase
      .from('audiences')
      .insert({ id: nextId, name, Resend_ID });
      
    if (serr) {
      console.log('Supabase insert failed:', serr);
      return NextResponse.json({ error: 'Failed to save audience' }, { status: 500 });
    }

    return NextResponse.json({ ok: true, id: nextId, name, Resend_ID });
  } catch (e) {
    console.log('Unexpected error in POST /api/admin/audiences:', e);
    return NextResponse.json({ error: 'Unexpected error' }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    // Require SuperAdmin permissions
    const session = await getAdminSession();
    
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized - Missing admin authentication' }, { status: 401 });
    }

    if (!isSuperAdmin(session)) {
      return NextResponse.json({ 
        error: 'Forbidden - Only SuperAdmin can delete audiences' 
      }, { status: 403 });
    }

    const body = await req.json();
    const { audienceId, audienceName, resendId } = body;

    if (!audienceId) {
      return NextResponse.json({ error: 'audienceId is required' }, { status: 400 });
    }

    // Prevent deletion of main ABS audience
    if (audienceId === 8) {
      return NextResponse.json({ 
        error: 'Cannot delete the main ABS audience' 
      }, { status: 400 });
    }

    const resend = getResendClient();
    if (!resend) {
      return NextResponse.json({ error: 'Resend API not configured' }, { status: 500 });
    }

    let migrationStats = {
      totalInAudience: 0,
      duplicates: 0,
      migrated: 0,
      errors: 0
    };

    // If there's a Resend ID, migrate emails to main ABS audience
    if (resendId) {
      try {
        // Get main ABS audience (ID 8)
        const { data: audiencesList } = await resend.audiences.list();
        const mainABSAudience = audiencesList?.data?.find(a => a.name === "AI in Business (main)");
        
        if (!mainABSAudience) {
          console.warn('Main ABS audience not found in Resend - skipping email migration');
          // Skip migration but continue with deletion
          migrationStats = {
            totalInAudience: 0,
            duplicates: 0,
            migrated: 0,
            errors: 0,
            skipped: true,
            message: 'Migration skipped - main ABS audience not found'
          };
        } else {

        // Get contacts from the audience being deleted
        const { data: targetContactsList } = await resend.contacts.list({
          audienceId: resendId
        });

        const targetEmails = targetContactsList?.data?.map(c => c.email) || [];
        migrationStats.totalInAudience = targetEmails.length;

        if (targetEmails.length > 0) {
          // Get contacts from main ABS audience
          const { data: mainContactsList } = await resend.contacts.list({
            audienceId: mainABSAudience.id
          });

          const mainEmails = new Set(mainContactsList?.data?.map(c => c.email) || []);

          // Filter out duplicates
          const emailsToMigrate = targetEmails.filter(email => !mainEmails.has(email));
          migrationStats.duplicates = targetEmails.length - emailsToMigrate.length;

          // Add non-duplicate emails to main ABS audience
          for (const email of emailsToMigrate) {
            try {
              await resend.contacts.create({
                email,
                audienceId: mainABSAudience.id
              });
              migrationStats.migrated++;
            } catch (addError) {
              console.error(`Failed to migrate ${email}:`, addError);
              migrationStats.errors++;
            }
          }
        }
        }

        // Delete the audience from Resend
        await resend.audiences.remove(resendId);
      } catch (resendError) {
        console.error('Resend API error during deletion:', resendError);
        return NextResponse.json({ 
          error: 'Failed to delete audience from Resend',
          details: resendError.message 
        }, { status: 502 });
      }
    }

    // Remove from database
    const supabase = getSupabaseServerClient();
    if (supabase) {
      try {
        await supabase
          .from('audiences')
          .delete()
          .eq('id', audienceId);
      } catch (dbError) {
        console.error('Database error during deletion:', dbError);
        // Continue even if DB deletion fails
      }
    }

    return NextResponse.json({ 
      ok: true, 
      audienceName,
      migrationStats
    });
  } catch (e) {
    console.error('Unexpected error in DELETE /api/admin/audiences:', e);
    return NextResponse.json({ 
      error: 'Unexpected error',
      details: e.message 
    }, { status: 500 });
  }
}

