"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Star } from "lucide-react";

const TOP3_STYLES = [
  "border-l-4 border-yellow-400 bg-yellow-50/60", // 🥇
  "border-l-4 border-gray-400 bg-gray-50/60",      // 🥈
  "border-l-4 border-amber-600 bg-amber-50/60",    // 🥉
];

function LeaderboardSkeleton() {
  return (
    <ul className="divide-y divide-gray-100">
      {[...Array(5)].map((_, i) => (
        <li key={i} className="py-4 first:pt-0 last:pb-0">
          <div className="flex items-center gap-4 p-2">
            <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
            <div className="h-10 w-10 animate-pulse rounded-full bg-gray-200" />
            <div className="flex flex-1 flex-col gap-2">
              <div className="h-4 w-32 animate-pulse rounded bg-gray-200" />
              <div className="h-3 w-24 animate-pulse rounded bg-gray-100" />
            </div>
            <div className="h-5 w-10 animate-pulse rounded bg-gray-100" />
          </div>
        </li>
      ))}
    </ul>
  );
}

function RankBadge({ rank }) {
  if (rank === 1) return <span className="text-xl">🥇</span>;
  if (rank === 2) return <span className="text-xl">🥈</span>;
  if (rank === 3) return <span className="text-xl">🥉</span>;
  return (
    <span className="text-sm font-bold tabular-nums text-gray-400">
      #{rank}
    </span>
  );
}

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

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-[color:var(--byu-blue)]">
          Star Members
        </h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Recognized for AI tool proficiency and contributions to the club
        </p>
      </div>

      {loading ? (
        <LeaderboardSkeleton />
      ) : starUsers.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-200 py-12 text-center">
          <Star
            size={32}
            className="mx-auto mb-3 text-gray-300"
          />
          <p className="font-medium text-gray-600">No star members yet</p>
          <p className="mt-2 text-sm text-gray-500">
            Members earn recognition as they demonstrate AI proficiency.
            Admins can award stars from the member dashboard.
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-gray-100">
          {starUsers.map((user) => {
            const topStyle = user.rank <= 3 ? TOP3_STYLES[user.rank - 1] : "";
            return (
              <li key={user.id} className="py-3 first:pt-0 last:pb-0">
                <Link
                  href={`/stars/${user.id}`}
                  className={`flex items-center gap-4 rounded-lg p-2 transition-colors hover:bg-gray-50 ${topStyle}`}
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center">
                    <RankBadge rank={user.rank} />
                  </span>
                  {user.avatar_url ? (
                    <img
                      src={user.avatar_url}
                      alt=""
                      className="h-11 w-11 shrink-0 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[color:var(--byu-blue)]/20 text-lg font-semibold text-[color:var(--byu-blue)]">
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
                    <Star
                      size={15}
                      className="fill-yellow-400 text-yellow-400"
                    />
                    <span className="font-bold tabular-nums">
                      {user.star_count}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
