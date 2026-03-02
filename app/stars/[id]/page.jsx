import Link from "next/link";
import { notFound } from "next/navigation";
import { getSupabaseServerClient } from "@/lib/supabase";

export default async function StarUserProfilePage({ params }) {
  const { id } = await params;
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    return (
      <div className="p-8">
        <p className="text-red-600">Database not configured.</p>
        <Link href="/" className="mt-4 inline-block text-[color:var(--byu-blue)] underline">
          Back to home
        </Link>
      </div>
    );
  }

  const { data: stars } = await supabase
    .from("member_stars")
    .select("id, skill, note, created_at")
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
  const notes = stars.map((s) => s.note).filter(Boolean);

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[color:var(--byu-blue)]">
          Star User Profile
        </h1>
        <Link
          href="/"
          className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
        >
          ← Back to home
        </Link>
      </div>

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
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-gray-100 bg-gray-50/50 p-4">
          <h3 className="text-sm font-medium text-gray-700">
            Recognition (AI tool proficiency)
          </h3>
          {skills.length > 0 && (
            <p className="mt-2 text-gray-600">
              <span className="font-medium">Skills: </span>
              {skills.join(", ")}
            </p>
          )}
          {notes.length > 0 && (
            <ul className="mt-2 list-inside list-disc space-y-1 text-sm text-gray-600">
              {notes.map((n, i) => (
                <li key={i}>{n}</li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
}
