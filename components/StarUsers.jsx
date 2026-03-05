"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import LinkedInSignIn from "@/components/LinkedInSignIn";

export default function StarUsers() {
  const [starUsers, setStarUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/star-users")
      .then((res) => res.json())
      .then((data) => setStarUsers(Array.isArray(data) ? data : []))
      .catch(() => setStarUsers([]))
      .finally(() => setLoading(false));
  }, []);

  const rankBadge = (rank) => {
    if (rank === 1) return "🥇";
    if (rank === 2) return "🥈";
    if (rank === 3) return "🥉";
    return `#${rank}`;
  };

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-[color:var(--byu-blue)]">
        Star Users Leaderboard
      </h2>

      {loading ? (
        <p className="py-8 text-center text-gray-500">Loading…</p>
      ) : starUsers.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-200 py-12 text-center">
          <p className="text-gray-600">
            Star users will appear here once members earn recognition for AI
            tool proficiency.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Admins can award stars from the member dashboard.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {starUsers.map((user) => (
            <li key={user.id} className="py-4 first:pt-0 last:pb-0">
              <Link
                href={`/stars/${user.id}`}
                className="flex items-center gap-4 rounded-lg p-2 transition-colors hover:bg-gray-50"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center text-xl font-bold">
                  {rankBadge(user.rank)}
                </span>
                {user.avatar_url ? (
                  <img
                    src={user.avatar_url}
                    alt=""
                    className="h-12 w-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[color:var(--byu-blue)]/20 text-lg font-semibold text-[color:var(--byu-blue)]">
                    {user.display_name?.[0] || "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <span className="block font-semibold text-gray-900 truncate">
                    {user.display_name || "Member"}
                  </span>
                  {user.skill && (
                    <span className="block text-sm text-gray-500 truncate">
                      {user.skill}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 text-[color:var(--byu-blue)]">
                  <span className="text-yellow-500 text-lg">&#9733;</span>
                  <span className="font-bold">{user.star_count}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      )}

      <div className="mt-8 pt-8 border-t border-gray-200">
        <h3 className="text-lg font-bold text-[color:var(--byu-blue)]">Member Login</h3>
        <p className="mt-2 text-gray-600">
          Sign in with your LinkedIn account to build your member profile and access the dashboard.
        </p>
        <div className="mt-4">
          <LinkedInSignIn redirectTo="/member" />
        </div>
      </div>
    </section>
  );
}
