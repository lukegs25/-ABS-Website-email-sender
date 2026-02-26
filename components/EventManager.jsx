"use client";

import { useState, useEffect } from "react";

export default function EventManager() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [location, setLocation] = useState("");
  const [startDate, setStartDate] = useState("");
  const [startTime, setStartTime] = useState("");
  const [endDate, setEndDate] = useState("");
  const [endTime, setEndTime] = useState("");
  const [allDay, setAllDay] = useState(false);
  const [saving, setSaving] = useState(false);
  const [result, setResult] = useState(null);
  const [upcoming, setUpcoming] = useState([]);
  const [loading, setLoading] = useState(true);
  const [configError, setConfigError] = useState(false);

  const fetchUpcoming = async () => {
    try {
      const res = await fetch("/api/admin/calendar/events?days=30", { credentials: "include" });
      const data = await res.json();
      if (data.events) setUpcoming(data.events);
      if (data.error && !data.events?.length) setConfigError(true);
    } catch {
      setConfigError(true);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpcoming();
  }, []);

  const toISO = (dateStr, timeStr) => {
    if (!dateStr) return null;
    if (allDay) return `${dateStr}T00:00:00`;
    const time = timeStr || "00:00";
    return `${dateStr}T${time}:00`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setResult(null);
    setSaving(true);

    const start = toISO(startDate, startTime);
    const end = toISO(endDate, endTime) || start;
    if (!start || !end) {
      setResult({ error: "Please set start and end date." });
      setSaving(false);
      return;
    }

    try {
      const res = await fetch("/api/admin/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          summary: title.trim(),
          description: description.trim(),
          location: location.trim(),
          start,
          end,
          allDay,
        }),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        setResult({ success: true, message: "Event created and synced to Google Calendar." });
        setTitle("");
        setDescription("");
        setLocation("");
        setStartDate("");
        setStartTime("");
        setEndDate("");
        setEndTime("");
        fetchUpcoming();
      } else {
        setResult({ error: data.error || "Failed to create event" });
      }
    } catch (err) {
      setResult({ error: "Network error" });
    } finally {
      setSaving(false);
    }
  };

  const formatEventDate = (e) => {
    if (!e.start) return "";
    if (e.allDay) {
      return new Date(e.start + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
    const d = new Date(e.start);
    return d.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  };

  return (
    <div className="max-w-3xl space-y-8">
      <h2 className="text-2xl font-bold text-[color:var(--byu-blue)]">Calendar Events</h2>
      <p className="text-gray-600">
        Create events here to sync them to the AI in Business Society Google Calendar. They will appear on the home page and in Google Calendar.
      </p>

      {configError && (
        <div className="rounded-md bg-amber-50 border border-amber-200 p-4 text-amber-800 text-sm">
          Calendar is not configured. Add <code className="bg-amber-100 px-1 rounded">GOOGLE_SERVICE_ACCOUNT_JSON</code> and{" "}
          <code className="bg-amber-100 px-1 rounded">GOOGLE_CALENDAR_ID</code> to your environment. See{" "}
          <span className="font-medium">GOOGLE_CALENDAR_SETUP.md</span> for instructions.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Event title *</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            placeholder="e.g. AI Bootcamp Session"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Description (optional)</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={3}
            placeholder="Event details..."
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Location (optional)</label>
          <input
            type="text"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            placeholder="e.g. Tanner Building 140"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
          />
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="allDay"
            checked={allDay}
            onChange={(e) => setAllDay(e.target.checked)}
            className="rounded border-gray-300"
          />
          <label htmlFor="allDay" className="text-sm text-gray-700">All-day event</label>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Start *</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
              />
              {!allDay && (
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-28 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
                />
              )}
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">End *</label>
            <div className="flex gap-2">
              <input
                type="date"
                value={endDate || startDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
              />
              {!allDay && (
                <input
                  type="time"
                  value={endTime || startTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-28 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
                />
              )}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2 bg-[color:var(--byu-blue)] text-white rounded-md hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Creating…" : "Create Event & Sync to Google Calendar"}
        </button>

        {result && (
          <div
            className={`p-4 rounded-md ${
              result.error ? "bg-red-50 text-red-700 border border-red-200" : "bg-green-50 text-green-700 border border-green-200"
            }`}
          >
            {result.error || result.message}
          </div>
        )}
      </form>

      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-3">Upcoming events (next 30 days)</h3>
        {loading ? (
          <p className="text-gray-500 text-sm">Loading…</p>
        ) : upcoming.length === 0 ? (
          <p className="text-gray-500 text-sm">No upcoming events.</p>
        ) : (
          <ul className="space-y-2">
            {upcoming.map((e) => (
              <li
                key={e.id}
                className="flex items-start gap-3 py-2 px-3 rounded-md bg-gray-50 border border-gray-100"
              >
                <div className="text-sm text-gray-500 min-w-[140px]">{formatEventDate(e)}</div>
                <div>
                  <span className="font-medium text-gray-900">{e.summary}</span>
                  {e.location && <span className="block text-sm text-gray-500">{e.location}</span>}
                </div>
                {e.htmlLink && (
                  <a
                    href={e.htmlLink}
                    target="_blank"
                    rel="noreferrer"
                    className="ml-auto text-sm text-[color:var(--byu-blue)] hover:underline"
                  >
                    Open in Google
                  </a>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
