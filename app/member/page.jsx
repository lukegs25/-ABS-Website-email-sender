import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import MemberProfile from "@/components/MemberProfile";

export default async function MemberPage() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="p-8">
        <p className="text-red-600">Auth not configured.</p>
      </div>
    );
  }

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  const { data: stars } = await supabase
    .from("member_stars")
    .select("id, skill, event_name, note, star_count, source, event_id, created_at")
    .eq("member_id", user.id)
    .order("created_at", { ascending: false });

  // Fetch star tiers to resolve member's current tier
  const serviceSupabase = getSupabaseServerClient();
  let tiers = [];
  if (serviceSupabase) {
    const { data: tiersData } = await serviceSupabase
      .from("star_tiers")
      .select("tier_name, min_stars, badge_emoji")
      .order("min_stars", { ascending: false });
    tiers = tiersData || [];
  }

  const totalStars = (stars || []).reduce((sum, s) => sum + (s.star_count ?? 1), 0);
  const currentTier = tiers.find((t) => totalStars >= t.min_stars) || null;

  // Get actual attendance count (more accurate than counting unique star event_ids)
  let eventsAttended = 0;
  let eventHistory = [];
  if (serviceSupabase) {
    const { count } = await serviceSupabase
      .from("attendance")
      .select("id", { count: "exact", head: true })
      .eq("member_id", user.id);
    eventsAttended = count || 0;

    // Fetch event history with event details
    const { data: historyData } = await serviceSupabase
      .from("attendance")
      .select(`
        id,
        checked_in_at,
        check_in_method,
        events (
          id,
          title,
          event_date,
          location,
          event_type
        )
      `)
      .eq("member_id", user.id)
      .order("checked_in_at", { ascending: false })
      .limit(20);
    eventHistory = historyData || [];
  }

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[color:var(--byu-blue)]">
          Your Profile
        </h1>
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Sign out
          </button>
        </form>
      </div>

      <MemberProfile
        user={user}
        profile={profile}
        stars={stars || []}
        totalStars={totalStars}
        currentTier={currentTier}
        eventsAttended={eventsAttended}
        eventHistory={eventHistory}
      />
    </div>
  );
}
