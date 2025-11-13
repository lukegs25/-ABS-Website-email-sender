import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getAdminSession, isSuperAdmin } from "@/lib/auth-helpers";

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    // Return empty data when database is not configured
    return NextResponse.json({
      subscribers: [],
      stats: {
        total: 0,
        students: 0,
        teachers: 0,
        uniqueEmails: 0,
        byAudience: {}
      }
    });
  }

  try {
    // Get all subscribers with detailed information
    // NOTE: Supabase has a default limit of 1000 rows. We use range(0, 9999) to fetch up to 10,000 subscribers.
    // If you expect more than 10,000 subscribers, increase the range or implement pagination.
    const { data: subscribers, error } = await supabase
      .from('new_subscribers')
      .select('*')
      .range(0, 9999)
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Handle null or empty subscribers
    const subscriberList = subscribers || [];

    // Calculate statistics
    const stats = {
      total: subscriberList.length,
      students: subscriberList.filter(s => s.is_student).length,
      teachers: subscriberList.filter(s => !s.is_student).length,
      uniqueEmails: new Set(subscriberList.map(s => s.email)).size,
      byAudience: {}
    };

    // Count by audience
    subscriberList.forEach(sub => {
      if (!stats.byAudience[sub.audience_id]) {
        stats.byAudience[sub.audience_id] = 0;
      }
      stats.byAudience[sub.audience_id]++;
    });

    return NextResponse.json({
      subscribers: subscriberList,
      stats
    });

  } catch (error) {
    console.error('Error fetching subscribers:', error);
    return NextResponse.json({ 
      error: "Failed to fetch subscribers", 
      details: error.message 
    }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    // Require admin authentication
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ 
        error: 'Unauthorized - Missing admin authentication' 
      }, { status: 401 });
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ 
        error: 'Database not configured - Please set up Supabase connection' 
      }, { status: 500 });
    }

    const body = await req.json();
    const { audienceId, subscribers } = body;

    if (!audienceId || !subscribers || !Array.isArray(subscribers)) {
      return NextResponse.json({ 
        error: 'Missing required fields: audienceId and subscribers array' 
      }, { status: 400 });
    }

    // Validate subscribers data
    const validSubscribers = subscribers.filter(sub => {
      return sub.email && typeof sub.email === 'string' && sub.email.includes('@');
    });

    if (validSubscribers.length === 0) {
      return NextResponse.json({ 
        error: 'No valid subscribers found in the upload' 
      }, { status: 400 });
    }

    // Prepare data for insertion
    const subscribersToInsert = validSubscribers.map(sub => ({
      email: sub.email.toLowerCase().trim(),
      audience_id: parseInt(audienceId),
      is_student: sub.is_student !== undefined ? sub.is_student : true,
      major: sub.major || null,
      created_at: new Date().toISOString()
    }));

    // Check for existing subscribers
    const emails = subscribersToInsert.map(s => s.email);
    const { data: existingSubscribers } = await supabase
      .from('new_subscribers')
      .select('email, audience_id')
      .in('email', emails);

    // Filter out subscribers that already exist in the same audience
    const existingMap = new Map();
    existingSubscribers?.forEach(sub => {
      const key = `${sub.email}-${sub.audience_id}`;
      existingMap.set(key, true);
    });

    const newSubscribers = subscribersToInsert.filter(sub => {
      const key = `${sub.email}-${sub.audience_id}`;
      return !existingMap.has(key);
    });

    let inserted = 0;
    let skipped = subscribersToInsert.length - newSubscribers.length;

    if (newSubscribers.length > 0) {
      const { error: insertError } = await supabase
        .from('new_subscribers')
        .insert(newSubscribers);

      if (insertError) {
        console.error('Error inserting subscribers:', insertError);
        return NextResponse.json({ 
          error: 'Failed to insert subscribers', 
          details: insertError.message 
        }, { status: 500 });
      }

      inserted = newSubscribers.length;
    }

    return NextResponse.json({
      success: true,
      inserted,
      skipped,
      total: subscribersToInsert.length,
      message: `Successfully added ${inserted} new subscriber(s). Skipped ${skipped} duplicate(s).`
    });

  } catch (error) {
    console.error('Error in POST /api/admin/subscribers:', error);
    return NextResponse.json({ 
      error: 'Failed to process CSV upload', 
      details: error.message 
    }, { status: 500 });
  }
}