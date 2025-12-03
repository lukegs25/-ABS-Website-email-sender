import { NextResponse } from "next/server";

export async function GET() {
  // Simple health check for environment variables (without exposing values)
  const checks = {
    resendApiKey: !!process.env.RESEND_API_KEY,
    supabaseUrl: !!process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    supabaseServiceKey: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    nodeEnv: process.env.NODE_ENV || 'development'
  };

  const allGood = checks.resendApiKey && checks.supabaseUrl && checks.supabaseAnonKey;

  return NextResponse.json({
    status: allGood ? 'healthy' : 'missing_config',
    checks,
    message: allGood 
      ? 'All required environment variables are set' 
      : 'Some environment variables are missing. Check .env.local file.'
  });
}









