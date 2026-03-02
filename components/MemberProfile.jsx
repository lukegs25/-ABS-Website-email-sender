"use client";

export default function MemberProfile({ user, profile }) {
  const displayName =
    profile?.full_name || user?.user_metadata?.name || user?.email?.split("@")[0] || "Member";
  const avatarUrl =
    profile?.avatar_url || user?.user_metadata?.picture || user?.user_metadata?.avatar_url;
  const email = profile?.email || user?.email;
  const headline =
    profile?.headline || user?.user_metadata?.headline || user?.user_metadata?.position;

  return (
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
          <h2 className="text-xl font-bold text-gray-900">{displayName}</h2>
          {email && (
            <p className="mt-1 text-gray-600">{email}</p>
          )}
          {headline && (
            <p className="mt-2 text-gray-500">{headline}</p>
          )}
        </div>
      </div>

      <div className="mt-6 rounded-lg border border-gray-100 bg-gray-50/50 p-4">
        <h3 className="text-sm font-medium text-gray-700">Profile from LinkedIn</h3>
        <p className="mt-2 text-sm text-gray-600">
          Your profile is built from your LinkedIn account. Attendance, stars, and other
          activities will appear here as you participate in ABS events.
        </p>
      </div>
    </section>
  );
}
