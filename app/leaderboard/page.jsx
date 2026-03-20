import { getSupabaseServerClient } from "@/lib/supabase";
import Link from "next/link";
import { Star } from "lucide-react";

export const metadata = {
  title: "Leaderboard | AI in Business Society",
  description: "Top members of the AI in Business Society ranked by stars earned.",
};

async function getLeaderboard() {
  const supabase = getSupabaseServerClient();
  if (!supabase) return [];

  const [profilesRes, starsRes, tiersRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, avatar_url, headline, linkedin_url"),
    supabase.from("member_stars").select("member_id, star_count, source, event_id"),
    supabase.from("star_tiers").select("tier_name, min_stars, badge_emoji").order("min_stars", { ascending: false }),
  ]);

  const profiles = profilesRes.data || [];
  const stars = starsRes.data || [];
  const tiers = tiersRes.data || [];

  const starsByMember = new Map();
  for (const s of stars) {
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
    return tiers.find((t) => totalStars >= t.min_stars) || null;
  }

  const list = profiles
    .filter((p) => p.full_name)
    .map((profile) => {
      const agg = starsByMember.get(profile.id);
      const totalStars = agg?.total ?? 0;
      const eventsAttended = agg?.events.size ?? 0;
      const tier = getTier(totalStars);
      return {
        id: profile.id,
        display_name: profile.full_name,
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
    .sort((a, b) => b.total_stars - a.total_stars || a.display_name.localeCompare(b.display_name));

  list.forEach((item, i) => {
    item.rank = i + 1;
  });

  return list;
}

function RankBadge({ rank }) {
  if (rank === 1) return <span className="text-2xl">🥇</span>;
  if (rank === 2) return <span className="text-2xl">🥈</span>;
  if (rank === 3) return <span className="text-2xl">🥉</span>;
  return <span className="text-sm font-bold tabular-nums text-gray-400">#{rank}</span>;
}

export default async function LeaderboardPage() {
  const leaderboard = await getLeaderboard();

  return (
    <div className="mx-auto flex w-full max-w-3xl flex-col gap-8 p-4 sm:p-6 md:p-8">
      <div>
        <h1 className="text-3xl font-extrabold tracking-tight text-[color:var(--byu-blue)]">
          Star Leaderboard
        </h1>
        <p className="mt-2 text-gray-600">
          Members ranked by stars earned through events, skills, and contributions to the club.
        </p>
      </div>

      {leaderboard.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 py-16 text-center">
          <Star size={40} className="mx-auto mb-4 text-gray-300" />
          <p className="font-semibold text-gray-600">No star members yet</p>
          <p className="mt-2 text-sm text-gray-500">
            Members earn stars by attending events and demonstrating AI skills.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-3">
          {leaderboard.map((member) => (
            <li key={member.id}>
              <Link
                href={`/stars/${member.id}`}
                className="flex items-center gap-4 rounded-xl border border-gray-200 bg-white p-4 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex w-10 shrink-0 items-center justify-center">
                  <RankBadge rank={member.rank} />
                </div>
                {member.avatar_url ? (
                  <img
                    src={member.avatar_url}
                    alt=""
                    className="h-12 w-12 shrink-0 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[color:var(--byu-blue)]/20 text-lg font-bold text-[color:var(--byu-blue)]">
                    {member.display_name?.[0]?.toUpperCase() || "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-gray-900 truncate">{member.display_name}</span>
                    {member.tier_emoji && member.tier_name && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--byu-blue)]/10 px-2 py-0.5 text-xs font-medium text-[color:var(--byu-blue)]">
                        {member.tier_emoji} {member.tier_name}
                      </span>
                    )}
                  </div>
                  {member.headline && (
                    <p className="text-sm text-gray-500 truncate">{member.headline}</p>
                  )}
                  {member.events_attended > 0 && (
                    <p className="text-xs text-gray-400">
                      {member.events_attended} event{member.events_attended !== 1 ? "s" : ""} attended
                    </p>
                  )}
                </div>
                <div className="flex shrink-0 items-center gap-1.5">
                  <Star size={16} className="fill-yellow-400 text-yellow-400" />
                  <span className="font-bold tabular-nums text-[color:var(--byu-blue)]">
                    {member.total_stars}
                  </span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
