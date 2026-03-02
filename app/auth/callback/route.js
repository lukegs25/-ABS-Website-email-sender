import { NextResponse } from "next/server";
import { createClient } from "@/utils/supabase/server";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") ?? "/member";

  if (!code) {
    return NextResponse.redirect(
      new URL("/auth/error?message=Missing+code", request.url)
    );
  }

  const supabase = await createClient();
  if (!supabase) {
    return NextResponse.redirect(
      new URL("/auth/error?message=Server+config+error", request.url)
    );
  }

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("[auth/callback] exchangeCodeForSession error:", error);
    return NextResponse.redirect(
      new URL(`/auth/error?message=${encodeURIComponent(error.message)}`, request.url)
    );
  }

  const redirectTo =
    next.startsWith("/") && !next.startsWith("//")
      ? next
      : "/member";

  return NextResponse.redirect(
    new URL(redirectTo, request.url)
  );
}
