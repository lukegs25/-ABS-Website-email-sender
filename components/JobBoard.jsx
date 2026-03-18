"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ExternalLink } from "lucide-react";

function JobSkeleton() {
  return (
    <ul className="space-y-3">
      {[...Array(4)].map((_, i) => (
        <li
          key={i}
          className="flex items-center gap-3 rounded-lg border border-gray-100 p-4"
        >
          <div className="h-4 w-48 animate-pulse rounded bg-gray-200" />
          <div className="h-4 w-24 animate-pulse rounded bg-gray-100" />
          <div className="ml-auto h-4 w-12 animate-pulse rounded bg-gray-100" />
        </li>
      ))}
    </ul>
  );
}

export default function JobBoard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/jobs")
      .then((res) => res.json())
      .then((data) => setJobs(Array.isArray(data) ? data : []))
      .catch(() => setJobs([]))
      .finally(() => setLoading(false));
  }, []);

  return (
    <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
        <div>
          <h2 className="text-xl font-bold text-[color:var(--byu-blue)]">
            Job Board
          </h2>
          <p className="mt-0.5 text-sm text-gray-500">
            AI and business opportunities curated for ABS members
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Link
            href="/jobs/post"
            className="rounded-md border border-[color:var(--byu-blue)] bg-white px-3 py-2 text-sm font-medium text-[color:var(--byu-blue)] hover:bg-[color:var(--byu-blue)]/10 transition-colors"
          >
            Post a Job
          </Link>
          <Link
            href="/jobs"
            className="rounded-md bg-[color:var(--byu-blue)] px-3 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
          >
            View All Jobs
          </Link>
        </div>
      </div>

      {loading ? (
        <JobSkeleton />
      ) : jobs.length === 0 ? (
        <div className="rounded-lg border-2 border-dashed border-gray-200 py-12 text-center">
          <p className="font-medium text-gray-600">No open positions right now</p>
          <p className="mt-2 text-sm text-gray-500">
            Check back soon — new opportunities are added regularly.
          </p>
          <p className="mt-4 text-sm text-gray-500">
            Know of a great role?{" "}
            <Link
              href="/jobs/post"
              className="text-[color:var(--byu-blue)] underline hover:no-underline"
            >
              Post a job
            </Link>
          </p>
        </div>
      ) : (
        <ul className="space-y-3">
          {jobs.map((job) => (
            <li
              key={job.id}
              className="flex flex-wrap items-center gap-2 rounded-lg border border-gray-100 p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex flex-1 flex-col gap-0.5 min-w-0">
                <span className="font-semibold text-gray-900 truncate">
                  {job.title}
                </span>
                <span className="text-sm text-gray-500 truncate">
                  {job.company}
                </span>
              </div>
              <a
                href={job.url}
                target="_blank"
                rel="noreferrer"
                className="ml-auto flex items-center gap-1.5 rounded-md bg-[color:var(--byu-blue)] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90 transition-opacity"
              >
                Apply
                <ExternalLink size={13} />
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
