"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { Instagram, Linkedin, Globe, CalendarCheck, Users, Briefcase, Calendar } from "lucide-react";
import { motion } from "motion/react";
import CalendarSection from "@/components/CalendarSection";
import JobBoard from "@/components/JobBoard";
import StarUsers from "@/components/StarUsers";
import LinkedInSignIn from "@/components/LinkedInSignIn";

function StatsRow() {
  const [stats, setStats] = useState({ members: 0, events: 0, jobs: 0 });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    Promise.all([
      fetch("/api/star-users").then((r) => r.json()).catch(() => []),
      fetch("/api/calendar/sheet?days=90").then((r) => r.json()).catch(() => ({ events: [] })),
      fetch("/api/jobs").then((r) => r.json()).catch(() => []),
    ]).then(([users, cal, jobs]) => {
      setStats({
        members: Array.isArray(users) ? users.length : 0,
        events: cal?.events?.length || 0,
        jobs: Array.isArray(jobs) ? jobs.length : 0,
      });
      setLoaded(true);
    });
  }, []);

  const items = [
    { icon: Users, label: "On the Leaderboard", value: stats.members },
    { icon: Calendar, label: "Upcoming Events", value: stats.events },
    { icon: Briefcase, label: "Open Positions", value: stats.jobs },
  ];

  return (
    <div className="grid grid-cols-3 gap-3 sm:gap-4">
      {items.map(({ icon: Icon, label, value }) => (
        <div
          key={label}
          className="flex flex-col items-center gap-1 rounded-xl border border-gray-200/80 bg-white/70 backdrop-blur-sm px-3 py-4 shadow-sm"
        >
          <Icon size={18} className="text-[color:var(--byu-blue)]/60" />
          <span className={`text-2xl font-bold tabular-nums text-[color:var(--byu-blue)] ${!loaded ? "animate-pulse" : ""}`}>
            {loaded ? value : "—"}
          </span>
          <span className="text-xs text-gray-500 text-center">{label}</span>
        </div>
      ))}
    </div>
  );
}

export default function HomePage() {
  return (
    <div className="relative mx-auto flex w-full max-w-5xl flex-col gap-8 p-4 sm:p-6 md:p-8 md:pl-12 lg:pl-16">
      {/* Chrome dripping hand - top right */}
      <div className="pointer-events-none absolute right-0 top-0 z-0 h-[70vh] w-1/2 min-w-[180px] opacity-50 sm:opacity-75 sm:min-w-[280px] md:min-w-[400px] xl:min-w-[480px]">
        <Image
          src="/shaka_clear.png"
          alt="Chrome dripping hand"
          fill
          priority
          className="object-contain object-right scale-110 xl:scale-100 origin-top-right"
          sizes="50vw"
        />
      </div>

      {/* Hero */}
      <motion.section
        className="relative z-10 flex flex-col gap-6 rounded-2xl bg-gradient-to-br from-white via-blue-50/40 to-white p-6 sm:p-8"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="flex flex-col gap-3">
          <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[color:var(--byu-blue)]/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-[color:var(--byu-blue)]">
            Brigham Young University
          </span>
          <h1 className="text-4xl font-extrabold tracking-tight text-[color:var(--byu-blue)] sm:text-5xl md:text-6xl">
            AI in Business<br className="hidden sm:block" /> Society
          </h1>
          <p className="max-w-md text-base text-gray-600 sm:text-lg">
            Connecting students and faculty with the tools,
            skills, and community to lead in an AI-driven world.
          </p>
        </div>

        {/* Primary CTAs */}
        <div className="flex flex-col gap-3">
          <div className="flex flex-wrap gap-3">
            <a
              href="https://clubs.byu.edu/link/club/18295873491185562"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[color:var(--byu-blue)] px-8 py-3 font-bold uppercase tracking-wide text-white shadow-lg transition-all hover:opacity-90 hover:shadow-xl"
            >
              <Globe size={18} />
              Join the Club/Email List
            </a>
            <Link
              href="/checkin"
              className="inline-flex items-center gap-2 rounded-xl border-2 border-[color:var(--byu-blue)]/20 bg-white px-5 py-3 text-sm font-semibold text-[color:var(--byu-blue)] shadow-sm transition-all hover:border-[color:var(--byu-blue)] hover:shadow-md"
            >
              <CalendarCheck size={16} />
              Check-in at Event
            </Link>
          </div>

          {/* Social links — smaller, secondary */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 mr-1">Follow us</span>
            <a
              href="https://www.instagram.com/abs.byu/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-[color:var(--byu-blue)]"
              aria-label="Instagram"
            >
              <Instagram size={16} />
              <span className="hidden sm:inline">Instagram</span>
            </a>
            <a
              href="https://www.linkedin.com/company/ai-in-business-society/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-[color:var(--byu-blue)]"
              aria-label="LinkedIn"
            >
              <Linkedin size={16} />
              <span className="hidden sm:inline">LinkedIn</span>
            </a>
            <a
              href="https://join.slack.com/t/byuabsleadership/shared_invite/zt-3rvopax86-qQILQC6bJ2XBWWfc84D34A"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium text-gray-500 transition-colors hover:bg-gray-100 hover:text-[color:var(--byu-blue)]"
              aria-label="Slack"
            >
              <span className="hidden sm:inline">Join our club Slack</span>
              <span className="sm:hidden">Slack</span>
            </a>
          </div>
        </div>
      </motion.section>

      {/* Stats row */}
      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.05 }}
      >
        <StatsRow />
      </motion.div>

      {/* Upcoming Event Flyers */}
      <motion.section
        className="relative z-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
      >
        <h2 className="text-2xl font-bold text-[color:var(--byu-blue)] mb-4">
          Upcoming Events
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200/80 bg-white">
            <Image
              src="/rich_lachowsky_720.jpg"
              alt="Rich Lachowsky — Real Estate and AI — April 8, 2026, 7PM, TNRB 251"
              width={720}
              height={900}
              className="w-full h-auto"
            />
          </div>
          <div className="rounded-2xl overflow-hidden shadow-lg border border-gray-200/80 bg-white">
            <Image
              src="/chris_brosseau.png"
              alt="Chris Brosseau — AI Proficiency Certificate — April 15, 2026, 7PM, TNRB 112"
              width={720}
              height={900}
              className="w-full h-auto"
            />
          </div>
        </div>
      </motion.section>

      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.15 }}
      >
        <CalendarSection />
      </motion.div>

      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.25 }}
      >
        <JobBoard />
      </motion.div>

      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.35 }}
      >
        <StarUsers />
      </motion.div>

      {/* Member login — gradient CTA banner */}
      <motion.section
        className="relative z-10 overflow-hidden rounded-2xl bg-gradient-to-r from-[color:var(--byu-blue)] to-blue-800 p-6 sm:p-8 shadow-lg"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.45 }}
      >
        <div className="relative z-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">
              Member Login
            </h2>
            <p className="mt-1 text-blue-100/80 max-w-md">
              Sign in with LinkedIn to build your profile,
              save jobs, and access the member dashboard.
            </p>
          </div>
          <div className="shrink-0">
            <LinkedInSignIn redirectTo="/member" />
          </div>
        </div>
        {/* Decorative circle */}
        <div className="pointer-events-none absolute -right-12 -top-12 h-48 w-48 rounded-full bg-white/5" />
        <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5" />
      </motion.section>
    </div>
  );
}
