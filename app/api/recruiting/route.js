import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET() {
  // Authenticate member
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const serviceClient = getSupabaseServerClient();
  if (!serviceClient) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  // Check attendance count
  const { count } = await serviceClient
    .from("attendance")
    .select("id", { count: "exact", head: true })
    .eq("member_id", user.id);

  if ((count || 0) < 5) {
    return NextResponse.json(
      { error: "You need to attend 5 meetings to access premier recruiting", eventsAttended: count || 0 },
      { status: 403 }
    );
  }

  // Fetch premier jobs
  const { data: jobs, error } = await serviceClient
    .from("jobs")
    .select("id, title, company, location, url, description, created_at")
    .eq("is_premier", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[GET /api/recruiting]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ jobs: jobs || [] });
}
