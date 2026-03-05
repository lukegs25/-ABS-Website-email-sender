import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { postJobSchema } from "@/lib/validators";

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
    return NextResponse.json(
      { error: "Database not configured" },
      { status: 503 }
    );
  }

  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const parsed = postJobSchema.safeParse(body);
  if (!parsed.success) {
    const msg = parsed.error.errors?.[0]?.message || "Validation failed";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const { title, company, url, description } = parsed.data;

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      title,
      company,
      url,
      description: description || null,
      source: "direct",
    })
    .select("id, title, company, url, posted_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "A job with this title and company already exists" },
        { status: 409 }
      );
    }
    console.error("[POST /api/jobs]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(data);
}
