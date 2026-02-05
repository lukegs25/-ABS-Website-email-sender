import { NextResponse } from "next/server";
import { getResendClient } from "@/lib/resend";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getEmailAddressWithFallback } from "@/lib/email-config";

export async function GET() {
  const diagnosticResults = {
    timestamp: new Date().toISOString(),
    tests: [],
    overall: 'UNKNOWN'
  };

  // Test 1: Check if Resend API key is configured
  console.log('🔍 [DIAGNOSTIC] Test 1: Checking Resend API key configuration...');
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    diagnosticResults.tests.push({
      name: 'Resend API Key',
      status: 'FAIL',
      message: 'RESEND_API_KEY environment variable is not set',
      fix: 'Set RESEND_API_KEY in your environment variables'
    });
    diagnosticResults.overall = 'FAIL';
  } else {
    const keyPreview = `${apiKey.substring(0, 7)}...${apiKey.substring(apiKey.length - 4)}`;
    diagnosticResults.tests.push({
      name: 'Resend API Key',
      status: 'PASS',
      message: `API key is configured: ${keyPreview}`,
      keyLength: apiKey.length
    });
  }

  // Test 2: Check if Resend client can be initialized
  console.log('🔍 [DIAGNOSTIC] Test 2: Initializing Resend client...');
  const resend = getResendClient();
  if (!resend) {
    diagnosticResults.tests.push({
      name: 'Resend Client',
      status: 'FAIL',
      message: 'Failed to initialize Resend client',
      fix: 'Verify RESEND_API_KEY is valid'
    });
    diagnosticResults.overall = 'FAIL';
  } else {
    diagnosticResults.tests.push({
      name: 'Resend Client',
      status: 'PASS',
      message: 'Resend client initialized successfully'
    });
  }

  // Test 3: Check database connection
  console.log('🔍 [DIAGNOSTIC] Test 3: Checking database connection...');
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    diagnosticResults.tests.push({
      name: 'Database Connection',
      status: 'FAIL',
      message: 'Supabase client not available',
      fix: 'Check Supabase configuration'
    });
  } else {
    try {
      const { data, error } = await supabase
        .from('new_subscribers')
        .select('count', { count: 'exact', head: true });
      
      if (error) throw error;
      
      diagnosticResults.tests.push({
        name: 'Database Connection',
        status: 'PASS',
        message: 'Database connected successfully'
      });
    } catch (dbError) {
      diagnosticResults.tests.push({
        name: 'Database Connection',
        status: 'FAIL',
        message: `Database error: ${dbError.message}`,
        fix: 'Check Supabase credentials'
      });
    }
  }

  // Test 4: Try sending a single test email
  if (resend) {
    console.log('🔍 [DIAGNOSTIC] Test 4: Attempting to send test email...');
    try {
      const testEmail = 'lukegsine@gmail.com'; // Send to admin for testing
      
      console.log('📧 Sending test email to:', testEmail);
      const { data, error } = await resend.emails.send({
        from: getEmailAddressWithFallback('diagnostics'),
        to: [testEmail],
        subject: '🔍 Resend Diagnostic Test',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #002e5d;">Resend Diagnostic Test</h2>
            <p>This is a test email from your ABS email system.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p style="color: green; font-weight: bold;">✅ If you received this email, your Resend configuration is working correctly!</p>
            <hr style="margin: 20px 0;">
            <p style="font-size: 12px; color: #666;">This is an automated diagnostic email.</p>
          </div>
        `
      });

      console.log('📧 Test email response:', { hasData: !!data, hasError: !!error });
      console.log('📧 Response data:', data);
      console.log('📧 Response error:', error);

      if (error) {
        diagnosticResults.tests.push({
          name: 'Test Email Send',
          status: 'FAIL',
          message: `Failed to send test email: ${error.message || JSON.stringify(error)}`,
          error: error,
          fix: 'Check error details below'
        });
        diagnosticResults.overall = 'FAIL';
      } else {
        diagnosticResults.tests.push({
          name: 'Test Email Send',
          status: 'PASS',
          message: `Test email sent successfully to ${testEmail}`,
          emailId: data?.id,
          data: data
        });
      }
    } catch (emailError) {
      console.error('❌ Exception sending test email:', emailError);
      diagnosticResults.tests.push({
        name: 'Test Email Send',
        status: 'FAIL',
        message: `Exception: ${emailError.message}`,
        error: emailError.toString(),
        stack: emailError.stack,
        fix: 'Check error stack for details'
      });
      diagnosticResults.overall = 'FAIL';
    }
  }

  // Test 5: Try sending a batch of 2 emails
  if (resend) {
    console.log('🔍 [DIAGNOSTIC] Test 5: Attempting batch send (2 emails)...');
    try {
      const testEmails = ['lukegsine@gmail.com', 'lukegsine@gmail.com'];
      
      const diagnosticsFrom = getEmailAddressWithFallback('diagnostics');
      const batchPayload = testEmails.map(email => ({
        from: diagnosticsFrom,
        to: [email],
        subject: '🔍 Resend Batch Diagnostic Test',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h2 style="color: #002e5d;">Resend Batch Send Test</h2>
            <p>This is a batch test email from your ABS email system.</p>
            <p><strong>Timestamp:</strong> ${new Date().toISOString()}</p>
            <p style="color: green; font-weight: bold;">✅ If you received this, batch sending is working!</p>
          </div>
        `
      }));

      console.log('📧 Sending batch with payload length:', batchPayload.length);
      const { data, error } = await resend.batch.send(batchPayload);

      console.log('📧 Batch response:', { 
        hasData: !!data, 
        dataType: Array.isArray(data) ? 'array' : typeof data,
        dataLength: Array.isArray(data) ? data.length : 'N/A',
        hasError: !!error 
      });
      console.log('📧 Batch data:', JSON.stringify(data, null, 2));
      console.log('📧 Batch error:', JSON.stringify(error, null, 2));

      if (error) {
        diagnosticResults.tests.push({
          name: 'Batch Email Send',
          status: 'FAIL',
          message: `Batch send failed: ${error.message || JSON.stringify(error)}`,
          error: error,
          fix: 'Batch sending is not working - may need to upgrade Resend plan or check API permissions'
        });
      } else if (data) {
        let successCount = 0;
        let failCount = 0;
        
        if (Array.isArray(data)) {
          data.forEach((result, idx) => {
            if (result.error) {
              failCount++;
              console.error(`❌ Batch item ${idx} failed:`, result.error);
            } else {
              successCount++;
            }
          });
        } else {
          // Non-array response
          if (data.id || data.success !== false) {
            successCount = batchPayload.length;
          }
        }

        diagnosticResults.tests.push({
          name: 'Batch Email Send',
          status: successCount > 0 ? 'PASS' : 'FAIL',
          message: `Batch test: ${successCount} succeeded, ${failCount} failed`,
          successCount,
          failCount,
          data: data
        });
      } else {
        diagnosticResults.tests.push({
          name: 'Batch Email Send',
          status: 'FAIL',
          message: 'No data or error returned from batch API',
          fix: 'Unexpected API response - may be an API version issue'
        });
      }
    } catch (batchError) {
      console.error('❌ Exception in batch send:', batchError);
      diagnosticResults.tests.push({
        name: 'Batch Email Send',
        status: 'FAIL',
        message: `Exception: ${batchError.message}`,
        error: batchError.toString(),
        stack: batchError.stack,
        fix: 'Check error stack for details'
      });
    }
  }

  // Test 6: Check domain verification (if possible)
  console.log('🔍 [DIAGNOSTIC] Test 6: Domain check...');
  diagnosticResults.tests.push({
    name: 'Domain Verification',
    status: 'INFO',
    message: 'Using domain: aiinbusinesssociety.org',
    note: 'Verify this domain is added and verified in your Resend dashboard at https://resend.com/domains'
  });

  // Determine overall status
  const failedTests = diagnosticResults.tests.filter(t => t.status === 'FAIL');
  if (failedTests.length === 0 && diagnosticResults.overall !== 'FAIL') {
    diagnosticResults.overall = 'PASS';
  } else {
    diagnosticResults.overall = 'FAIL';
  }

  diagnosticResults.summary = {
    total: diagnosticResults.tests.length,
    passed: diagnosticResults.tests.filter(t => t.status === 'PASS').length,
    failed: failedTests.length,
    info: diagnosticResults.tests.filter(t => t.status === 'INFO').length
  };

  console.log('🎯 [DIAGNOSTIC] Overall result:', diagnosticResults.overall);
  console.log('📊 [DIAGNOSTIC] Summary:', diagnosticResults.summary);

  return NextResponse.json(diagnosticResults, {
    status: diagnosticResults.overall === 'PASS' ? 200 : 500
  });
}

