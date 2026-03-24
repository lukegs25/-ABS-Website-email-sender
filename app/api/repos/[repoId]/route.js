import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function PUT(request, { params }) {
  const { repoId } = await params;
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
  const { repo_name, repo_url, description, language, stars, display_order } = body;

  const { data: repo, error } = await supabase
    .from("member_featured_repos")
    .update({ repo_name, repo_url, description, language, stars, display_order })
    .eq("id", repoId)
    .eq("user_id", user.id)
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ repo });
}

export async function DELETE(request, { params }) {
  const { repoId } = await params;
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

  const { error } = await supabase
    .from("member_featured_repos")
    .delete()
    .eq("id", repoId)
    .eq("user_id", user.id);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
