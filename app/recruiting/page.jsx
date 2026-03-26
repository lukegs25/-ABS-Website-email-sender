import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { getSupabaseServerClient } from "@/lib/supabase";
import PremierJobBoard from "@/components/PremierJobBoard";
import Link from "next/link";

export const metadata = {
  title: "Premier Recruiting — AI in Business Society",
  description: "Exclusive AI job opportunities for certified ABS members.",
};

export default async function RecruitingPage() {
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
    redirect("/login?next=/recruiting");
  }

  // Check attendance count
  const serviceClient = getSupabaseServerClient();
  let eventsAttended = 0;
  if (serviceClient) {
    const { count } = await serviceClient
      .from("attendance")
      .select("id", { count: "exact", head: true })
      .eq("member_id", user.id);
    eventsAttended = count || 0;
  }

  const isUnlocked = eventsAttended >= 4;

  return (
    <div className="mx-auto max-w-3xl p-4 sm:p-6 md:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[color:var(--byu-blue)]">
          Premier AI Recruiting
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Exclusive positions for certified ABS members
        </p>
      </div>

      {isUnlocked ? (
        <PremierJobBoard />
      ) : (
        <section className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-100 text-amber-600">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
            </svg>
          </div>
          <h2 className="text-xl font-bold text-gray-900">
            Unlock Premier Recruiting
          </h2>
          <p className="mt-2 text-gray-600">
            Attend 4 ABS meetings to earn your AI Proficiency Certificate and gain access to exclusive AI job opportunities.
          </p>

          {/* Progress */}
          <div className="mx-auto mt-6 max-w-xs">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-sm text-gray-500">
                {eventsAttended} of 4 meetings
              </span>
              <span className="text-sm font-medium text-[color:var(--byu-blue)]">
                {4 - eventsAttended} more to go
              </span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-100">
              <div
                className="h-3 rounded-full bg-[color:var(--byu-blue)] transition-all"
                style={{ width: `${(eventsAttended / 4) * 100}%` }}
              />
            </div>
          </div>

          <Link
            href="/checkin"
            className="mt-6 inline-flex items-center rounded-lg bg-[color:var(--byu-blue)] px-6 py-2.5 text-sm font-semibold text-white hover:opacity-90"
          >
            Check In to a Meeting →
          </Link>
        </section>
      )}
    </div>
  );
}
