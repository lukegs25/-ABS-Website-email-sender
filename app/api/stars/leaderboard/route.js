import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

// GET /api/stars/leaderboard — public ranked leaderboard with tier badges
export async function GET(req) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json({ success: true, data: [] });
  }

  const { searchParams } = new URL(req.url);
  const limit = Math.min(parseInt(searchParams.get("limit") || "50", 10), 100);

  // Fetch all profiles with a name
  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, headline, linkedin_url");

  if (profilesError) {
    console.error("[GET /api/stars/leaderboard] profiles:", profilesError);
    return NextResponse.json({ success: false, error: profilesError.message }, { status: 500 });
  }

  // Fetch all star records
  const { data: stars, error: starsError } = await supabase
    .from("member_stars")
    .select("member_id, star_count, source, event_id");

  if (starsError) {
    console.error("[GET /api/stars/leaderboard] stars:", starsError);
  }

  // Fetch star tiers ordered by min_stars desc (to find highest qualifying tier)
  const { data: tiers } = await supabase
    .from("star_tiers")
    .select("tier_name, min_stars, badge_emoji")
    .order("min_stars", { ascending: false });

  // Aggregate stars per member
  const starsByMember = new Map();
  for (const s of stars || []) {
    if (!starsByMember.has(s.member_id)) {
      starsByMember.set(s.member_id, { total: 0, events: new Set() });
    }
    const agg = starsByMember.get(s.member_id);
    agg.total += s.star_count ?? 1;
    if (s.source === "event_attendance" && s.event_id) {
      agg.events.add(s.event_id);
    }
  }

  function getTier(totalStars) {
    if (!tiers || tiers.length === 0) return null;
    return tiers.find((t) => totalStars >= t.min_stars) || null;
  }

  const list = (profiles || [])
    .filter((p) => p.full_name)
    .map((profile) => {
      const agg = starsByMember.get(profile.id);
      const totalStars = agg?.total ?? 0;
      const eventsAttended = agg?.events.size ?? 0;
      const tier = getTier(totalStars);

      return {
        id: profile.id,
        display_name: profile.full_name || profile.email?.split("@")[0] || "Member",
        avatar_url: profile.avatar_url,
        headline: profile.headline,
        linkedin_url: profile.linkedin_url,
        total_stars: totalStars,
        events_attended: eventsAttended,
        tier_name: tier?.tier_name || null,
        tier_emoji: tier?.badge_emoji || null,
      };
    })
    .filter((m) => m.total_stars > 0)
    .sort(
      (a, b) =>
        b.total_stars - a.total_stars ||
        a.display_name.localeCompare(b.display_name)
    )
    .slice(0, limit);

  list.forEach((item, i) => {
    item.rank = i + 1;
  });

  return NextResponse.json({ success: true, data: list });
}
