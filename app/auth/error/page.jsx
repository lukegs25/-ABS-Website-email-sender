"use client";

import { Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

function AuthErrorContent() {
  const searchParams = useSearchParams();
  const message = searchParams.get("message") || "An error occurred during sign-in.";

  return (
    <div className="flex flex-col gap-6 p-8">
      <h1 className="text-2xl font-bold text-red-600">Sign-in Error</h1>
      <p className="text-gray-600">{message}</p>
      <Link
        href="/login"
        className="inline-flex w-fit rounded-md bg-[color:var(--byu-blue)] px-4 py-2 text-white hover:opacity-90"
      >
        Try again
      </Link>
      <Link href="/" className="text-sm text-gray-500 underline">
        ← Back to home
      </Link>
    </div>
  );
}

export default function AuthErrorPage() {
  return (
    <Suspense fallback={
      <div className="flex flex-col gap-6 p-8">
        <h1 className="text-2xl font-bold text-red-600">Sign-in Error</h1>
        <p className="text-gray-600">Loading...</p>
      </div>
    }>
      <AuthErrorContent />
    </Suspense>
  );
}
