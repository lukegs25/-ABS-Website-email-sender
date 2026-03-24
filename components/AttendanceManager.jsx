"use client";

import { useState, useEffect, useCallback } from "react";

const EVENT_TYPES = ["general", "bootcamp", "speaker", "workshop", "social"];

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

  function generatePassword() {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let pwd = "";
    for (let i = 0; i < 6; i++) pwd += chars[Math.floor(Math.random() * chars.length)];
    setForm({ ...form, event_password: pwd });
  }
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
          <label className="mb-1 block text-sm font-medium text-gray-700">
            Stars Awarded ⭐
          </label>
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

      {/* Event Password for self-service check-in */}
      <div>
        <label className="mb-1 block text-sm font-medium text-gray-700">
          Check-In Password
        </label>
        <div className="flex gap-2">
          <input
            type="text"
            value={form.event_password}
            onChange={(e) => setForm({ ...form, event_password: e.target.value.toUpperCase() })}
            placeholder="e.g. ABS123"
            className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm font-mono tracking-wider focus:border-[color:var(--byu-blue)] focus:outline-none focus:ring-1 focus:ring-[color:var(--byu-blue)]"
          />
          <button
            type="button"
            onClick={generatePassword}
            className="shrink-0 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-600 hover:bg-gray-50"
          >
            Generate
          </button>
        </div>
        <p className="mt-1 text-xs text-gray-400">
          Announce this password at the end of the meeting. Members enter it at /checkin to mark attendance.
        </p>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-[color:var(--byu-blue)] px-5 py-2 text-sm font-semibold text-white hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Saving…" : initial?.id ? "Update Event" : "Create Event"}
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
    if (!confirm("Remove this member's attendance and associated stars?")) return;
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
            {new Date(event.event_date).toLocaleString()} · {event.star_value} ⭐ per attendee
          </p>
        </div>
        <button
          onClick={onClose}
          className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-50"
        >
          ← Back
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
            <option value="">Select a member…</option>
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
          {checkingIn ? "Checking in…" : "Check In"}
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
          <p className="text-sm text-gray-400">Loading…</p>
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

export default function AttendanceManager() {
  const [events, setEvents] = useState([]);
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [message, setMessage] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

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
    } catch {
      setMessage({ type: "error", text: "Unexpected error" });
    }
  }

  if (loading) return <p className="py-8 text-center text-gray-500">Loading…</p>;

  if (selectedEvent) {
    return (
      <AttendancePanel
        event={selectedEvent}
        members={members}
        onClose={() => setSelectedEvent(null)}
      />
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-bold text-[color:var(--byu-blue)]">Events & Attendance</h3>
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
        <p className="text-gray-500">No events yet. Create one to get started.</p>
      ) : (
        <ul className="flex flex-col gap-3">
          {events.map((event) => (
            <li
              key={event.id}
              className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{event.title}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(event.event_date).toLocaleString()}
                    {event.location && ` · ${event.location}`}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-600">
                      {event.event_type}
                    </span>
                    <span className="text-xs text-gray-500">⭐ {event.star_value} stars</span>
                    {event.event_password && (
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(event.event_password);
                          setMessage({ type: "success", text: `Password "${event.event_password}" copied!` });
                        }}
                        className="rounded-full bg-blue-50 px-2 py-0.5 text-xs font-mono font-medium text-blue-700 hover:bg-blue-100"
                        title="Click to copy password"
                      >
                        🔑 {event.event_password}
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex shrink-0 gap-2">
                  <button
                    onClick={() => setSelectedEvent(event)}
                    className="rounded-lg border border-[color:var(--byu-blue)] px-3 py-1.5 text-xs font-semibold text-[color:var(--byu-blue)] hover:bg-[color:var(--byu-blue)]/5"
                  >
                    Attendance
                  </button>
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
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
