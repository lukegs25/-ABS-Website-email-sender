import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getAdminSession } from "@/lib/auth-helpers";

// PUT /api/admin/content — upsert a single content field
export async function PUT(req) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const body = await req.json();
    const { page, section, content_key, content_value, content_type } = body;

    if (!page || !section || !content_key) {
      return NextResponse.json(
        { error: "page, section, and content_key are required" },
        { status: 400 }
      );
    }

    const validPages = ["home", "student", "teacher", "global"];
    if (!validPages.includes(page)) {
      return NextResponse.json({ error: "Invalid page" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("site_content")
      .upsert(
        {
          page,
          section,
          content_key,
          content_value: content_value ?? null,
          content_type: content_type || "text",
          updated_at: new Date().toISOString(),
        },
        { onConflict: "page,section,content_key" }
      )
      .select("*")
      .single();

    if (error) {
      console.error("[PUT /api/admin/content]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Content updated", data });
  } catch (e) {
    console.error("[PUT /api/admin/content]", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// GET /api/admin/content — list all content (admin view)
export async function GET(req) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { searchParams } = new URL(req.url);
  const page = searchParams.get("page");

  let query = supabase
    .from("site_content")
    .select("*")
    .order("page")
    .order("section")
    .order("content_key");

  if (page) {
    query = query.eq("page", page);
  }

  const { data, error } = await query;

  if (error) {
    console.error("[GET /api/admin/content]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data || [] });
}
