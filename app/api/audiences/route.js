import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

// Public endpoint to get all audiences for signup forms
export async function GET() {
  try {
    const supabase = getSupabaseServerClient();

    if (!supabase) {
      // Return empty if no database connection
      return NextResponse.json({ audiences: [] });
    }

    // Fetch all audiences from DB
    const { data, error } = await supabase
      .from('audiences')
      .select('id, name')
      .order('id', { ascending: true });

    if (error) {
      console.error('Error fetching audiences:', error);
      return NextResponse.json({ audiences: [] });
    }

    // Transform data to include mapping info for the forms
    const audiences = (data || []).map(audience => {
      // Map audience IDs/names to subgroup identifiers
      let subgroupId = null;
      const nameLower = audience.name.toLowerCase();
      
      if (nameLower.includes('scai') && nameLower.includes('student')) {
        subgroupId = 'scai';
      } else if (nameLower.includes('finance')) {
        subgroupId = 'finance';
      } else if (nameLower.includes('marketing')) {
        subgroupId = 'marketing';
      } else if (nameLower.includes('semi') || nameLower.includes('conductor')) {
        subgroupId = 'semi_conductor';
      } else if (nameLower.includes('accounting')) {
        subgroupId = 'accounting';
      } else if (nameLower.includes('scai') && nameLower.includes('teacher')) {
        subgroupId = 'scai_teacher';
      } else if (nameLower.includes('teacher') && nameLower.includes('support')) {
        subgroupId = 'advisor_interest';
      }
      
      return {
        id: audience.id,
        name: audience.name,
        subgroupId
      };
    });

    return NextResponse.json({ audiences });

  } catch (e) {
    console.error('Error in audiences API:', e);
    return NextResponse.json({ audiences: [] });
  }
}

