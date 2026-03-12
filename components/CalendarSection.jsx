import UpcomingEvents from "./UpcomingEvents";

const GOOGLE_CALENDAR_EMBED_URL =
  "https://calendar.google.com/calendar/embed?src=abs.byu.club%40gmail.com&ctz=America%2FDenver";

export default function CalendarSection() {
  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <h2 className="mb-4 text-xl font-bold text-[color:var(--byu-blue)]">
        Calendar
      </h2>

      <div className="space-y-4">
        <UpcomingEvents />

        <div className="h-[500px] w-full overflow-hidden rounded-lg border border-gray-200">
          <iframe
            src={GOOGLE_CALENDAR_EMBED_URL}
            title="AI in Business Society Google Calendar"
            className="h-full w-full"
            style={{ border: 0 }}
          />
        </div>
      </div>
    </section>
  );
}
