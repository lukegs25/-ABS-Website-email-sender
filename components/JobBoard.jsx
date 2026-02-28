"use client";

import { useState } from "react";
import Link from "next/link";

export default function JobBoard() {
  const [jobs] = useState([]); // Placeholder - will be populated from scrapers/API
  const [loading] = useState(false); // Placeholder for API loading state

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-4">
        <h2 className="text-xl font-bold text-[color:var(--byu-blue)]">
          Job Board
        </h2>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-500">
            Students: log in to save jobs
          </span>
          <Link
            href="/jobs/post"
            className="rounded-md border border-[color:var(--byu-blue)] bg-white px-4 py-2 text-sm font-medium text-[color:var(--byu-blue)] hover:bg-[color:var(--byu-blue)]/10"
          >
            Post a Job
          </Link>
          <Link
            href="/jobs"
            className="rounded-md bg-[color:var(--byu-blue)] px-4 py-2 text-sm font-medium text-white hover:opacity-90"
          >
            View All Jobs
          </Link>
        </div>
      </div>

      {loading ? (
        <p className="py-8 text-center text-gray-500">Loading jobs…</p>
      ) : jobs.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-200 py-12 text-center">
          <p className="text-gray-600">
            No jobs yet. Jobs will appear here from our scrapers and direct
            postings.
          </p>
          <p className="mt-2 text-sm text-gray-500">
            Add scraper APIs to populate this section.
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => (
            <li
              key={job.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-100 p-4 hover:bg-gray-50"
            >
              <span className="font-semibold text-gray-900">{job.title}</span>
              <span className="text-sm text-gray-500">@ {job.company}</span>
              <a
                href={job.url}
                target="_blank"
                rel="noreferrer"
                className="ml-auto text-sm text-[color:var(--byu-blue)] underline hover:no-underline"
              >
                Apply
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
