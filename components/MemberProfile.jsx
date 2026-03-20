"use client";

export default function MemberProfile({ user, profile, stars = [], totalStars = null, currentTier = null }) {
  const displayName =
    profile?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Member";
  const avatarUrl =
    profile?.avatar_url || user?.user_metadata?.picture || user?.user_metadata?.avatar_url;
  const email = profile?.email || user?.email;
  const headline =
    profile?.headline || user?.user_metadata?.headline || user?.user_metadata?.position;

  // If totalStars prop not provided, compute from star records (backward compat)
  const computedTotal = totalStars ?? stars.reduce((sum, s) => sum + (s.star_count ?? 1), 0);
  const eventsAttended = new Set(
    stars.filter((s) => s.source === "event_attendance" && s.event_id).map((s) => s.event_id)
  ).size;

  return (
    <div className="flex flex-col gap-6">
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt=""
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[color:var(--byu-blue)]/20 text-2xl font-bold text-[color:var(--byu-blue)]">
              {displayName[0]?.toUpperCase() || "?"}
            </div>
          )}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
              {currentTier && (
                <span className="inline-flex items-center gap-1 rounded-full bg-[color:var(--byu-blue)]/10 px-2.5 py-0.5 text-sm font-medium text-[color:var(--byu-blue)]">
                  {currentTier.badge_emoji} {currentTier.tier_name}
                </span>
              )}
            </div>
            {email && <p className="mt-1 text-gray-600">{email}</p>}
            {headline && <p className="mt-2 text-gray-500">{headline}</p>}
            <div className="mt-3 flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">&#9733;</span>
                <span className="text-lg font-semibold text-[color:var(--byu-blue)]">
                  {computedTotal} {computedTotal === 1 ? "star" : "stars"}
                </span>
              </div>
              {eventsAttended > 0 && (
                <div className="text-sm text-gray-500">
                  {eventsAttended} event{eventsAttended !== 1 ? "s" : ""} attended
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {stars.length > 0 && (
        <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-bold text-[color:var(--byu-blue)]">
            Your Stars
          </h3>
          <ul className="divide-y divide-gray-100">
            {stars.map((star) => (
              <li key={star.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
                <div className="flex items-center gap-2">
                  <span className="text-yellow-500">
                    {star.star_count > 1 ? "⭐".repeat(Math.min(star.star_count, 5)) : "⭐"}
                  </span>
                  <span className="font-medium text-gray-900">
                    {star.skill || star.event_name || "Recognition"}
                  </span>
                  {star.source === "event_attendance" && (
                    <span className="rounded-full bg-green-100 px-1.5 py-0.5 text-[10px] font-medium text-green-700">
                      Event
                    </span>
                  )}
                  {star.source === "bonus" && (
                    <span className="rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                      Bonus
                    </span>
                  )}
                </div>
                {star.event_name && star.skill && (
                  <p className="pl-6 text-sm text-gray-500">Event: {star.event_name}</p>
                )}
                {star.note && (
                  <p className="pl-6 text-sm text-gray-500">{star.note}</p>
                )}
                <p className="pl-6 text-xs text-gray-400">
                  {new Date(star.created_at).toLocaleDateString()}
                </p>
              </li>
            ))}
          </ul>
        </section>
      )}

      {stars.length === 0 && (
        <section className="rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 p-6 text-center">
          <p className="text-gray-600">
            You haven&apos;t earned any stars yet. Participate in ABS events to earn recognition!
          </p>
        </section>
      )}
    </div>
  );
}
