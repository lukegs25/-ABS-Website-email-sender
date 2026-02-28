import Link from "next/link";
import Image from "next/image";
import CalendarSection from "@/components/CalendarSection";
import JobBoard from "@/components/JobBoard";

export default function HomePage() {
  return (
    <div className="relative flex flex-col gap-8 p-8">
      {/* Chrome dripping hand - top right */}
      <div className="pointer-events-none absolute right-0 top-0 z-0 h-[70vh] w-1/2 min-w-[400px] md:min-w-[480px] xl:min-w-[560px]">
        <Image
          src="/shaka_clear.png"
          alt="Chrome dripping hand"
          fill
          priority
          className="object-contain object-right opacity-90 scale-110 xl:scale-100 origin-top-right"
          sizes="50vw"
        />
      </div>

      <section className="relative z-10 flex flex-col gap-6">
        <h1 className="text-3xl font-extrabold tracking-tight text-[color:var(--byu-blue)]">
          AI in Business Society
        </h1>
        <div className="flex flex-wrap gap-4">
          <Link
            href="/student"
            className="inline-flex items-center justify-center rounded-xl bg-[color:var(--byu-blue)] px-8 py-3 font-bold uppercase tracking-wide text-white shadow-lg transition-opacity hover:opacity-90"
          >
            Student Join
          </Link>
          <Link
            href="/teacher"
            className="inline-flex items-center justify-center rounded-xl bg-[color:var(--byu-blue)] px-8 py-3 font-bold uppercase tracking-wide text-white shadow-lg transition-opacity hover:opacity-90"
          >
            Teacher Join
          </Link>
        </div>
        <div className="flex flex-col gap-2">
          <Link
            href="/student"
            className="inline-flex w-fit items-center justify-center rounded-xl border-2 border-[color:var(--byu-blue)] bg-white px-14 py-5 text-xl font-bold text-[color:var(--byu-blue)] transition-colors hover:bg-[color:var(--byu-blue)] hover:text-white"
          >
            Fill out the survey
          </Link>
          <p className="max-w-xl text-gray-600">
            This survey will change the face of the Marriott School and contribute to changing our curriculum to be more AI job-in-field focused.
          </p>
        </div>
      </section>

      <div className="relative z-10">
        <CalendarSection />
      </div>

      <div className="relative z-10">
        <JobBoard />
      </div>
    </div>
  );
}
