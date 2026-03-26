"use client";

import { useState, useEffect, useCallback, useRef } from "react";

const EVENT_TYPES = ["general", "bootcamp", "speaker", "workshop", "social"];
const PASSWORD_DURATION_MS = 5 * 60 * 1000; // 5 minutes

/* ── Inline attendee preview for event cards ── */
function AttendeePreview({ eventId }) {
  const [attendees, setAttendees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/admin/attendance/${eventId}`);
        const data = await res.json();
        setAttendees(data.data || []);
      } catch {
        setAttendees([]);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [eventId]);

  if (loading) return <p className="text-xs text-gray-400 mt-2">Loading attendees...</p>;
  if (attendees.length === 0) return <p className="text-xs text-gray-400 mt-2">No check-ins yet</p>;

  const preview = expanded ? attendees : attendees.slice(0, 5);

  return (
    <div className="mt-2">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-xs font-semibold text-[color:var(--byu-blue)] hover:underline"
      >
        {attendees.length} checked in {expanded ? "(collapse)" : "(show)"}
      </button>
      {expanded && (
        <ul className="mt-1.5 flex flex-col gap-1">
          {preview.map((a) => {
            const profile = a.profiles;
            const name = profile?.full_name || profile?.email || "Unknown";
            return (
              <li key={a.id} className="flex items-center gap-2 text-xs text-gray-600">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="" className="h-5 w-5 rounded-full object-cover" />
                ) : (
                  <div className="flex h-5 w-5 items-center justify-center rounded-full bg-gray-200 text-[10px] font-bold text-gray-500">
                    {name[0]?.toUpperCase()}
                  </div>
                )}
                <span>{name}</span>
                <span className="text-gray-400">
                  · {a.check_in_method} · {new Date(a.checked_in_at).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}
                </span>
              </li>
            );
          })}
          {!expanded && attendees.length > 5 && (
            <li className="text-xs text-gray-400">+{attendees.length - 5} more</li>
          )}
        </ul>
      )}
    </div>
  );
}

function generatePassword() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let pwd = "";
  for (let i = 0; i < 6; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
  return pwd;
}

function formatCountdown(ms) {
  if (ms <= 0) return "0:00";
  const mins = Math.floor(ms / 60000);
  const secs = Math.floor((ms % 60000) / 1000);
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

/* ── Countdown Timer for active passwords ── */
function PasswordTimer({ generatedAt, password, onExpired }) {
  const [remaining, setRemaining] = useState(() => {
    const elapsed = Date.now() - new Date(generatedAt).getTime();
    return Math.max(0, PASSWORD_DURATION_MS - elapsed);
  });

  useEffect(() => {
    if (remaining <= 0) {
      onExpired?.();
      return;
    }
    const interval = setInterval(() => {
      const elapsed = Date.now() - new Date(generatedAt).getTime();
      const left = Math.max(0, PASSWORD_DURATION_MS - elapsed);
      setRemaining(left);
      if (left <= 0) {
        clearInterval(interval);
        onExpired?.();
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [generatedAt, onExpired, remaining]);

  const isExpired = remaining <= 0;
  const isUrgent = remaining > 0 && remaining < 60000;

  if (isExpired) {
    return (
      <span className="text-xs font-medium text-red-600">
        Expired
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <span className="rounded-lg bg-green-50 border border-green-200 px-3 py-1.5 font-mono text-lg font-bold tracking-widest text-green-800">
        {password}
      </span>
      <span className={`text-sm font-medium ${isUrgent ? "text-red-600 animate-pulse" : "text-gray-500"}`}>
        {formatCountdown(remaining)} left
      </span>
    </div>
  );
}

/* ── Manual Event Form (for events not on Google Calendar) ── */
function EventForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState({
    title: initial?.title || "",
    description: initial?.description || "",
    event_date: initial?.event_date
      ? new Date(initial.event_date).toISOString().slice(0, 16)
      : "",
    location: initial?.location || "",
    event_type: initial?.event_type || "general",
    star_value: initial?.star_value ?? 1,
    event_password: initial?.event_password || "",
  });

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const method = initial?.id ? "PUT" : "POST";
      const body = initial?.id ? { ...form, id: initial.id } : form;
      const res = await fetch("/api/admin/events", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Failed to save event");
        return;
      }
      onSave(data.data);
    } catch {
      setError("Unexpected error");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Title *</label>
        <input
          type="text"
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          required
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[color:var(--byu-blue)] focus:outline-none focus:ring-1 focus:ring-[color:var(--byu-blue)]"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">Description</label>
        <textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[color:var(--byu-blue)] focus:outline-none focus:ring-1 focus:ring-[color:var(--byu-blue)]"
        />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Date & Time *</label>
          <input
            type="datetime-local"
            value={form.event_date}
            onChange={(e) => setForm({ ...form, event_date: e.target.value })}
            required
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[color:var(--byu-blue)] focus:outline-none focus:ring-1 focus:ring-[color:var(--byu-blue)]"
          />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Location</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
            placeholder="e.g. TNRB 440"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[color:var(--byu-blue)] focus:outline-none focus:ring-1 focus:ring-[color:var(--byu-blue)]"
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Event Type</label>
          <select
            value={form.event_type}
            onChange={(e) => setForm({ ...form, event_type: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[color:var(--byu-blue)] focus:outline-none focus:ring-1 focus:ring-[color:var(--byu-blue)]"
          >
            {EVENT_TYPES.map((t) => (
              <option key={t} value={t}>
                {t.charAt(0).toUpperCase() + t.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-gray-700">Stars Awarded</label>
          <input
            type="number"
            min={0}
            max={10}
            value={form.star_value}
            onChange={(e) => setForm({ ...form, star_value: parseInt(e.target.value, 10) || 0 })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[color:var(--byu-blue)] focus:outline-none focus:ring-1 focus:ring-[color:var(--byu-blue)]"
          />
        </div>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[color:var(--byu-blue)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving\u2026" : initial?.id ? "Update Event" : "Create Event"}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="rounded-lg border border-gray-300 px-5 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

/* ── Attendance Panel (view/manage attendees for an event) ── */
function AttendancePanel({ event, members, onClose }) {
  const [attendees, setAttendees] = useState([]);
  const [loadingAttendees, setLoadingAttendees] = useState(true);
  const [selectedMember, setSelectedMember] = useState("");
  const [checkingIn, setCheckingIn] = useState(false);
  const [message, setMessage] = useState(null);

  const loadAttendees = useCallback(async () => {
    setLoadingAttendees(true);
    try {
      const res = await fetch(`/api/admin/attendance/${event.id}`);
      const data = await res.json();
      setAttendees(data.data || []);
    } catch {
      setAttendees([]);
    } finally {
      setLoadingAttendees(false);
    }
  }, [event.id]);

  useEffect(() => {
    loadAttendees();
  }, [loadAttendees]);

  async function handleCheckIn(e) {
    e.preventDefault();
    if (!selectedMember) return;
    setCheckingIn(true);
    setMessage(null);
    try {
      const res = await fetch("/api/admin/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ member_id: selectedMember, event_id: event.id }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Check-in failed" });
        return;
      }
      setMessage({ type: "success", text: data.message });
      setSelectedMember("");
      loadAttendees();
    } catch {
      setMessage({ type: "error", text: "Unexpected error" });
    } finally {
      setCheckingIn(false);
    }
  }

  async function handleRemove(memberId) {
    if (!confirm("Remove this member\u2019s attendance and associated stars?")) return;
    try {
      const res = await fetch(
        `/api/admin/attendance/${event.id}?member_id=${memberId}`,
        { method: "DELETE" }
      );
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Remove failed" });
        return;
      }
      setMessage({ type: "success", text: "Attendance removed" });
      loadAttendees();
    } catch {
      setMessage({ type: "error", text: "Unexpected error" });
    }
  }

  const attendedIds = new Set(attendees.map((a) => a.member_id));
  const availableMembers = members.filter((m) => !attendedIds.has(m.id));

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div>
          <h4 className="font-bold text-[color:var(--byu-blue)]">{event.title}</h4>
          <p className="text-sm text-gray-500">
            {new Date(event.event_date).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Denver" })} · {event.star_value} stars per attendee
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          \u2190 Back
        </button>
      </div>

      <form onSubmit={handleCheckIn} className="flex items-end gap-3">
        <div className="flex-1">
          <label className="mb-1 block text-sm font-medium text-gray-700">Check In Member</label>
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
          >
            <option value="">Select a member\u2026</option>
            {availableMembers.map((m) => (
              <option key={m.id} value={m.id}>
                {m.full_name || m.email || m.id}
              </option>
            ))}
          </select>
        </div>
        <button
          type="submit"
          disabled={checkingIn || !selectedMember}
          className="rounded-lg bg-[color:var(--byu-blue)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {checkingIn ? "Checking in\u2026" : "Check In"}
        </button>
      </form>

      {message && (
        <p className={`text-sm font-medium ${message.type === "error" ? "text-red-600" : "text-green-600"}`}>
          {message.text}
        </p>
      )}

      <div>
        <h5 className="mb-2 text-sm font-semibold text-gray-700">
          Attendees ({attendees.length})
        </h5>
        {loadingAttendees ? (
          <p className="text-sm text-gray-400">Loading\u2026</p>
        ) : attendees.length === 0 ? (
          <p className="text-sm text-gray-500">No attendees yet.</p>
        ) : (
          <ul className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {attendees.map((a) => {
              const profile = a.profiles;
              const name = profile?.full_name || profile?.email || a.member_id;
              return (
                <li key={a.id} className="flex items-center gap-3 px-4 py-2">
                  {profile?.avatar_url ? (
                    <img src={profile.avatar_url} alt="" className="h-8 w-8 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--byu-blue)]/10 text-xs font-bold text-[color:var(--byu-blue)]">
                      {name[0]?.toUpperCase() || "?"}
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{name}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(a.checked_in_at).toLocaleString()} · {a.check_in_method}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemove(a.member_id)}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

/* ── Main AttendanceManager ── */
export default function AttendanceManager() {
  const [events, setEvents] = useState([]);
  const [calendarEvents, setCalendarEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingCalendar, setLoadingCalendar] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [message, setMessage] = useState(null);
  const [generatingFor, setGeneratingFor] = useState(null); // google calendar event id being activated
  const [activePasswords, setActivePasswords] = useState({}); // { eventId: { password, generatedAt } }

  useEffect(() => {
    loadData();
    loadCalendarEvents();
  }, []);

  // Restore active passwords from existing events on load
  useEffect(() => {
    const active = {};
    for (const ev of events) {
      if (ev.event_password && ev.password_generated_at) {
        const elapsed = Date.now() - new Date(ev.password_generated_at).getTime();
        if (elapsed < PASSWORD_DURATION_MS) {
          active[ev.id] = { password: ev.event_password, generatedAt: ev.password_generated_at };
        }
      }
    }
    setActivePasswords((prev) => ({ ...prev, ...active }));
  }, [events]);

  async function loadData() {
    setLoading(true);
    try {
      const [eventsRes, membersRes] = await Promise.all([
        fetch("/api/admin/events"),
        fetch("/api/admin/star-users"),
      ]);
      const eventsData = await eventsRes.json();
      const membersData = await membersRes.json();
      setEvents(eventsData.data || []);
      setMembers(membersData.members || []);
    } catch {
      setMessage({ type: "error", text: "Failed to load data" });
    } finally {
      setLoading(false);
    }
  }

  async function loadCalendarEvents() {
    setLoadingCalendar(true);
    try {
      // Use the same source as the front page: Google Sheet first, then Calendar API fallback
      const sheetRes = await fetch("/api/calendar/sheet?days=30");
      const sheetData = await sheetRes.json();
      if (sheetData.events?.length > 0) {
        setCalendarEvents(sheetData.events);
        return;
      }
      // Fallback to Google Calendar API
      const calRes = await fetch("/api/calendar/events?days=30");
      const calData = await calRes.json();
      if (calData.events?.length > 0) {
        setCalendarEvents(calData.events);
        return;
      }
      // Final fallback to admin calendar endpoint
      const adminRes = await fetch("/api/admin/calendar/events?days=30");
      const adminData = await adminRes.json();
      setCalendarEvents(adminData.events || []);
    } catch {
      setCalendarEvents([]);
    } finally {
      setLoadingCalendar(false);
    }
  }

  async function handleDeleteEvent(id) {
    if (!confirm("Delete this event? Attendance records and associated stars will also be removed.")) return;
    try {
      const res = await fetch(`/api/admin/events?id=${id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Delete failed" });
        return;
      }
      setMessage({ type: "success", text: "Event deleted" });
      setEvents((prev) => prev.filter((e) => e.id !== id));
      setActivePasswords((prev) => {
        const next = { ...prev };
        delete next[id];
        return next;
      });
    } catch {
      setMessage({ type: "error", text: "Unexpected error" });
    }
  }

  // Generate a passcode for a Google Calendar event (creates/updates in Supabase)
  async function activateCalendarEvent(calEvent) {
    setGeneratingFor(calEvent.id);
    const pwd = generatePassword();
    const now = new Date().toISOString();

    try {
      const res = await fetch("/api/admin/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: calEvent.summary,
          description: calEvent.description || "",
          event_date: calEvent.start,
          location: calEvent.location || "",
          event_type: "general",
          star_value: 1,
          event_password: pwd,
          password_generated_at: now,
          google_calendar_id: calEvent.id,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to activate event" });
        return;
      }

      const savedEvent = data.data;
      // Add/update in local events list
      setEvents((prev) => {
        const exists = prev.find((e) => e.id === savedEvent.id);
        if (exists) return prev.map((e) => (e.id === savedEvent.id ? savedEvent : e));
        return [savedEvent, ...prev];
      });
      setActivePasswords((prev) => ({
        ...prev,
        [savedEvent.id]: { password: pwd, generatedAt: now },
      }));
      setMessage({ type: "success", text: `Passcode generated for "${calEvent.summary}"` });
    } catch {
      setMessage({ type: "error", text: "Unexpected error" });
    } finally {
      setGeneratingFor(null);
    }
  }

  // Re-generate password for an existing event
  async function regeneratePassword(eventId) {
    const pwd = generatePassword();
    const now = new Date().toISOString();
    const ev = events.find((e) => e.id === eventId);
    if (!ev) return;

    try {
      const res = await fetch("/api/admin/events", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: eventId,
          title: ev.title,
          description: ev.description || "",
          event_date: ev.event_date,
          location: ev.location || "",
          event_type: ev.event_type || "general",
          star_value: ev.star_value ?? 1,
          event_password: pwd,
          password_generated_at: now,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error || "Failed to regenerate password" });
        return;
      }
      setEvents((prev) => prev.map((e) => (e.id === eventId ? data.data : e)));
      setActivePasswords((prev) => ({
        ...prev,
        [eventId]: { password: pwd, generatedAt: now },
      }));
      setMessage({ type: "success", text: "New passcode generated!" });
    } catch {
      setMessage({ type: "error", text: "Unexpected error" });
    }
  }

  if (loading) return <p className="py-8 text-center text-gray-500">Loading\u2026</p>;

  if (selectedEvent) {
    return (
      <AttendancePanel
        event={selectedEvent}
        members={members}
        onClose={() => setSelectedEvent(null)}
      />
    );
  }

  // Calendar events are already filtered to upcoming by the API — show them all
  const upcomingCalEvents = calendarEvents;

  return (
    <div className="flex flex-col gap-6">
      {/* ── Google Calendar Events Section ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-lg font-bold text-[color:var(--byu-blue)]">Google Calendar Events</h3>
          <button
            onClick={loadCalendarEvents}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
        <p className="text-sm text-gray-500 mb-3">
          Generate a check-in passcode for any upcoming event. The passcode expires after 5 minutes.
        </p>

        {loadingCalendar ? (
          <p className="text-sm text-gray-400">Loading calendar events\u2026</p>
        ) : upcomingCalEvents.length === 0 ? (
          <p className="text-sm text-gray-500">No upcoming calendar events found.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {upcomingCalEvents.map((ce) => {
              const linkedEvent = events.find((e) => e.google_calendar_id === ce.id);
              const activePassword = linkedEvent ? activePasswords[linkedEvent.id] : null;
              const isActive = activePassword && (Date.now() - new Date(activePassword.generatedAt).getTime()) < PASSWORD_DURATION_MS;

              return (
                <li
                  key={ce.id}
                  className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-900 truncate">{ce.summary}</p>
                      <p className="text-sm text-gray-500">
                        {new Date(ce.start).toLocaleString("en-US", {
                          weekday: "short", month: "short", day: "numeric",
                          hour: "numeric", minute: "2-digit", timeZone: "America/Denver",
                        })}
                        {ce.location && ` · ${ce.location}`}
                      </p>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        {ce.type && (
                          <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                            ce.type === "Speaker Event" ? "bg-blue-100 text-blue-700" :
                            ce.type === "AI Bootcamp" ? "bg-purple-100 text-purple-700" :
                            ce.type === "Social" ? "bg-green-100 text-green-700" :
                            ce.type === "Hackathon" ? "bg-orange-100 text-orange-700" :
                            "bg-gray-100 text-gray-600"
                          }`}>
                            {ce.type}
                          </span>
                        )}
                        {ce.affiliation && (
                          <span className="text-xs text-gray-500">({ce.affiliation})</span>
                        )}
                      </div>
                      {ce.description && (
                        <p className="text-xs text-gray-400 mt-1 line-clamp-2">{ce.description}</p>
                      )}

                      {/* Inline attendee preview for linked events */}
                      {linkedEvent && <AttendeePreview eventId={linkedEvent.id} />}

                      {/* Active password display with countdown */}
                      {isActive && linkedEvent && (
                        <div className="mt-3">
                          <PasswordTimer
                            generatedAt={activePassword.generatedAt}
                            password={activePassword.password}
                            onExpired={() => {
                              setActivePasswords((prev) => {
                                const next = { ...prev };
                                delete next[linkedEvent.id];
                                return next;
                              });
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex shrink-0 gap-2">
                      {isActive && linkedEvent ? (
                        <>
                          <button
                            onClick={() => {
                              navigator.clipboard.writeText(activePassword.password);
                              setMessage({ type: "success", text: `Passcode "${activePassword.password}" copied!` });
                            }}
                            className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100"
                          >
                            Copy
                          </button>
                          <button
                            onClick={() => regeneratePassword(linkedEvent.id)}
                            className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                          >
                            New Code
                          </button>
                          <button
                            onClick={() => setSelectedEvent(linkedEvent)}
                            className="rounded-lg border border-[color:var(--byu-blue)] px-3 py-1.5 text-xs font-semibold text-[color:var(--byu-blue)] hover:bg-[color:var(--byu-blue)]/5"
                          >
                            Attendance
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => activateCalendarEvent(ce)}
                            disabled={generatingFor === ce.id}
                            className="rounded-lg bg-[color:var(--byu-blue)] px-4 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-50"
                          >
                            {generatingFor === ce.id ? "Generating\u2026" : "Generate Passcode"}
                          </button>
                          {linkedEvent && (
                            <button
                              onClick={() => setSelectedEvent(linkedEvent)}
                              className="rounded-lg border border-[color:var(--byu-blue)] px-3 py-1.5 text-xs font-semibold text-[color:var(--byu-blue)] hover:bg-[color:var(--byu-blue)]/5"
                            >
                              Attendance
                            </button>
                          )}
                        </>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      {/* ── Divider ── */}
      <hr className="border-gray-200" />

      {/* ── Manual Events Section ── */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[color:var(--byu-blue)]">Manual Events & Attendance</h3>
        {!showForm && (
          <button
            onClick={() => { setEditingEvent(null); setShowForm(true); }}
            className="rounded-lg bg-[color:var(--byu-blue)] px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
          >
            + New Event
          </button>
        )}
      </div>

      {message && (
        <p className={`text-sm font-medium ${message.type === "error" ? "text-red-600" : "text-green-600"}`}>
          {message.text}
        </p>
      )}

      {showForm && (
        <section className="rounded-xl border border-gray-200 bg-gray-50 p-5">
          <h4 className="mb-4 font-semibold text-gray-800">
            {editingEvent ? "Edit Event" : "Create New Event"}
          </h4>
          <EventForm
            initial={editingEvent}
            onSave={(saved) => {
              if (editingEvent) {
                setEvents((prev) => prev.map((e) => (e.id === saved.id ? saved : e)));
              } else {
                setEvents((prev) => [saved, ...prev]);
              }
              setShowForm(false);
              setEditingEvent(null);
              setMessage({ type: "success", text: editingEvent ? "Event updated" : "Event created" });
            }}
            onCancel={() => { setShowForm(false); setEditingEvent(null); }}
          />
        </section>
      )}

      {events.length === 0 ? (
        <p className="text-gray-500">No events yet. Create one or generate a passcode from Google Calendar above.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((event) => {
            const ap = activePasswords[event.id];
            const isActive = ap && (Date.now() - new Date(ap.generatedAt).getTime()) < PASSWORD_DURATION_MS;

            return (
              <li
                key={event.id}
                className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-900 truncate">{event.title}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(event.event_date).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Denver" })}
                      {event.location && ` · ${event.location}`}
                    </p>
                    <div className="mt-1 flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                        {event.event_type}
                      </span>
                      <span className="text-xs text-gray-500">{event.star_value} stars</span>
                      {event.google_calendar_id && (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-600">
                          Google Calendar
                        </span>
                      )}
                    </div>

                    {/* Inline attendee preview */}
                    <AttendeePreview eventId={event.id} />

                    {/* Active password timer */}
                    {isActive && (
                      <div className="mt-2">
                        <PasswordTimer
                          generatedAt={ap.generatedAt}
                          password={ap.password}
                          onExpired={() => {
                            setActivePasswords((prev) => {
                              const next = { ...prev };
                              delete next[event.id];
                              return next;
                            });
                          }}
                        />
                      </div>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-2">
                    {isActive ? (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(ap.password);
                          setMessage({ type: "success", text: `Passcode "${ap.password}" copied!` });
                        }}
                        className="rounded-lg border border-green-200 bg-green-50 px-3 py-1.5 text-xs font-semibold text-green-700 hover:bg-green-100"
                      >
                        Copy
                      </button>
                    ) : (
                      <button
                        onClick={() => regeneratePassword(event.id)}
                        className="rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100"
                      >
                        Generate Passcode
                      </button>
                    )}
                    <button
                      onClick={() => setSelectedEvent(event)}
                      className="rounded-lg border border-[color:var(--byu-blue)] px-3 py-1.5 text-xs font-semibold text-[color:var(--byu-blue)] hover:bg-[color:var(--byu-blue)]/5"
                    >
                      Attendance
                    </button>
                    {!event.google_calendar_id && (
                      <>
                        <button
                          onClick={() => { setEditingEvent(event); setShowForm(true); }}
                          className="rounded-lg border border-gray-200 px-3 py-1.5 text-xs font-semibold text-gray-600 hover:bg-gray-50"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteEvent(event.id)}
                          className="rounded-lg border border-red-200 px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
