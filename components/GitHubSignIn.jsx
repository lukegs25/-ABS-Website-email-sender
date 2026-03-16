"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function GitHubSignIn({ redirectTo = "/member" }) {
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
        provider: "github",
        options: {
          redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(redirectTo)}`,
        },
      });
      if (error) {
        console.error("GitHub sign-in error:", error);
        alert(error.message || "Sign in failed");
        return;
      }
    } catch (err) {
      console.error("GitHub sign-in error:", err);
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
      className="inline-flex items-center justify-center gap-2 rounded-lg bg-[#24292e] px-6 py-3 font-semibold text-white transition-colors hover:bg-[#0d1117] disabled:opacity-60"
    >
      <svg
        className="h-5 w-5"
        fill="currentColor"
        viewBox="0 0 24 24"
        aria-hidden="true"
      >
        <path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M12 0C5.37 0 0 5.37 0 12c0 5.303 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61-.546-1.385-1.333-1.754-1.333-1.754-1.089-.745.083-.729.083-.729 1.205.084 1.84 1.237 1.84 1.237 1.07 1.834 2.807 1.304 3.492.997.108-.775.418-1.305.762-1.605-2.665-.3-5.467-1.332-5.467-5.93 0-1.31.468-2.381 1.235-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23a11.52 11.52 0 0 1 3.003-.404c1.02.005 2.047.138 3.006.404 2.29-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.233 1.911 1.233 3.221 0 4.61-2.807 5.625-5.479 5.921.43.372.823 1.102.823 2.222 0 1.606-.015 2.898-.015 3.293 0 .322.216.694.825.576C20.565 21.796 24 17.3 24 12c0-6.63-5.37-12-12-12z"
        />
      </svg>
      {loading ? "Signing in…" : "Sign in with GitHub"}
    </button>
  );
}
