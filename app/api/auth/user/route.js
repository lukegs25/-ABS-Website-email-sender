import { createClient } from "@/utils/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ user: null });
  }

  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ user: null });
  }

  // Fetch profile for display name, avatar, and admin status
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, avatar_url, email, admin_type")
    .eq("id", user.id)
    .single();

  return NextResponse.json({
    user: {
      id: user.id,
      email: profile?.email || user.email,
      full_name: profile?.full_name || null,
      avatar_url: profile?.avatar_url || null,
      admin_type: profile?.admin_type || null,
    },
  });
}
