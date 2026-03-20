import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json([]);
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, headline, linkedin_url");

  if (profilesError) {
    console.error("[GET /api/star-users] profiles error:", profilesError);
    return NextResponse.json([]);
  }

  const { data: stars, error: starsError } = await supabase
    .from("member_stars")
    .select("id, member_id, skill, event_name, note, star_count, created_at")
    .order("created_at", { ascending: false });

  if (starsError) {
    console.error("[GET /api/star-users] stars error:", starsError);
  }

  const starsByMember = new Map();
  for (const s of stars || []) {
    if (!starsByMember.has(s.member_id)) {
      starsByMember.set(s.member_id, []);
    }
    starsByMember.get(s.member_id).push(s);
  }

  const list = (profiles || [])
    .filter((p) => p.full_name)
    .map((profile) => {
      const memberStars = starsByMember.get(profile.id) || [];
      const skills = [...new Set(memberStars.map((s) => s.skill).filter(Boolean))];
      const events = [...new Set(memberStars.map((s) => s.event_name).filter(Boolean))];
      // Sum star_count (defaults to 1 for legacy records without star_count)
      const totalStars = memberStars.reduce((sum, s) => sum + (s.star_count ?? 1), 0);

      return {
        id: profile.id,
        display_name: profile.full_name || profile.email?.split("@")[0] || "Member",
        avatar_url: profile.avatar_url,
        email: profile.email,
        headline: profile.headline,
        linkedin_url: profile.linkedin_url,
        star_count: totalStars,
        skill: skills.join(", ") || null,
        recent_events: events.slice(0, 3),
      };
    })
    .sort((a, b) => b.star_count - a.star_count || a.display_name.localeCompare(b.display_name));

  list.forEach((item, i) => {
    item.rank = i + 1;
  });

  return NextResponse.json(list);
}
