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

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-[color:var(--byu-blue)]">
        Star users
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
        <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {starUsers.map((user) => (
            <li key={user.id}>
              <Link
                href={`/stars/${user.id}`}
                className="flex flex-col gap-2 rounded-lg border border-gray-100 p-4 hover:bg-gray-50 block transition-colors"
              >
              <div className="flex items-center gap-3">
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
                <div>
                  <span className="font-semibold text-gray-900">
                    {user.display_name || "Member"}
                  </span>
                  {user.skill && (
                    <span className="mt-0.5 block text-sm text-gray-500">
                      {user.skill}
                    </span>
                  )}
                </div>
              </div>
              {user.note && (
                <p className="text-sm text-gray-600">{user.note}</p>
              )}
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
        <p className="mt-4 text-sm text-gray-500">
          <Link href="/" className="text-[color:var(--byu-blue)] underline">
            ← Back to home
          </Link>
        </p>
      </div>
    </section>
  );
}
