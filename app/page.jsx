"use client";

import Link from "next/link";
import Image from "next/image";
import { Instagram, Linkedin, Globe } from "lucide-react";
import { motion } from "motion/react";
import CalendarSection from "@/components/CalendarSection";
import JobBoard from "@/components/JobBoard";
import StarUsers from "@/components/StarUsers";
import LinkedInSignIn from "@/components/LinkedInSignIn";

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
          className="object-contain object-right opacity-75 scale-110 xl:scale-100 origin-top-right"
          sizes="50vw"
        />
      </div>

      {/* Hero */}
      <motion.section
        className="relative z-10 flex flex-col gap-6"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
      >
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-extrabold tracking-tight text-[color:var(--byu-blue)] sm:text-5xl md:text-6xl">
            AI in Business<br className="hidden sm:block" /> Society
          </h1>
          <p className="max-w-md text-base text-gray-600 sm:text-lg">
            BYU&apos;s club connecting students and faculty with the tools,
            skills, and community to lead in an AI-driven world.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <a
            href="https://clubs.byu.edu/link/club/18295873491185562"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-[color:var(--byu-blue)] px-8 py-3 font-bold uppercase tracking-wide text-white shadow-lg transition-opacity hover:opacity-90"
          >
            <Globe size={18} />
            Join the Club
          </a>
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
        </div>
      </motion.section>

      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.1 }}
      >
        <CalendarSection />
      </motion.div>

      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.2 }}
      >
        <JobBoard />
      </motion.div>

      <motion.div
        className="relative z-10"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.3 }}
      >
        <StarUsers />
      </motion.div>

      {/* Member login — standalone card */}
      <motion.section
        className="relative z-10 rounded-xl border border-gray-200 bg-white p-6 shadow-sm"
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut", delay: 0.4 }}
      >
        <h2 className="text-xl font-bold text-[color:var(--byu-blue)]">
          Member Login
        </h2>
        <p className="mt-2 text-gray-600">
          Sign in with your LinkedIn account to build your member profile,
          save jobs, and access the member dashboard.
        </p>
        <div className="mt-4">
          <LinkedInSignIn redirectTo="/member" />
        </div>
      </motion.section>
    </div>
  );
}
