"use client";

import { useState } from "react";
import UpcomingEvents from "./UpcomingEvents";

const GOOGLE_CALENDAR_EMBED_URL =
  "https://calendar.google.com/calendar/embed?src=c240123c3faa5646577759508b44ade28fc0856486fa89ce91a7e69824214aef%40group.calendar.google.com&ctz=America%2FDenver";

export default function CalendarSection() {
  const [showEmbed, setShowEmbed] = useState(false);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-[color:var(--byu-blue)]">
        Calendar
      </h2>

      <div className="space-y-4">
        <UpcomingEvents />

        <div>
          <button
            type="button"
            onClick={() => setShowEmbed(!showEmbed)}
            className="text-sm text-[color:var(--byu-blue)] underline hover:no-underline"
          >
            {showEmbed ? "Hide" : "Show"} full Google Calendar
          </button>
          {showEmbed && (
            <div className="mt-3 h-[400px] w-full overflow-hidden rounded-lg border border-gray-200">
              <iframe
                src={GOOGLE_CALENDAR_EMBED_URL}
                title="AI in Business Society Google Calendar"
                className="h-full w-full"
                frameBorder="0"
                scrolling="no"
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
