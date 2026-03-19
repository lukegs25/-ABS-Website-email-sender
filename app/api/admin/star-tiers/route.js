import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import { getAdminSession } from "@/lib/auth-helpers";

// GET /api/admin/star-tiers — list all tiers
export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  const { data, error } = await supabase
    .from("star_tiers")
    .select("*")
    .order("min_stars", { ascending: true });

  if (error) {
    console.error("[GET /api/admin/star-tiers]", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, data: data || [] });
}

// POST /api/admin/star-tiers — create a tier
export async function POST(req) {
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
    const { tier_name, min_stars, badge_emoji, sort_order } = body;

    if (!tier_name?.trim()) {
      return NextResponse.json({ error: "tier_name is required" }, { status: 400 });
    }
    const minStars = parseInt(min_stars, 10);
    if (isNaN(minStars) || minStars < 0) {
      return NextResponse.json({ error: "min_stars must be a non-negative integer" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("star_tiers")
      .insert({
        tier_name: tier_name.trim(),
        min_stars: minStars,
        badge_emoji: badge_emoji?.trim() || "⭐",
        sort_order: parseInt(sort_order, 10) || 0,
      })
      .select("*")
      .single();

    if (error) {
      console.error("[POST /api/admin/star-tiers]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Tier created", data }, { status: 201 });
  } catch (e) {
    console.error("[POST /api/admin/star-tiers]", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// PUT /api/admin/star-tiers — update a tier
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
    const { id, tier_name, min_stars, badge_emoji, sort_order } = body;

    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }
    if (!tier_name?.trim()) {
      return NextResponse.json({ error: "tier_name is required" }, { status: 400 });
    }
    const minStars = parseInt(min_stars, 10);
    if (isNaN(minStars) || minStars < 0) {
      return NextResponse.json({ error: "min_stars must be a non-negative integer" }, { status: 400 });
    }

    const { data, error } = await supabase
      .from("star_tiers")
      .update({
        tier_name: tier_name.trim(),
        min_stars: minStars,
        badge_emoji: badge_emoji?.trim() || "⭐",
        sort_order: parseInt(sort_order, 10) || 0,
      })
      .eq("id", id)
      .select("*")
      .single();

    if (error) {
      console.error("[PUT /api/admin/star-tiers]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Tier updated", data });
  } catch (e) {
    console.error("[PUT /api/admin/star-tiers]", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}

// DELETE /api/admin/star-tiers — delete a tier
export async function DELETE(req) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ error: "Database not configured" }, { status: 503 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "id query parameter is required" }, { status: 400 });
    }

    const { error } = await supabase.from("star_tiers").delete().eq("id", id);

    if (error) {
      console.error("[DELETE /api/admin/star-tiers]", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, message: "Tier deleted" });
  } catch (e) {
    console.error("[DELETE /api/admin/star-tiers]", e);
    return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
  }
}
