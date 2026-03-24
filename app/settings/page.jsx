import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import SettingsClient from "./SettingsClient";

export const metadata = {
  title: "Member Settings — AI in Business Society",
};

export default async function SettingsPage() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="p-8">
        <p className="text-red-600">Auth not configured.</p>
      </div>
    );
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  // Fetch profile (table may not exist yet if migrations haven't run)
  let profile = null;
  try {
    const { data } = await supabase
      .from("member_profiles")
      .select("*")
      .eq("user_id", user.id)
      .single();
    profile = data;
  } catch {
    // Table may not exist yet
  }

  // Fetch stars
  const serviceSupabase = getSupabaseServerClient();
  let stars = [];
  let tiers = [];
  let eventsAttended = 0;
  let attendanceRecords = [];

  if (serviceSupabase) {
    const { data: starsData } = await serviceSupabase
      .from("member_stars")
      .select("id, skill, event_name, note, star_count, source, event_id, created_at")
      .eq("member_id", user.id)
      .order("created_at", { ascending: false });
    stars = starsData || [];

    const { data: tiersData } = await serviceSupabase
      .from("star_tiers")
      .select("tier_name, min_stars, badge_emoji")
      .order("min_stars", { ascending: false });
    tiers = tiersData || [];

    const { count } = await serviceSupabase
      .from("attendance")
      .select("id", { count: "exact", head: true })
      .eq("member_id", user.id);
    eventsAttended = count || 0;

    const { data: attendanceData } = await serviceSupabase
      .from("attendance")
      .select("id, checked_in_at, event_id, events(title, event_type)")
      .eq("member_id", user.id)
      .order("checked_in_at", { ascending: false })
      .limit(20);
    attendanceRecords = (attendanceData || []).map((r) => ({
      id: r.id,
      event_name: r.events?.title || "Event",
      event_type: r.events?.event_type || null,
      checked_in_at: r.checked_in_at,
    }));
  }

  const totalStars = stars.reduce((sum, s) => sum + (s.star_count ?? 1), 0);
  const currentTier = tiers.find((t) => totalStars >= t.min_stars) || null;

  return (
    <SettingsClient
      user={user}
      profile={profile || null}
      stars={stars}
      totalStars={totalStars}
      currentTier={currentTier}
      eventsAttended={eventsAttended}
      attendanceRecords={attendanceRecords}
    />
  );
}
