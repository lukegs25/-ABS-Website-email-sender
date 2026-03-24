import UpcomingEvents from "./UpcomingEvents";

const GOOGLE_CALENDAR_EMBED_URL =
  "https://calendar.google.com/calendar/embed?src=abs.byu.club%40gmail.com&ctz=America%2FDenver&mode=AGENDA&showTitle=0&showPrint=0&showTabs=1&showCalendars=0";

export default function CalendarSection() {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4">
        <h2 className="text-xl font-bold text-[color:var(--byu-blue)]">
          Calendar
        </h2>
        <p className="mt-0.5 text-sm text-gray-500">
          Upcoming meetings, workshops, and events
        </p>
      </div>

      <div className="space-y-4">
        <UpcomingEvents />

        <div className="h-[400px] w-full overflow-hidden rounded-lg border border-gray-200 sm:h-[500px] md:h-[600px]">
          <iframe
            src={GOOGLE_CALENDAR_EMBED_URL}
            title="AI in Business Society Google Calendar"
            loading="lazy"
            className="h-full w-full"
            style={{ border: 0 }}
          />
        </div>
      </div>
    </section>
  );
}
