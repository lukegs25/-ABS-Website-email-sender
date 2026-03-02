import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request) {
  const supabase = await createClient();
  if (supabase) {
    await supabase.auth.signOut();
  }
  const url = new URL(request.url);
  return NextResponse.redirect(new URL("/", url.origin), { status: 302 });
}
