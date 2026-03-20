import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

// GET /api/content/[page] — fetch all site_content for a page (public, cached)
export async function GET(req, { params }) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ success: true, data: {} });
  }

  const { page } = await params;
  const validPages = ["home", "student", "teacher", "global"];

  if (!validPages.includes(page)) {
    return NextResponse.json({ error: "Invalid page" }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("site_content")
    .select("section, content_key, content_value, content_type")
    .eq("page", page);

  if (error) {
    console.error("[GET /api/content/[page]]", error);
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }

  // Transform flat rows into a nested { section: { key: value } } structure
  const structured = {};
  for (const row of data || []) {
    if (!structured[row.section]) {
      structured[row.section] = {};
    }
    structured[row.section][row.content_key] = row.content_value;
  }

  return NextResponse.json(
    { success: true, data: structured },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate=300",
      },
    }
  );
}
