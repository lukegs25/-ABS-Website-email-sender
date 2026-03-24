"use client";

import { useState, useEffect } from "react";

const TYPE_COLORS = {
  "Speaker Event": "bg-blue-100 text-blue-700",
  "AI Bootcamp": "bg-purple-100 text-purple-700",
  "Social": "bg-green-100 text-green-700",
  "Hackathon": "bg-orange-100 text-orange-700",
};

export default function UpcomingEvents() {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Fetch from Google Sheet (primary source)
    fetch("/api/calendar/sheet?days=30")
      .then((r) => r.json())
      .then((data) => {
        if (data.events?.length > 0) {
          setEvents(data.events);
        } else {
          // Fallback to Google Calendar API if sheet returns empty
          return fetch("/api/calendar/events?days=14")
            .then((r) => r.json())
            .then((calData) => {
              if (calData.events) setEvents(calData.events);
            });
        }
      })
      .catch(() => {
        // Final fallback: try calendar API
        fetch("/api/calendar/events?days=14")
          .then((r) => r.json())
          .then((data) => {
            if (data.events) setEvents(data.events);
          })
          .catch(() => {});
      })
      .finally(() => setLoading(false));
  }, []);

  const formatDate = (e) => {
    const start = e.start;
    if (!start) return "";
    if (e.allDay) {
      return new Date(start + "T12:00:00").toLocaleDateString("en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      });
    }
    const d = new Date(start);
    return d.toLocaleString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
      timeZone: "America/Denver",
    });
  };

  if (loading) {
    return (
      <div>
        <h3 className="mb-3 text-lg font-semibold text-[color:var(--byu-blue)]">Upcoming Events</h3>
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-16 animate-pulse rounded-lg bg-gray-100" />
          ))}
        </div>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div>
        <h3 className="mb-3 text-lg font-semibold text-[color:var(--byu-blue)]">Upcoming Events</h3>
        <p className="text-gray-600">No upcoming events scheduled.</p>
        <a
          href="https://calendar.google.com/calendar/embed?src=abs.byu.club%40gmail.com&ctz=America%2FDenver"
          target="_blank"
          rel="noreferrer"
          className="mt-3 inline-block text-[color:var(--byu-blue)] underline hover:no-underline"
        >
          View full Google Calendar →
        </a>
      </div>
    );
  }

  return (
    <div>
      <h3 className="mb-3 text-lg font-semibold text-[color:var(--byu-blue)]">Upcoming Events</h3>
      <ul className="space-y-3">
        {events.map((e) => (
          <li
            key={e.id}
            className="flex flex-wrap items-center gap-2 py-3 px-4 rounded-lg bg-white/80 backdrop-blur-sm border border-gray-100 shadow-sm"
          >
            <span className="text-sm font-medium text-gray-600 min-w-[160px]">
              {formatDate(e)}
            </span>
            <span className="font-semibold text-gray-900">{e.summary}</span>
            {e.type && TYPE_COLORS[e.type] && (
              <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${TYPE_COLORS[e.type]}`}>
                {e.type}
              </span>
            )}
            {e.affiliation && (
              <span className="text-xs text-gray-500">({e.affiliation})</span>
            )}
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
        href="https://calendar.google.com/calendar/embed?src=abs.byu.club%40gmail.com&ctz=America%2FDenver"
        target="_blank"
        rel="noreferrer"
        className="mt-4 inline-block text-[color:var(--byu-blue)] underline hover:no-underline text-sm"
      >
        View full Google Calendar →
      </a>
    </div>
  );
}
