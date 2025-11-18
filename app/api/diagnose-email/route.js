import { NextResponse } from "next/server";
import { getResendClient } from "@/lib/resend";
import { getSupabaseServerClient } from "@/lib/supabase";

/**
 * Comprehensive Email System Diagnostic Endpoint
 * Tests all components of the email sending system
 */
export async function GET(request) {
  const diagnostics = {
    timestamp: new Date().toISOString(),
    results: [],
    overall: 'CHECKING...'
  };

  // Test 1: Environment Variables
  try {
    const hasResendKey = !!process.env.RESEND_API_KEY;
    const keyPreview = hasResendKey 
      ? `${process.env.RESEND_API_KEY.substring(0, 8)}...` 
      : 'NOT SET';
    
    diagnostics.results.push({
      test: 'Environment Variables',
      status: hasResendKey ? 'PASS' : 'FAIL',
      details: {
        RESEND_API_KEY: hasResendKey ? `Set (${keyPreview})` : 'NOT SET',
        keyLength: hasResendKey ? process.env.RESEND_API_KEY.length : 0
      }
    });
  } catch (error) {
    diagnostics.results.push({
      test: 'Environment Variables',
      status: 'ERROR',
      error: error.message
    });
  }

  // Test 2: Resend Client Initialization
  try {
    const resend = getResendClient();
    diagnostics.results.push({
      test: 'Resend Client',
      status: resend ? 'PASS' : 'FAIL',
      details: {
        clientInitialized: !!resend,
        clientType: resend ? typeof resend : 'null'
      }
    });
  } catch (error) {
    diagnostics.results.push({
      test: 'Resend Client',
      status: 'ERROR',
      error: error.message
    });
  }

  // Test 3: Database Connection
  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data, error } = await supabase
        .from('new_subscribers')
        .select('email')
        .limit(1);
      
      diagnostics.results.push({
        test: 'Database Connection',
        status: error ? 'FAIL' : 'PASS',
        details: {
          connected: !error,
          error: error?.message || null,
          canReadSubscribers: !!data
        }
      });
    } else {
      diagnostics.results.push({
        test: 'Database Connection',
        status: 'FAIL',
        details: { message: 'Supabase client not initialized' }
      });
    }
  } catch (error) {
    diagnostics.results.push({
      test: 'Database Connection',
      status: 'ERROR',
      error: error.message
    });
  }

  // Test 4: Send Single Test Email
  try {
    const resend = getResendClient();
    if (resend) {
      const testEmail = 'lukegsine@gmail.com'; // Send to admin
      
      const { data, error } = await resend.emails.send({
        from: 'ABS Diagnostics <no-reply@aiinbusinesssociety.org>',
        to: [testEmail],
        subject: '🔍 Email System Diagnostic Test',
        html: `
          <div style="font-family: Arial, sans-serif; padding: 20px;">
            <h2>✅ Email System Working!</h2>
            <p>This diagnostic email was sent successfully at ${new Date().toLocaleString()}.</p>
            <p>If you received this, your Resend integration is working correctly.</p>
            <p><strong>Next step:</strong> Check the batch sending logs for any rate limiting or API errors.</p>
          </div>
        `
      });

      diagnostics.results.push({
        test: 'Single Email Send',
        status: error ? 'FAIL' : 'PASS',
        details: {
          sentTo: testEmail,
          emailId: data?.id || null,
          error: error ? JSON.stringify(error) : null
        }
      });
    } else {
      diagnostics.results.push({
        test: 'Single Email Send',
        status: 'SKIP',
        details: { reason: 'No Resend client available' }
      });
    }
  } catch (error) {
    diagnostics.results.push({
      test: 'Single Email Send',
      status: 'ERROR',
      error: error.message,
      stack: error.stack
    });
  }

  // Test 5: Batch Send (2 test emails)
  try {
    const resend = getResendClient();
    if (resend) {
      const batchPayload = [
        {
          from: 'ABS Diagnostics <no-reply@aiinbusinesssociety.org>',
          to: ['lukegsine@gmail.com'],
          subject: '🔍 Batch Test Email #1',
          html: '<p>This is batch test email #1</p>'
        },
        {
          from: 'ABS Diagnostics <no-reply@aiinbusinesssociety.org>',
          to: ['lukegsine@gmail.com'],
          subject: '🔍 Batch Test Email #2',
          html: '<p>This is batch test email #2</p>'
        }
      ];

      const { data, error } = await resend.batch.send(batchPayload);

      diagnostics.results.push({
        test: 'Batch Send (2 emails)',
        status: error ? 'FAIL' : 'PASS',
        details: {
          response: data ? JSON.stringify(data) : null,
          responseType: Array.isArray(data) ? 'array' : typeof data,
          responseLength: Array.isArray(data) ? data.length : 'N/A',
          error: error ? JSON.stringify(error) : null
        }
      });
    } else {
      diagnostics.results.push({
        test: 'Batch Send',
        status: 'SKIP',
        details: { reason: 'No Resend client available' }
      });
    }
  } catch (error) {
    diagnostics.results.push({
      test: 'Batch Send',
      status: 'ERROR',
      error: error.message,
      stack: error.stack
    });
  }

  // Test 6: Check Subscriber Count
  try {
    const supabase = getSupabaseServerClient();
    if (supabase) {
      const { data: subs, error } = await supabase
        .from('new_subscribers')
        .select('email', { count: 'exact' })
        .range(0, 9999);
      
      diagnostics.results.push({
        test: 'Subscriber Count',
        status: error ? 'FAIL' : 'PASS',
        details: {
          total: subs?.length || 0,
          error: error?.message || null
        }
      });
    }
  } catch (error) {
    diagnostics.results.push({
      test: 'Subscriber Count',
      status: 'ERROR',
      error: error.message
    });
  }

  // Determine overall status
  const hasFailures = diagnostics.results.some(r => r.status === 'FAIL' || r.status === 'ERROR');
  const criticalFailure = diagnostics.results.some(r => 
    (r.test === 'Resend Client' || r.test === 'Single Email Send') && 
    (r.status === 'FAIL' || r.status === 'ERROR')
  );

  diagnostics.overall = criticalFailure ? '❌ CRITICAL FAILURE' : hasFailures ? '⚠️ PARTIAL FAILURE' : '✅ ALL TESTS PASSED';

  // Summary
  diagnostics.summary = {
    totalTests: diagnostics.results.length,
    passed: diagnostics.results.filter(r => r.status === 'PASS').length,
    failed: diagnostics.results.filter(r => r.status === 'FAIL').length,
    errors: diagnostics.results.filter(r => r.status === 'ERROR').length,
    skipped: diagnostics.results.filter(r => r.status === 'SKIP').length
  };

  return NextResponse.json(diagnostics, { 
    status: 200,
    headers: {
      'Content-Type': 'application/json'
    }
  });
}

