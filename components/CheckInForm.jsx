"use client";

import { useState } from "react";
import { CheckCircle, AlertCircle, Award, Lock } from "lucide-react";
import Link from "next/link";

export default function CheckInForm() {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!password.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password: password.trim() }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Check-in failed");
        return;
      }

      setResult(data);
      setPassword("");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      {/* Check-in form */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-4 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--byu-blue)]/10 text-[color:var(--byu-blue)]">
            <Lock size={28} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Event Check-In</h2>
          <p className="mt-1 text-sm text-gray-500">
            Enter the password announced at the end of the meeting
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="text"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter event password"
            autoComplete="off"
            className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-center text-lg font-mono tracking-widest text-gray-900 placeholder:text-gray-400 placeholder:tracking-normal placeholder:font-sans placeholder:text-base focus:border-[color:var(--byu-blue)] focus:outline-none focus:ring-1 focus:ring-[color:var(--byu-blue)]"
          />
          <button
            type="submit"
            disabled={!password.trim() || loading}
            className="w-full rounded-lg bg-[color:var(--byu-blue)] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Checking in..." : "Check In"}
          </button>
        </form>
      </section>

      {/* Error */}
      {error && (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4">
          <AlertCircle size={20} className="mt-0.5 shrink-0 text-red-500" />
          <div>
            <p className="text-sm font-medium text-red-800">{error}</p>
            {error.includes("already") && (
              <p className="mt-1 text-xs text-red-600">
                You&apos;ve already been marked present for this event.
              </p>
            )}
          </div>
        </div>
      )}

      {/* Success */}
      {result && (
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4">
            <CheckCircle size={20} className="mt-0.5 shrink-0 text-green-600" />
            <div>
              <p className="text-sm font-medium text-green-800">
                Checked in to {result.eventTitle}!
              </p>
              {result.starsAwarded > 0 && (
                <p className="mt-1 text-sm text-green-700">
                  +{result.starsAwarded} star{result.starsAwarded > 1 ? "s" : ""} earned ⭐
                </p>
              )}
            </div>
          </div>

          {/* Certificate progress */}
          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-3">
              <Award size={18} className="text-[color:var(--byu-blue)]" />
              <span className="text-sm font-semibold text-gray-900">
                Certificate Progress
              </span>
            </div>

            {result.certificateEarned ? (
              <div className="space-y-2">
                <p className="text-sm text-green-700 font-medium">
                  🎉 You&apos;ve earned your AI Proficiency Certificate!
                </p>
                <Link
                  href="/member"
                  className="inline-flex items-center gap-1.5 text-sm font-medium text-[color:var(--byu-blue)] hover:underline"
                >
                  View & download your certificate →
                </Link>
              </div>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-xs text-gray-500">
                    {result.totalEventsAttended} of 3 meetings
                  </span>
                  <span className="text-xs font-medium text-[color:var(--byu-blue)]">
                    {3 - result.totalEventsAttended} more to go
                  </span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-gray-100">
                  <div
                    className="h-2.5 rounded-full bg-[color:var(--byu-blue)] transition-all"
                    style={{ width: `${Math.min((result.totalEventsAttended / 3) * 100, 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-gray-500">
                  Attend 3 meetings to earn your AI Proficiency Certificate and unlock premier recruiting.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
