import Link from "next/link";
import JobBoard from "@/components/JobBoard";

export default function JobsPage() {
  return (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <h1 className="text-2xl font-bold text-[color:var(--byu-blue)]">
          Job Board
        </h1>
        <p className="mt-2 text-gray-600">
          Browse jobs posted by companies and aggregated from our scrapers.
          Students can log in to save and track jobs.
        </p>
      </div>
      <JobBoard />
    </div>
  );
}
