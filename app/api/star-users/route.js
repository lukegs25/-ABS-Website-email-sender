import { NextResponse } from "next/server";
import { getSupabaseServerClient } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return NextResponse.json([]);
  }

  const { data: stars, error } = await supabase
    .from("member_stars")
    .select(`
      id,
      member_id,
      skill,
      note,
      created_at,
      profiles (
        id,
        full_name,
        email,
        avatar_url,
        headline,
        linkedin_url
      )
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("[GET /api/star-users]", error);
    return NextResponse.json([]);
  }

  // Dedupe by member_id, keeping their latest star; merge skills/notes
  const byMember = new Map();
  for (const s of stars || []) {
    const pid = s.member_id;
    const profile = s.profiles;
    if (!profile) continue;

    const existing = byMember.get(pid);
    const skills = existing
      ? [...new Set([...(existing.skills || []), s.skill].filter(Boolean))]
      : s.skill ? [s.skill] : [];
    const notes = existing?.notes
      ? [...existing.notes, s.note].filter(Boolean)
      : s.note ? [s.note] : [];

    byMember.set(pid, {
      id: pid,
      display_name: profile.full_name || profile.email?.split("@")[0] || "Member",
      avatar_url: profile.avatar_url,
      email: profile.email,
      headline: profile.headline,
      linkedin_url: profile.linkedin_url,
      skills,
      notes,
      latest_star_at: s.created_at,
    });
  }

  const list = Array.from(byMember.values())
    .sort((a, b) => new Date(b.latest_star_at) - new Date(a.latest_star_at))
    .map(({ skills, notes, latest_star_at, ...rest }) => ({
      ...rest,
      skill: skills?.join(", ") || null,
      note: notes?.[0] || null,
    }));

  return NextResponse.json(list);
}
