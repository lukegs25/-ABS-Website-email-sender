"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";

export default function RSVPButton({ eventId, eventTitle, eventDate }) {
  const [user, setUser] = useState(null);
  const [hasRsvpd, setHasRsvpd] = useState(false);
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    if (!supabase) {
      setLoading(false);
      return;
    }
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUser(user || null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!eventId) {
      setLoading(false);
      return;
    }
    fetch(`/api/events/rsvp?event_id=${encodeURIComponent(eventId)}`)
      .then((r) => r.json())
      .then((data) => {
        setCount(data.count || 0);
        setHasRsvpd(data.user_has_rsvpd || false);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [eventId, user]);

  async function handleRsvp() {
    if (!user) {
      window.location.href = "/login";
      return;
    }
    setSubmitting(true);
    setError("");
    // Optimistically update UI
    const prevHasRsvpd = hasRsvpd;
    const prevCount = count;
    try {
      if (hasRsvpd) {
        setHasRsvpd(false);
        setCount((c) => Math.max(0, c - 1));
        const res = await fetch("/api/events/rsvp", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ event_id: eventId }),
        });
        if (!res.ok) throw new Error("Failed to cancel RSVP");
      } else {
        setHasRsvpd(true);
        setCount((c) => c + 1);
        const res = await fetch("/api/events/rsvp", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_id: eventId,
            event_title: eventTitle,
            event_date: eventDate,
          }),
        });
        if (!res.ok) throw new Error("Failed to RSVP");
      }
    } catch (e) {
      // Revert optimistic update on error
      setHasRsvpd(prevHasRsvpd);
      setCount(prevCount);
      setError(e.message || "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (!eventId || loading) return null;

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex items-center gap-2">
        {count > 0 && (
          <span className="text-xs text-gray-500">{count} going</span>
        )}
        <button
          type="button"
          onClick={handleRsvp}
          disabled={submitting}
          className={`rounded-md px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-60 ${
            !user
              ? "bg-gray-100 text-gray-600 hover:bg-gray-200"
              : hasRsvpd
              ? "border border-[color:var(--byu-blue)] text-[color:var(--byu-blue)] hover:bg-[color:var(--byu-blue)]/10"
              : "bg-[color:var(--byu-blue)] text-white hover:opacity-90"
          }`}
        >
          {submitting ? "..." : !user ? "Login to RSVP" : hasRsvpd ? "Cancel RSVP" : "RSVP"}
        </button>
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
}
