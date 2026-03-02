"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function LinkedInSignIn({ redirectTo = "/member" }) {
  const [loading, setLoading] = useState(false);

  async function handleSignIn() {
    setLoading(true);
    try {
      const supabase = createClient();
      if (!supabase) {
        alert("Auth not configured. Check Supabase settings.");
        return;
      }
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "linkedin_oidc",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (error) {
        console.error("LinkedIn sign-in error:", error);
        alert(error.message || "Sign in failed");
        return;
      }
      // Supabase redirects to LinkedIn, so we never reach here on success
    } catch (err) {
      console.error("LinkedIn sign-in error:", err);
      alert("Sign in failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={handleSignIn}
      disabled={loading}
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#0A66C2] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#004182] disabled:opacity-60"
    >
      <svg
        className="h-5 w-5"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
      {loading ? "Signing in…" : "Sign in with LinkedIn"}
    </button>
  );
}
