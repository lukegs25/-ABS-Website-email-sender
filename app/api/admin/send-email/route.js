import { NextResponse } from "next/server";
import { getResendClient } from "@/lib/resend";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getAdminSession, filterAudiencesByAdmin, filterAudienceIdsFromRows } from "@/lib/auth-helpers";

// Set maximum function duration to 300 seconds (5 minutes - requires Vercel Pro)
// If on Hobby plan, this will use 60 seconds max
export const maxDuration = 300;

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
  console.log('🔵 [send-email] Starting email send request');
  try {
    // Check admin authentication and permissions
    const session = await getAdminSession();
    console.log('🔵 [send-email] Session check:', session ? 'authenticated' : 'not authenticated');
    if (!session) {
      return NextResponse.json({ 
        error: "Unauthorized - Admin authentication required" 
      }, { status: 401 });
    }

    let body;
    try {
      body = await request.json();
      console.log('🔵 [send-email] Request body parsed successfully. Audiences:', body.audienceIds);
    } catch (parseError) {
      console.error('❌ [send-email] Failed to parse request body:', parseError);
      return NextResponse.json({ 
        error: "Invalid request body - must be valid JSON",
        details: parseError.message 
      }, { status: 400 });
    }
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
            
            // Use batch API even for test mode to ensure privacy
            const batchPayload = emails.map(email => ({
              from: `${fromName} <no-reply@aiinbusinesssociety.org>`,
              to: [email],
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
              ...(attachments && attachments.length > 0 ? { attachments } : {})
            }));
            
            const { data, error: sendError } = await resend.batch.send(batchPayload);

            if (sendError) throw sendError;

            console.log(`✅ Test email sent successfully to ${emails.length} recipients via Batch API`);
            results.push({
              audienceId,
              audienceName: audienceInfo.name,
              success: true,
              testMode: true,
              recipientCount: emails.length,
              emailsSent: emails
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
            
            // Fetch emails for the broadcast mode to display in results
            const { data: broadcastSubscribers } = await supabase
              .from('new_subscribers')
              .select('email')
              .eq('audience_id', audienceId)
              .range(0, 9999);
            
            const broadcastEmails = broadcastSubscribers ? broadcastSubscribers.map(s => s.email) : [];
            
            results.push({
              audienceId,
              audienceName: audienceInfo.name,
              success: true,
              broadcastId: data?.id,
              recipientCount: broadcastEmails.length,
              emailsSent: broadcastEmails
            });
          } else {
            // Option 2: No Resend ID - fetch subscribers from database and send individually
            console.log(`📧 No Resend ID for audience: ${audienceInfo.name} - fetching subscribers from database`);
            const { data: subscribers, error: dbError } = await supabase
              .from('new_subscribers')
              .select('email')
              .eq('audience_id', audienceId)
              .range(0, 9999);

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
            console.log(`📬 Found ${emails.length} subscribers - sending via BCC batches`);
            
            let sentCount = 0;
            let errorCount = 0;
            const sentEmails = [];
            const failedEmails = [];

            // Resend hard-limits total recipients (to + cc + bcc) to 50.
            // We must include one address in the "to" field, so BCC can only contain 49 recipients.
            const MAX_TOTAL_RECIPIENTS = 50;
            const REQUIRED_TO_RECIPIENT = 'no-reply@aiinbusinesssociety.org';
            const BCC_BATCH_SIZE = MAX_TOTAL_RECIPIENTS - 1; // 49

            const bccBatches = [];
            for (let i = 0; i < emails.length; i += BCC_BATCH_SIZE) {
              bccBatches.push(emails.slice(i, i + BCC_BATCH_SIZE));
            }

            console.log(`📦 Sending ${bccBatches.length} BCC emails (${BCC_BATCH_SIZE} recipients max each)`);

            const emailTemplate = `
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
            `;

            // Send each BCC batch
            for (let i = 0; i < bccBatches.length; i++) {
              const batch = bccBatches[i];
              try {
                console.log(`📨 Sending BCC batch ${i + 1}/${bccBatches.length} (${batch.length} recipients)`);
                
                const { data, error } = await resend.emails.send({
                  from: `${fromName} <no-reply@aiinbusinesssociety.org>`,
                  to: [REQUIRED_TO_RECIPIENT],
                  bcc: batch,
                  subject: subject,
                  html: emailTemplate,
                  ...(attachments && attachments.length > 0 ? { attachments } : {})
                });
                
                if (error) {
                  throw new Error(error.message || JSON.stringify(error));
                }
                
                sentCount += batch.length;
                sentEmails.push(...batch);
                console.log(`✅ BCC batch ${i + 1}/${bccBatches.length} sent successfully`);
                
              } catch (err) {
                console.error(`❌ BCC batch ${i + 1} failed:`, err.message);
                console.error(`❌ Full error object:`, JSON.stringify(err, null, 2));
                console.error(`❌ Error stack:`, err.stack);
                errorCount += batch.length;
                batch.forEach(email => {
                  failedEmails.push({ email, error: err.message });
                });
              }
              
              // 500ms delay between batches (respects 2 req/sec limit)
              if (i < bccBatches.length - 1) {
                await new Promise(resolve => setTimeout(resolve, 500));
              }
            }

            console.log(`📊 Final: ${sentCount} sent, ${errorCount} failed out of ${emails.length}`);

            results.push({
              audienceId,
              audienceName: audienceInfo.name,
              success: sentCount === emails.length,
              recipientCount: emails.length,
              sentCount,
              errorCount,
              method: 'bcc-batch',
              emailsSent: sentEmails,
              failedEmails: failedEmails.length > 0 ? failedEmails : undefined
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

    // Send confirmation email to admin
    console.log('📊 Sending campaign confirmation email to lukegsine@gmail.com');
    try {
      await sendCampaignConfirmation(
        'lukegsine@gmail.com',
        { subject, fromName, testMode },
        results
      );
      console.log('✅ Campaign confirmation email sent successfully');
    } catch (confirmError) {
      console.error('❌ Failed to send confirmation email:', confirmError);
      // Don't fail the whole request if confirmation fails
    }

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
    console.error('❌ [send-email] Email sending error:', error);
    console.error('❌ [send-email] Error stack:', error.stack);
    return NextResponse.json({ 
      error: "Failed to send emails", 
      details: error.message,
      errorType: error.constructor.name
    }, { status: 500 });
  }
}

// Helper function to send campaign confirmation email
async function sendCampaignConfirmation(adminEmail, campaignDetails, results) {
  try {
    const resend = getResendClient();
    if (!resend) {
      console.log('Resend client not available - skipping campaign confirmation');
      return;
    }

    const { subject, fromName, testMode } = campaignDetails;
    
    // Calculate totals
    const totalAudiences = results.length;
    
    let totalRecipientsTargeted = 0;
    let totalSent = 0;
    let totalErrors = 0;
    const uniqueRecipientsSet = new Set();
    
    results.forEach(r => {
      if (r.recipientCount) totalRecipientsTargeted += r.recipientCount;
      if (r.sentCount) totalSent += r.sentCount;
      if (r.errorCount) totalErrors += r.errorCount;
      if (Array.isArray(r.emailsSent)) {
        r.emailsSent.forEach(email => uniqueRecipientsSet.add(email));
      }
    });
    
    const uniqueRecipientsCount = uniqueRecipientsSet.size || totalSent;
    const successfulAudiences = results.filter(r => r.sentCount === r.recipientCount).length;
    const partiallyFailedAudiences = results.filter(r => r.errorCount > 0 && r.sentCount > 0).length;
    const failedAudiences = results.filter(r => r.sentCount === 0).length;

    // Build audience breakdown HTML
    let audienceBreakdownHtml = '';
    
    results.forEach(result => {
      const isSuccess = result.success;
      const hasFailures = result.errorCount > 0;
      
      audienceBreakdownHtml += `
        <div style="margin-bottom: 25px; padding: 15px; background-color: ${hasFailures ? '#fff5f5' : '#f0f9ff'}; border-left: 4px solid ${hasFailures ? '#ef4444' : '#3b82f6'}; border-radius: 4px;">
          <h3 style="margin: 0 0 10px 0; color: ${hasFailures ? '#991b1b' : '#1e40af'}; font-size: 16px;">
            ${result.audienceName || 'Unknown Audience'}
            ${result.testMode ? ' <span style="background-color: #fef3c7; color: #92400e; padding: 2px 8px; border-radius: 3px; font-size: 12px;">TEST</span>' : ''}
          </h3>
          
          ${!hasFailures ? `
            <p style="margin: 5px 0; color: #059669; font-weight: bold;">
              ✓ Successfully sent to all ${result.sentCount || result.recipientCount || 0} recipient(s)
            </p>
            
            ${result.emailsSent && result.emailsSent.length > 0 ? `
              <details style="margin-top: 10px;">
                <summary style="cursor: pointer; color: #1e40af; font-weight: 500;">
                  View all recipients (${result.emailsSent.length})
                </summary>
                <div style="margin-top: 10px; padding: 10px; background-color: white; border-radius: 4px; max-height: 200px; overflow-y: auto;">
                  ${result.emailsSent.map(email => `<div style="padding: 3px 0; font-size: 13px; color: #374151;">${email}</div>`).join('')}
                </div>
              </details>
            ` : ''}
          ` : `
            <p style="margin: 5px 0; color: #dc2626; font-weight: bold;">
              ⚠ Partial delivery: ${result.sentCount || 0} sent, ${result.errorCount || 0} failed
            </p>
            <p style="margin: 5px 0; color: #991b1b; font-size: 14px;">
              Some recipients failed to deliver. Check Vercel logs for details.
            </p>
          `}
        </div>
      `;
    });

    const modeLabel = testMode ? 'TEST MODE' : 'PRODUCTION';
    const modeBadgeColor = testMode ? '#f59e0b' : '#10b981';

    console.log(`📨 Preparing confirmation email to ${adminEmail} for campaign: "${subject}"`);
    
    const { data: emailData, error: emailError } = await resend.emails.send({
      from: 'ABS Campaign Reports <no-reply@aiinbusinesssociety.org>',
      to: adminEmail,
      subject: `${testMode ? '🧪 [TEST]' : '✅'} Campaign Sent: ${subject}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; background-color: #f9fafb;">
          <!-- Header -->
          <div style="background-color: #002E5D; color: white; padding: 30px 20px; text-align: center;">
            <h1 style="margin: 0 0 10px 0; font-size: 28px;">📧 Campaign Confirmation</h1>
            <div style="background-color: ${modeBadgeColor}; display: inline-block; padding: 6px 12px; border-radius: 4px; font-weight: bold; font-size: 14px;">
              ${modeLabel}
            </div>
          </div>
          
          <!-- Campaign Details -->
          <div style="background-color: white; padding: 25px; border-bottom: 3px solid #e5e7eb;">
            <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 20px;">Campaign Details</h2>
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Subject:</td>
                <td style="padding: 8px 0; color: #111827; font-weight: 600;">${subject}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">From Name:</td>
                <td style="padding: 8px 0; color: #111827;">${fromName}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; color: #6b7280; font-weight: 500;">Sent At:</td>
                <td style="padding: 8px 0; color: #111827;">${new Date().toLocaleString()}</td>
              </tr>
            </table>
          </div>
          
          <!-- Summary Statistics -->
          <div style="background-color: white; padding: 25px; border-bottom: 3px solid #e5e7eb;">
            <h2 style="margin: 0 0 15px 0; color: #111827; font-size: 20px;">Summary</h2>
            <div style="display: grid; grid-template-columns: repeat(2, 1fr); gap: 15px;">
              <div style="padding: 15px; background-color: #f0f9ff; border-radius: 6px; text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #1e40af;">${totalAudiences}</div>
                <div style="color: #6b7280; font-size: 14px; margin-top: 5px;">Total Audiences</div>
              </div>
              <div style="padding: 15px; background-color: #f0fdf4; border-radius: 6px; text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #059669;">${uniqueRecipientsCount}</div>
                <div style="color: #6b7280; font-size: 14px; margin-top: 5px;">Unique Recipients</div>
              </div>
              <div style="padding: 15px; background-color: #ecfeff; border-radius: 6px; text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: #0891b2;">${totalRecipientsTargeted}</div>
                <div style="color: #6b7280; font-size: 14px; margin-top: 5px;">Total Recipients Targeted</div>
              </div>
              <div style="padding: 15px; background-color: ${totalErrors > 0 ? '#fef2f2' : '#f0fdf4'}; border-radius: 6px; text-align: center;">
                <div style="font-size: 32px; font-weight: bold; color: ${totalErrors > 0 ? '#dc2626' : '#059669'};">${totalSent}</div>
                <div style="color: #6b7280; font-size: 14px; margin-top: 5px;">Emails Delivered</div>
              </div>
            </div>
            ${totalErrors > 0 ? `
              <p style="margin-top: 15px; color: #b45309; font-size: 14px;">
                ⚠ ${totalErrors} recipients failed to deliver. Check the audience breakdown below for details.
              </p>
            ` : `
              <p style="margin-top: 15px; color: #059669; font-size: 14px;">
                ✅ All audiences delivered successfully.
              </p>
            `}
          </div>
          
          <!-- Audience Breakdown -->
          <div style="background-color: white; padding: 25px;">
            <h2 style="margin: 0 0 20px 0; color: #111827; font-size: 20px;">Audience Breakdown</h2>
            ${audienceBreakdownHtml}
          </div>
          
          <!-- Footer -->
          <div style="background-color: #002E5D; color: white; padding: 20px; text-align: center; font-size: 12px;">
            <p style="margin: 0;">AI in Business Society - Email Campaign System</p>
            <p style="margin: 5px 0 0 0; opacity: 0.8;">This is an automated confirmation email</p>
          </div>
        </div>
      `
    });

    if (emailError) {
      console.error('❌ Resend API error sending confirmation:', emailError);
      throw new Error(`Failed to send confirmation email: ${emailError.message || JSON.stringify(emailError)}`);
    }

    console.log(`✅ Campaign confirmation sent successfully to ${adminEmail} (Email ID: ${emailData?.id})`);
  } catch (error) {
    console.error('❌ Error sending campaign confirmation:', error);
    console.error('Error details:', error.message, error.stack);
    // Don't throw - we don't want to fail the campaign if confirmation fails
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

    // NOTE: Supabase has a default limit of 1000 rows. We use range(0, 9999) to fetch up to 10,000 subscribers.
    // If you expect more than 10,000 subscribers, increase the range or implement pagination.
    const { data: subs } = await supabase
      .from('new_subscribers')
      .select('audience_id')
      .range(0, 9999);

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