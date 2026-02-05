import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getResendClient } from "@/lib/resend";
import { getEmailAddressWithFallback } from "@/lib/email-config";

// POST /api/subscribers - Create new subscriber(s) with notification
export async function POST(request) {
  try {
    const body = await request.json();
    const { email, subscriptions } = body;

    if (!email || !subscriptions || subscriptions.length === 0) {
      return NextResponse.json(
        { error: "Email and subscriptions are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json(
        { error: "Database connection failed" },
        { status: 500 }
      );
    }

    // Check for existing subscriptions
    const { data: existing } = await supabase
      .from('new_subscribers')
      .select('audience_id')
      .eq('email', email)
      .in('audience_id', subscriptions.map(s => s.audience_id));

    const existingAudiences = existing ? existing.map(sub => sub.audience_id) : [];
    const newSubscriptions = subscriptions.filter(
      s => !existingAudiences.includes(s.audience_id)
    );

    if (newSubscriptions.length === 0) {
      return NextResponse.json({
        success: true,
        message: "Already subscribed to all selected newsletters",
        newCount: 0,
        existingCount: existingAudiences.length
      });
    }

    // Insert new subscriptions
    const { error: insertError } = await supabase
      .from('new_subscribers')
      .insert(newSubscriptions);

    if (insertError) {
      console.error('Insert error:', insertError);
      return NextResponse.json(
        { error: "Failed to create subscriptions" },
        { status: 500 }
      );
    }

    // Fetch audience names for the new subscriptions
    const { data: audiences } = await supabase
      .from('audiences')
      .select('id, name')
      .in('id', newSubscriptions.map(s => s.audience_id));

    // Check if user signed up for the main "AI in Business Society" audience
    const mainAudience = audiences?.find(aud => {
      const nameLower = aud.name.toLowerCase();
      return nameLower.includes('ai in business') || 
             (nameLower.includes('main') && !nameLower.includes('scai'));
    });

    const signedUpForMain = newSubscriptions.some(
      sub => sub.audience_id === mainAudience?.id
    );

    // Send notification email if they signed up for main audience
    if (signedUpForMain) {
      await sendNotificationEmail(email, newSubscriptions[0], audiences);
    }

    return NextResponse.json({
      success: true,
      message: "Subscriptions created successfully",
      newCount: newSubscriptions.length,
      existingCount: existingAudiences.length,
      notificationSent: signedUpForMain
    });

  } catch (error) {
    console.error('Error in subscribers API:', error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

// Helper function to send notification email
async function sendNotificationEmail(subscriberEmail, subscriberData, audiences) {
  try {
    const resend = getResendClient();
    if (!resend) {
      console.log('Resend client not available - skipping notification');
      return;
    }

    const audienceNames = audiences
      .filter(aud => subscriberData.audience_id === aud.id)
      .map(aud => aud.name)
      .join(', ');

    const isStudent = subscriberData.is_student ? 'Student' : 'Teacher/Faculty';
    const major = subscriberData.major || 'Not specified';

    await resend.emails.send({
      from: getEmailAddressWithFallback('notifications'),
      to: 'reedwebster7284@gmail.com',
      subject: '🎉 New AI in Business Society Signup!',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #002E5D;">New Subscriber Alert</h2>
          <p>Someone just signed up for the AI in Business Society email list!</p>
          
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <p style="margin: 10px 0;"><strong>Email:</strong> ${subscriberEmail}</p>
            <p style="margin: 10px 0;"><strong>Type:</strong> ${isStudent}</p>
            <p style="margin: 10px 0;"><strong>Major/Department:</strong> ${major}</p>
            <p style="margin: 10px 0;"><strong>Signed up for:</strong> ${audienceNames}</p>
            ${subscriberData.other_text ? `<p style="margin: 10px 0;"><strong>Additional interests:</strong> ${subscriberData.other_text}</p>` : ''}
          </div>
          
          <p style="color: #666; font-size: 14px;">
            This notification was sent because a new subscriber joined the AI in Business Society audience.
          </p>
        </div>
      `
    });

    console.log(`Notification email sent to reedwebster7284@gmail.com for new subscriber: ${subscriberEmail}`);
  } catch (error) {
    console.error('Error sending notification email:', error);
    // Don't throw - we don't want to fail the subscription if notification fails
  }
}


