"use client";

import { useState, useEffect } from "react";
import { ExternalLink, Crown } from "lucide-react";

export default function PremierJobBoard() {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch("/api/recruiting")
      .then((res) => res.json())
      .then((data) => {
        if (data.jobs) setJobs(data.jobs);
        else if (data.error) setError(data.error);
      })
      .catch(() => setError("Failed to load positions"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-lg bg-gray-100" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        {error}
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border-2 border-dashed border-gray-200 py-12 text-center">
        <Crown size={32} className="mx-auto mb-3 text-amber-500" />
        <p className="font-medium text-gray-600">No premier positions available right now</p>
        <p className="mt-2 text-sm text-gray-500">
          New opportunities are added regularly. Check back soon!
        </p>
      </div>
    );
  }

  return (
    <ul className="space-y-3">
      {jobs.map((job) => (
        <li
          key={job.id}
          className="rounded-xl border border-amber-200 bg-gradient-to-r from-amber-50/50 to-white p-4 shadow-sm"
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex flex-1 flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-gray-900 truncate">
                  {job.title}
                </span>
                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-semibold text-amber-700">
                  PREMIER
                </span>
              </div>
              <span className="text-sm text-gray-500 truncate">
                {job.company}
                {job.location && ` · ${job.location}`}
              </span>
              {job.description && (
                <p className="mt-1 text-xs text-gray-500 line-clamp-2">
                  {job.description}
                </p>
              )}
            </div>
            <a
              href={job.url}
              target="_blank"
              rel="noreferrer"
              className="flex shrink-0 items-center gap-1.5 rounded-lg bg-[color:var(--byu-blue)] px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity"
            >
              Apply
              <ExternalLink size={13} />
            </a>
          </div>
        </li>
      ))}
    </ul>
  );
}
