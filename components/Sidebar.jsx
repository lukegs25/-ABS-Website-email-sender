"use client";

import Link from "next/link";
import Image from "next/image";

export default function Sidebar() {
  return (
    <aside className="fixed left-0 top-0 z-50 flex h-screen w-52 flex-col border-r border-gray-200 bg-white">
      <Link href="/" className="border-b border-gray-100 p-4">
        <Image
          src="/logo.png"
          alt="AI in Business Society"
          width={640}
          height={160}
          className="h-12 w-auto object-contain"
        />
      </Link>
      <nav className="flex flex-1 flex-col gap-1 p-4 text-sm">
        <Link href="/" className="rounded-lg px-3 py-2 hover:bg-gray-100">
          Home
        </Link>
        <Link href="/student" className="rounded-lg px-3 py-2 hover:bg-gray-100">
          Student
        </Link>
        <Link href="/teacher" className="rounded-lg px-3 py-2 hover:bg-gray-100">
          Teacher
        </Link>
        <Link href="/jobs" className="rounded-lg px-3 py-2 hover:bg-gray-100">
          Jobs
        </Link>
        <Link href="/admin" className="rounded-lg px-3 py-2 hover:bg-gray-100">
          Admin
        </Link>
      </nav>
    </aside>
  );
}
