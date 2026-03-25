"use client";

import { useState, useEffect } from "react";
import { CheckCircle, AlertCircle, Award, QrCode } from "lucide-react";

export default function QRCheckInForm({ initialEventId, initialCode }) {
  const [eventId, setEventId] = useState(initialEventId || "");
  const [code, setCode] = useState(initialCode || "");
  const [email, setEmail] = useState("");
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // Fetch active events for the dropdown
  useEffect(() => {
    fetch("/api/events")
      .then((r) => r.json())
      .then((d) => {
        if (d.data) setEvents(d.data);
      })
      .catch(() => {});
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!eventId || !code.trim() || !email.trim() || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/events/checkin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          event_id: eventId,
          checkin_code: code.trim(),
          email: email.trim(),
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Check-in failed");
        return;
      }
      setResult(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-md space-y-6">
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <div className="mb-5 text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--byu-blue)]/10 text-[color:var(--byu-blue)]">
            <QrCode size={28} />
          </div>
          <h2 className="text-xl font-bold text-gray-900">Event Check-In</h2>
          <p className="mt-1 text-sm text-gray-500">
            Enter your details to check in and earn a star ⭐
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Event selector */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Event</label>
            {initialEventId ? (
              <div className="rounded-lg border border-gray-200 bg-gray-50 px-4 py-2.5 text-sm text-gray-800">
                {events.find((e) => e.id === initialEventId)?.title || "Loading event…"}
              </div>
            ) : (
              <select
                value={eventId}
                onChange={(e) => setEventId(e.target.value)}
                required
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[color:var(--byu-blue)] focus:outline-none focus:ring-1 focus:ring-[color:var(--byu-blue)]"
              >
                <option value="">Select an event…</option>
                {events.map((ev) => (
                  <option key={ev.id} value={ev.id}>
                    {ev.title}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Code input */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Check-In Code</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. AI2026"
              autoComplete="off"
              required
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-center font-mono text-lg tracking-widest text-gray-900 placeholder:text-center placeholder:font-sans placeholder:text-base placeholder:tracking-normal focus:border-[color:var(--byu-blue)] focus:outline-none focus:ring-1 focus:ring-[color:var(--byu-blue)]"
            />
          </div>

          {/* Email input */}
          <div>
            <label className="mb-1 block text-sm font-medium text-gray-700">Your Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[color:var(--byu-blue)] focus:outline-none focus:ring-1 focus:ring-[color:var(--byu-blue)]"
            />
          </div>

          <button
            type="submit"
            disabled={!eventId || !code.trim() || !email.trim() || loading}
            className="w-full rounded-lg bg-[color:var(--byu-blue)] py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Checking in…" : "Check In"}
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
                ✅ Checked in to {result.eventTitle}!
              </p>
              {result.starsAwarded > 0 && (
                <p className="mt-1 text-sm text-green-700">
                  +{result.starsAwarded} star{result.starsAwarded > 1 ? "s" : ""} earned ⭐
                </p>
              )}
            </div>
          </div>

          <div className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
            <div className="flex items-center gap-2 mb-2">
              <Award size={18} className="text-[color:var(--byu-blue)]" />
              <span className="text-sm font-semibold text-gray-900">
                You&apos;re all set!
              </span>
            </div>
            <p className="text-sm text-gray-500">
              Your attendance has been recorded. Keep attending events to earn more stars and unlock your AI Proficiency Certificate!
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
