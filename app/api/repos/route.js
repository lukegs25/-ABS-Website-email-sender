import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET() {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: repos, error } = await supabase
    .from("member_featured_repos")
    .select("*")
    .eq("user_id", user.id)
    .order("display_order", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ repos: repos || [] });
}

export async function POST(request) {
  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.json({ error: "Auth not configured" }, { status: 503 });
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { repo_name, repo_url, description, language, stars, display_order, is_manual_entry } = body;

  if (!repo_name || !repo_url) {
    return NextResponse.json({ error: "repo_name and repo_url are required" }, { status: 400 });
  }

  const { data: repo, error } = await supabase
    .from("member_featured_repos")
    .insert({
      user_id: user.id,
      repo_name,
      repo_url,
      description,
      language,
      stars: stars || 0,
      display_order: display_order || 0,
      is_manual_entry: is_manual_entry || false,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ repo }, { status: 201 });
}
