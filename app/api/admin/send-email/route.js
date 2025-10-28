import { NextResponse } from "next/server";
import { getResendClient } from "@/lib/resend";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getAdminSession, filterAudiencesByAdmin, filterAudienceIdsFromRows } from "@/lib/auth-helpers";

// Audience ID mappings from resend_sample.txt
const AUDIENCE_MAP = {
  8: { name: "AI in Business (main)", resendId: "dd09d752-45b5-4f48-8fec-1fc4ee692b92" },
  7: { name: "SCAI - Students", resendId: "c53bb7bc-31f2-47e3-832b-e69ced4c7f0e" },
  6: { name: "Finance", resendId: "cc40b8fc-e023-4200-b430-67e4384a0154" },
  5: { name: "Marketing", resendId: "4804bc32-5fd6-4f65-85b9-a0a32118ad2b" },
  4: { name: "Semi-conductors", resendId: "9c950ca2-00e9-4734-bf54-38724c6678ea" },
  9: { name: "Accounting", resendId: "eaed2692-b87c-4789-84cc-535dc4a66a9d" },
  3: { name: "Etc/general", resendId: "f879022e-5227-4dc9-95ac-5306ceadb8e5" },
  1: { name: "SCAI - Teachers", resendId: "4a341b73-686d-40f9-bca6-7891af8f789f" },
  2: { name: "Teachers wanting to support students", resendId: "1ed0b879-f940-44b2-902b-bb474f76af94" }
};

export async function POST(request) {
  try {
    // Check admin authentication and permissions
    const session = await getAdminSession();
    if (!session) {
      return NextResponse.json({ 
        error: "Unauthorized - Admin authentication required" 
      }, { status: 401 });
    }

    const body = await request.json();
    const { subject, content, audienceIds, fromName = "AI in Business Society", testMode = false, attachments = [] } = body;

    // Basic validation
    if (!subject || !content || !audienceIds || !Array.isArray(audienceIds) || audienceIds.length === 0) {
      return NextResponse.json({ 
        error: "Missing required fields: subject, content, and audienceIds" 
      }, { status: 400 });
    }

    // Load audience metadata for requested IDs
    const supabase = getSupabaseServerClient();
    if (!supabase) {
      return NextResponse.json({ 
        error: "Database connection not available" 
      }, { status: 500 });
    }

    const { data: requestedAudienceRows } = await supabase
      .from('audiences')
      .select('id, name, Resend_ID')
      .in('id', audienceIds);

    // Determine allowed audience IDs based on tokens (IDs or names)
    const allowedAudienceIds = filterAudienceIdsFromRows(session, requestedAudienceRows);

    if (!allowedAudienceIds || allowedAudienceIds.length === 0) {
      return NextResponse.json({ 
        error: "You do not have permission to send to any of the selected audiences" 
      }, { status: 403 });
    }

    // Warn if some audiences were filtered out
    if (allowedAudienceIds.length < audienceIds.length) {
      console.log(`Admin ${session.email} attempted to send to unauthorized audiences. Filtered from ${audienceIds.length} to ${allowedAudienceIds.length}`);
    }

    const resend = getResendClient();
    if (!resend) {
      console.log('⚠️ No Resend API key configured - simulating email send');
      return NextResponse.json({ 
        ok: true, 
        simulated: true, 
        message: "Email sending simulated (no Resend API key)" 
      });
    }
    
    console.log('✅ Resend client connected and ready');

    // Load audience metadata from Supabase (only allowed audiences)
    const { data: audienceRows } = await supabase
      .from('audiences')
      .select('id, name, Resend_ID')
      .in('id', allowedAudienceIds);

    const idToAudience = new Map();
    (audienceRows || []).forEach(r => idToAudience.set(r.id, r));

    const results = [];
    
    for (const audienceId of allowedAudienceIds) {
      const audienceInfo = idToAudience.get(audienceId);
      if (!audienceInfo) {
        results.push({
          audienceId,
          error: `Unknown audience ID: ${audienceId}`
        });
        continue;
      }

      try {
        if (testMode) {
          // In test mode, get a few sample emails instead of sending to entire audience
          console.log(`🧪 TEST MODE - Sending to sample subscribers from audience: ${audienceInfo.name}`);
          const { data: subscribers, error } = await supabase
            .from('new_subscribers')
            .select('email')
            .eq('audience_id', audienceId)
            .limit(5);

          if (error) throw error;

          if (subscribers && subscribers.length > 0) {
            const emails = subscribers.map(s => s.email);
            
            // Prepare email payload
            const emailPayload = {
              from: `${fromName} <no-reply@aiinbusinesssociety.org>`,
              to: emails,
              subject: `[TEST] ${subject}`,
              html: `
                <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6;">
                  <div style="background-color: #002e5d; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">AI in Business Society</h1>
                  </div>
                  <div style="padding: 20px; background-color: #f9f9f9;">
                    <p style="background-color: #ffe6e6; padding: 10px; border-left: 4px solid #ff0000; margin: 0 0 20px;">
                      <strong>TEST EMAIL</strong> - This would have been sent to ${audienceInfo.name} (${subscribers.length} recipients in test sample)
                    </p>
                    ${content}
                  </div>
                  <div style="background-color: #002e5d; color: white; padding: 15px; text-align: center; font-size: 12px;">
                    BYU AI in Business Society
                  </div>
                </div>
              `,
            };
            
            // Add attachments if present
            if (attachments && attachments.length > 0) {
              emailPayload.attachments = attachments;
            }
            
            const { data, error: sendError } = await resend.emails.send(emailPayload);

            if (sendError) throw sendError;

            console.log(`✅ Test email sent successfully to ${emails.length} recipients! Email ID: ${data?.id}`);
            results.push({
              audienceId,
              audienceName: audienceInfo.name,
              success: true,
              testMode: true,
              recipientCount: emails.length,
              emailId: data?.id
            });
          } else {
            results.push({
              audienceId,
              audienceName: audienceInfo.name,
              error: "No subscribers found for this audience"
            });
          }
        } else {
          // Production mode - always use database approach since subscribers are in Supabase, not Resend
          if (false && audienceInfo.Resend_ID) { // Disabled broadcast API - using database instead
            // Normalize Resend_ID to a UUID string (some rows may store an object like { id: "uuid" })
            const rawResendId = audienceInfo.Resend_ID;
            console.log('🔍 Raw Resend_ID from DB:', typeof rawResendId, JSON.stringify(rawResendId));
            
            let normalizedResendId;
            if (typeof rawResendId === 'string') {
              normalizedResendId = rawResendId;
            } else if (rawResendId && typeof rawResendId === 'object') {
              // Try common property names
              normalizedResendId = rawResendId.id || rawResendId.uuid || rawResendId.value || String(rawResendId);
            } else {
              normalizedResendId = null;
            }
            
            // Ensure it's a string
            normalizedResendId = String(normalizedResendId || '');
            console.log('✅ Normalized Resend_ID:', normalizedResendId);

            // Basic UUID v4 format validation
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
            if (!normalizedResendId || !uuidRegex.test(normalizedResendId)) {
              results.push({
                audienceId,
                audienceName: audienceInfo.name,
                error: `Invalid Resend ID format for this audience. Got: ${normalizedResendId || 'null/empty'}`
              });
              continue;
            }
            // Option 1: If audience has Resend ID, use broadcasts API
            console.log(`📡 Sending via Resend Broadcast to audience: ${audienceInfo.name} (${normalizedResendId})`);
            const broadcastPayload = {
              audienceId: normalizedResendId,
              from: `${fromName} <no-reply@aiinbusinesssociety.org>`,
              subject: subject,
              html: `
                <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6;">
                  <div style="background-color: #002e5d; color: white; padding: 20px; text-align: center;">
                    <h1 style="margin: 0; font-size: 24px;">AI in Business Society</h1>
                  </div>
                  <div style="padding: 20px; background-color: #f9f9f9;">
                    ${content}
                  </div>
                  <div style="background-color: #002e5d; color: white; padding: 15px; text-align: center; font-size: 12px;">
                    BYU AI in Business Society
                  </div>
                </div>
              `,
            };
            
            if (attachments && attachments.length > 0) {
              broadcastPayload.attachments = attachments;
            }
            
            console.log('🔍 Broadcast payload:', JSON.stringify(broadcastPayload, null, 2));
            const { data, error: sendError } = await resend.broadcasts.send(broadcastPayload);
            
            if (sendError) {
              console.error('❌ Resend broadcast error:', JSON.stringify(sendError, null, 2));
              throw new Error(sendError.message || JSON.stringify(sendError));
            }

            console.log(`✅ Broadcast sent successfully! Broadcast ID: ${data?.id}`);
            results.push({
              audienceId,
              audienceName: audienceInfo.name,
              success: true,
              broadcastId: data?.id
            });
          } else {
            // Option 2: No Resend ID - fetch subscribers from database and send individually
            console.log(`📧 No Resend ID for audience: ${audienceInfo.name} - fetching subscribers from database`);
            const { data: subscribers, error: dbError } = await supabase
              .from('new_subscribers')
              .select('email')
              .eq('audience_id', audienceId);

            if (dbError) throw dbError;

            if (!subscribers || subscribers.length === 0) {
              results.push({
                audienceId,
                audienceName: audienceInfo.name,
                error: "No subscribers found for this audience"
              });
              continue;
            }

            const emails = subscribers.map(s => s.email);
            console.log(`📬 Found ${emails.length} subscribers - sending individual emails via Resend`);
            
            let sentCount = 0;
            let errorCount = 0;

            // Helper to add delay to respect rate limits (2 requests/second)
            const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

            // Send individual emails to protect privacy (no one sees other recipients)
            for (let i = 0; i < emails.length; i++) {
              const email = emails[i];
              
              // Rate limit: Wait 500ms between emails (allows 2 requests/second)
              if (i > 0) {
                await delay(500);
              }
              
              const emailPayload = {
                from: `${fromName} <no-reply@aiinbusinesssociety.org>`,
                to: [email],
                subject: subject,
                html: `
                  <div style="max-width: 600px; margin: 0 auto; font-family: Arial, sans-serif; line-height: 1.6;">
                    <div style="background-color: #002e5d; color: white; padding: 20px; text-align: center;">
                      <h1 style="margin: 0; font-size: 24px;">AI in Business Society</h1>
                    </div>
                    <div style="padding: 20px; background-color: #f9f9f9;">
                      ${content}
                    </div>
                    <div style="background-color: #002e5d; color: white; padding: 15px; text-align: center; font-size: 12px;">
                      BYU AI in Business Society
                    </div>
                  </div>
                `,
              };

              if (attachments && attachments.length > 0) {
                emailPayload.attachments = attachments;
              }

              try {
                const { data, error: sendError } = await resend.emails.send(emailPayload);
                if (sendError) {
                  console.error(`Send error for ${email}:`, sendError);
                  errorCount++;
                } else {
                  sentCount++;
                }
              } catch (sendErr) {
                console.error(`Send exception for ${email}:`, sendErr);
                errorCount++;
              }
            }

            console.log(`✅ Sent ${sentCount}/${emails.length} emails successfully via Resend (${errorCount} errors)`);
            results.push({
              audienceId,
              audienceName: audienceInfo.name,
              success: true,
              recipientCount: emails.length,
              sentCount,
              errorCount,
              method: 'database'
            });
          }
        }
      } catch (error) {
        results.push({
          audienceId,
          audienceName: audienceInfo.name,
          error: error.message
        });
      }
    }

    const successCount = results.filter(r => r.success).length;
    const errorCount = results.filter(r => r.error).length;

    return NextResponse.json({
      ok: true,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        errors: errorCount,
        testMode
      }
    });

  } catch (error) {
    console.error('Email sending error:', error);
    return NextResponse.json({ 
      error: "Failed to send emails", 
      details: error.message 
    }, { status: 500 });
  }
}

export async function GET() {
  // Check admin authentication and permissions
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ 
      error: "Unauthorized - Admin authentication required",
      audiences: [], 
      totalSubscribers: 0 
    }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ audiences: [], totalSubscribers: 0 });
  }

  try {
    const { data: rows } = await supabase
      .from('audiences')
      .select('id, name');

    const { data: subs } = await supabase
      .from('new_subscribers')
      .select('audience_id');

    const countMap = {};
    subs?.forEach(sub => {
      countMap[sub.audience_id] = (countMap[sub.audience_id] || 0) + 1;
    });

    let audiences = (rows || []).map(r => ({
      id: r.id,
      name: r.name,
      subscriberCount: countMap[r.id] || 0
    })).sort((a, b) => a.id - b.id);

    // Filter audiences by admin tokens (IDs or names)
    audiences = filterAudiencesByAdmin(session, audiences);

    return NextResponse.json({
      audiences,
      totalSubscribers: Object.values(countMap).reduce((sum, count) => sum + count, 0)
    });

  } catch (error) {
    console.error('Error fetching audience data:', error);
    return NextResponse.json({ audiences: [], totalSubscribers: 0 });
  }
}