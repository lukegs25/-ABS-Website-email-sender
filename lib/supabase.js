import { createClient } from "@supabase/supabase-js";

export function getSupabaseServerClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Treat placeholder values as not configured
  const looksPlaceholder = (v) => !v || v === '...' || v === '<your-url>' || v === '<your-key>';
  if (looksPlaceholder(url) || looksPlaceholder(serviceKey)) {
    return null;
  }
  
  try {
    return createClient(url, serviceKey, {
      auth: { persistSession: false },
    });
  } catch (error) {
    console.error('[getSupabaseServerClient] Error creating client:', error.message);
    return null;
  }
}


