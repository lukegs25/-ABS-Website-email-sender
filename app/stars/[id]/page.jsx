import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase";

export default async function StarUserProfilePage({ params }) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return (
      <div className="p-8">
        <p className="text-red-600">Database not configured.</p>
      </div>
    );
  }

  const { data: stars } = await supabase
    .from("member_stars")
    .select("id, skill, note, event_name, created_at")
    .eq("member_id", id)
    .order("created_at", { ascending: false });

  if (!stars || stars.length === 0) {
    notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, full_name, email, avatar_url, headline, linkedin_url")
    .eq("id", id)
    .single();

  if (!profile) {
    notFound();
  }

  const displayName =
    profile.full_name || profile.email?.split("@")[0] || "Member";
  const skills = [...new Set(stars.map((s) => s.skill).filter(Boolean))];

  return (
    <div className="flex flex-col gap-8 p-8">
      <h1 className="text-2xl font-bold text-[color:var(--byu-blue)]">
        Star User Profile
      </h1>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
          {profile.avatar_url ? (
            <img
              src={profile.avatar_url}
              alt=""
              className="h-24 w-24 rounded-full object-cover"
            />
          ) : (
            <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[color:var(--byu-blue)]/20 text-2xl font-bold text-[color:var(--byu-blue)]">
              {displayName[0]?.toUpperCase() || "?"}
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
            {profile.email && (
              <p className="mt-1 text-gray-600">{profile.email}</p>
            )}
            {profile.headline && (
              <p className="mt-2 text-gray-500">{profile.headline}</p>
            )}
            {profile.linkedin_url && (
              <a
                href={profile.linkedin_url}
                target="_blank"
                rel="noopener noreferrer"
                className="mt-2 inline-flex items-center gap-1 text-sm text-[#0A66C2] hover:underline"
              >
                View LinkedIn profile →
              </a>
            )}
            <div className="mt-3 flex items-center gap-2">
              <span className="text-2xl">&#9733;</span>
              <span className="text-lg font-semibold text-[color:var(--byu-blue)]">
                {stars.length} {stars.length === 1 ? "star" : "stars"}
              </span>
            </div>
          </div>
        </div>

        {skills.length > 0 && (
          <div className="mt-6 flex flex-wrap gap-2">
            {skills.map((s) => (
              <span
                key={s}
                className="rounded-full bg-[color:var(--byu-blue)]/10 px-3 py-1 text-sm font-medium text-[color:var(--byu-blue)]"
              >
                {s}
              </span>
            ))}
          </div>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-[color:var(--byu-blue)]">
          Stars Earned
        </h3>
        <ul className="divide-y divide-gray-100">
          {stars.map((star) => (
            <li key={star.id} className="flex flex-col gap-1 py-3 first:pt-0 last:pb-0">
              <div className="flex items-center gap-2">
                <span className="text-yellow-500">&#9733;</span>
                <span className="font-medium text-gray-900">
                  {star.skill || star.event_name || "Recognition"}
                </span>
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
    </div>
  );
}
