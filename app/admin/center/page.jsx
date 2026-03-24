"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import CenterChat from "@/components/CenterChat";

export default function CenterPage() {
  const [authorized, setAuthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // Check admin auth by hitting an admin-protected endpoint
    fetch("/api/admin-login", { method: "GET" })
      .then((res) => {
        if (res.ok) {
          setAuthorized(true);
        } else {
          // If no GET endpoint, check cookie exists client-side
          setAuthorized(document.cookie.includes("admin_auth"));
        }
      })
      .catch(() => {
        setAuthorized(document.cookie.includes("admin_auth"));
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-[color:var(--byu-blue)] border-t-transparent" />
      </div>
    );
  }

  if (!authorized) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 px-4">
        <p className="text-gray-600">You must be logged in as an admin to access the Center.</p>
        <button
          onClick={() => router.push("/admin")}
          className="rounded-lg bg-[color:var(--byu-blue)] px-6 py-2.5 text-sm font-medium text-white hover:opacity-90"
        >
          Go to Admin Login
        </button>
      </div>
    );
  }

  return (
    <div className="p-2 sm:p-4">
      <CenterChat />
    </div>
  );
}
