"use client";

import { useState, useEffect } from "react";

export default function UpcomingEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/calendar/events?days=7")
      .then((r) => r.json())
      .then((data) => {
        if (data.events) setEvents(data.events);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (e) => {
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

  if (loading) {
    return (
      <section className="relative z-10 mt-16 py-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-[color:var(--byu-blue)] mb-4">Upcoming Events</h2>
        <p className="text-gray-500">Loading…</p>
      </section>
    );
  }

  if (events.length === 0) {
    return (
      <section className="relative z-10 mt-16 py-8 border-t border-gray-200">
        <h2 className="text-2xl font-bold text-[color:var(--byu-blue)] mb-4">Upcoming Events</h2>
        <p className="text-gray-600">No upcoming events this week.</p>
        <a
          href="https://calendar.google.com/calendar/embed?src=c240123c3faa5646577759508b44ade28fc0856486fa89ce91a7e69824214aef%40group.calendar.google.com&ctz=America%2FDenver"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-[color:var(--byu-blue)] underline hover:no-underline"
        >
          View full Google Calendar →
        </a>
      </section>
    );
  }

  return (
    <section className="relative z-10 mt-16 py-8 border-t border-gray-200">
      <h2 className="text-2xl font-bold text-[color:var(--byu-blue)] mb-4">Upcoming Events</h2>
      <ul className="space-y-3">
        {events.map((e) => (
          <li
            key={e.id}
            className="flex flex-wrap items-center gap-2 py-3 px-4 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm"
          >
            <span className="text-sm font-medium text-gray-600 min-w-[140px]">{formatDate(e)}</span>
            <span className="font-semibold text-gray-900">{e.summary}</span>
            {e.location && <span className="text-sm text-gray-500">• {e.location}</span>}
            {e.htmlLink && (
              <a
                href={e.htmlLink}
                target="_blank"
                rel="noreferrer"
                className="ml-auto text-sm text-[color:var(--byu-blue)] underline hover:no-underline"
              >
                Add to calendar
              </a>
            )}
          </li>
        ))}
      </ul>
      <a
        href="https://calendar.google.com/calendar/embed?src=c240123c3faa5646577759508b44ade28fc0856486fa89ce91a7e69824214aef%40group.calendar.google.com&ctz=America%2FDenver"
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-block text-[color:var(--byu-blue)] underline hover:no-underline text-sm"
      >
        View full Google Calendar →
      </a>
    </section>
  );
}
