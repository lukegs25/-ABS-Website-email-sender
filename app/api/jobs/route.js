import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { jobPostingSchema } from "@/lib/validators";

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  const { data, error } = await supabase
    .from("jobs")
    .select("id, title, company, url, posted_at")
    .order("posted_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[GET /api/jobs]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data || []);
}

export async function POST(request) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = jobPostingSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Validation failed", issues: parsed.error.flatten().fieldErrors },
      { status: 422 }
    );
  }

  const { title, company, url, description, location, job_type, contact_email, logo_url } = parsed.data;

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      title,
      company,
      url,
      description,
      location: location || null,
      job_type,
      contact_email,
      logo_url: logo_url || null,
      source: "direct",
      status: "pending",
    })
    .select("id")
    .single();

  if (error) {
    console.error("[POST /api/jobs]", error);
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A job with this title and company already exists." },
        { status: 409 }
      );
    }
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ id: data.id }, { status: 201 });
}
