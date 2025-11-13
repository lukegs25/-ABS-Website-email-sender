import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email parameter required' }, { status: 400 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: 'Database not configured' }, { status: 500 });
  }

  try {
    // 1. Check if email exists in database
    const { data: subscriptions, error: subError } = await supabase
      .from('new_subscribers')
      .select('*')
      .eq('email', email);

    if (subError) {
      return NextResponse.json({ error: subError.message }, { status: 500 });
    }

    if (!subscriptions || subscriptions.length === 0) {
      return NextResponse.json({
        found: false,
        message: 'Email not found in database',
        email
      });
    }

    // 2. Get all audiences
    const { data: audiences } = await supabase
      .from('audiences')
      .select('id, name');

    const audienceMap = {};
    if (audiences) {
      audiences.forEach(aud => {
        audienceMap[aud.id] = aud.name;
      });
    }

    // 3. Format subscriptions
    const formattedSubscriptions = subscriptions.map(sub => ({
      audienceId: sub.audience_id,
      audienceName: audienceMap[sub.audience_id] || 'Unknown',
      major: sub.major,
      isStudent: sub.is_student,
      subscribedAt: sub.created_at,
      otherInterests: sub.other_text
    }));

    // 4. Check for event/Greg Michaelsen audiences
    const gregAudiences = audiences?.filter(aud => 
      aud.name.toLowerCase().includes('greg') || 
      aud.name.toLowerCase().includes('michaelsen') ||
      aud.name.toLowerCase().includes('event')
    ) || [];

    const gregSubscriptions = gregAudiences.map(aud => ({
      audienceId: aud.id,
      audienceName: aud.name,
      isSubscribed: subscriptions.some(sub => sub.audience_id === aud.id)
    }));

    return NextResponse.json({
      found: true,
      email,
      subscriptionCount: subscriptions.length,
      subscriptions: formattedSubscriptions,
      allAudiences: audiences?.map(aud => ({
        id: aud.id,
        name: aud.name,
        isSubscribed: subscriptions.some(sub => sub.audience_id === aud.id)
      })),
      gregMichaelsenAudiences: gregSubscriptions
    });

  } catch (error) {
    return NextResponse.json({ 
      error: 'Failed to query database', 
      details: error.message 
    }, { status: 500 });
  }
}






