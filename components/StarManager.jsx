"use client";

import { useState, useEffect } from "react";

export default function StarManager() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedMember, setSelectedMember] = useState("");
  const [skill, setSkill] = useState("");
  const [eventName, setEventName] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState(null);
  const [leaderboard, setLeaderboard] = useState([]);

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    setLoading(true);
    try {
      const [membersRes, leaderboardRes] = await Promise.all([
        fetch("/api/admin/star-users"),
        fetch("/api/star-users"),
      ]);
      const membersData = await membersRes.json();
      const leaderboardData = await leaderboardRes.json();
      setMembers(membersData.members || []);
      setLeaderboard(Array.isArray(leaderboardData) ? leaderboardData : []);
    } catch {
      setMessage({ type: "error", text: "Failed to load data" });
    } finally {
      setLoading(false);
    }
  }

  async function handleAwardStar(e) {
    e.preventDefault();
    if (!selectedMember) return;

    setSubmitting(true);
    setMessage(null);

    try {
      const res = await fetch("/api/admin/star-users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          member_id: selectedMember,
          skill: skill || undefined,
          event_name: eventName || undefined,
          note: note || undefined,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to award star" });
        return;
      }

      setMessage({ type: "success", text: "Star awarded successfully!" });
      setSelectedMember("");
      setSkill("");
      setEventName("");
      setNote("");
      loadData();
    } catch {
      setMessage({ type: "error", text: "Unexpected error" });
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return <p className="py-8 text-center text-gray-500">Loading…</p>;
  }

  return (
    <div className="flex flex-col gap-8">
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-[color:var(--byu-blue)]">
          Award a Star
        </h3>

        {members.length === 0 ? (
          <p className="text-gray-500">
            No members have signed in with LinkedIn yet. Members must sign in first before they can receive stars.
          </p>
        ) : (
          <form onSubmit={handleAwardStar} className="flex flex-col gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Member
              </label>
              <select
                value={selectedMember}
                onChange={(e) => setSelectedMember(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[color:var(--byu-blue)] focus:outline-none focus:ring-1 focus:ring-[color:var(--byu-blue)]"
              >
                <option value="">Select a member…</option>
                {members.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.full_name || m.email || m.id}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Event Name
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                placeholder="e.g. AI Workshop March 2026"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[color:var(--byu-blue)] focus:outline-none focus:ring-1 focus:ring-[color:var(--byu-blue)]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Skill
              </label>
              <input
                type="text"
                value={skill}
                onChange={(e) => setSkill(e.target.value)}
                placeholder="e.g. ChatGPT, Python, Prompt Engineering"
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[color:var(--byu-blue)] focus:outline-none focus:ring-1 focus:ring-[color:var(--byu-blue)]"
              />
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium text-gray-700">
                Note (optional)
              </label>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Recognition details…"
                rows={2}
                className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[color:var(--byu-blue)] focus:outline-none focus:ring-1 focus:ring-[color:var(--byu-blue)]"
              />
            </div>

            <button
              type="submit"
              disabled={submitting || !selectedMember}
              className="w-fit rounded-lg bg-[color:var(--byu-blue)] px-6 py-2 text-sm font-semibold text-white transition-colors hover:opacity-90 disabled:opacity-50"
            >
              {submitting ? "Awarding…" : "Award Star"}
            </button>
          </form>
        )}

        {message && (
          <p className={`mt-4 text-sm font-medium ${message.type === "error" ? "text-red-600" : "text-green-600"}`}>
            {message.text}
          </p>
        )}
      </section>

      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h3 className="mb-4 text-lg font-bold text-[color:var(--byu-blue)]">
          Current Leaderboard
        </h3>

        {leaderboard.length === 0 ? (
          <p className="text-gray-500">No stars awarded yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {leaderboard.map((user) => (
              <li key={user.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center text-lg font-bold">
                  {user.rank === 1 ? "🥇" : user.rank === 2 ? "🥈" : user.rank === 3 ? "🥉" : `#${user.rank}`}
                </span>
                {user.avatar_url ? (
                  <img src={user.avatar_url} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[color:var(--byu-blue)]/20 font-semibold text-[color:var(--byu-blue)]">
                    {user.display_name?.[0] || "?"}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 truncate">{user.display_name}</p>
                  {user.skill && <p className="text-sm text-gray-500 truncate">{user.skill}</p>}
                </div>
                <div className="flex items-center gap-1 text-[color:var(--byu-blue)]">
                  <span className="text-yellow-500">&#9733;</span>
                  <span className="font-bold">{user.star_count}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
