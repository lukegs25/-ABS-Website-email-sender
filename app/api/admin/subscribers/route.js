import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ 
      error: "Database connection not available" 
    }, { status: 500 });
  }

  try {
    // Get all subscribers with detailed information
    const { data: subscribers, error } = await supabase
      .from('new_subscribers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    // Calculate statistics
    const stats = {
      total: subscribers.length,
      students: subscribers.filter(s => s.is_student).length,
      teachers: subscribers.filter(s => !s.is_student).length,
      uniqueEmails: new Set(subscribers.map(s => s.email)).size,
      byAudience: {}
    };

    // Count by audience
    subscribers.forEach(sub => {
      if (!stats.byAudience[sub.audience_id]) {
        stats.byAudience[sub.audience_id] = 0;
      }
      stats.byAudience[sub.audience_id]++;
    });

    return NextResponse.json({
      subscribers,
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