import Link from "next/link";
import Image from "next/image";
import { Instagram, Linkedin, Globe } from "lucide-react";
import CalendarSection from "@/components/CalendarSection";
import JobBoard from "@/components/JobBoard";
import StarUsers from "@/components/StarUsers";

export default function HomePage() {
  return (
    <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-8 p-4 sm:p-6 md:p-8">
      {/* Chrome dripping hand - top right */}
      <div className="pointer-events-none absolute right-0 top-0 z-0 h-[70vh] w-1/2 min-w-[180px] sm:min-w-[280px] md:min-w-[400px] xl:min-w-[480px]">
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
          <div className="flex flex-wrap gap-3">
            <a
              href="https://www.instagram.com/abs.byu/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-[color:var(--byu-blue)] shadow-sm transition-colors hover:bg-[color:var(--byu-blue)] hover:text-white"
            >
              <Instagram size={16} />
              Instagram
            </a>
            <a
              href="https://www.linkedin.com/company/ai-in-business-society/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-[color:var(--byu-blue)] shadow-sm transition-colors hover:bg-[color:var(--byu-blue)] hover:text-white"
            >
              <Linkedin size={16} />
              LinkedIn
            </a>
            <a
              href="https://clubs.byu.edu/link/club/18295873491185562"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-[color:var(--byu-blue)] shadow-sm transition-colors hover:bg-[color:var(--byu-blue)] hover:text-white"
            >
              <Globe size={16} />
              Join the Club
            </a>
          </div>
        </div>
      </section>

      <div className="relative z-10">
        <CalendarSection />
      </div>

      <div className="relative z-10">
        <JobBoard />
      </div>

      <div className="relative z-10">
        <StarUsers />
      </div>
    </div>
  );
}
