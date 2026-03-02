import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/utils/supabase/server";
import MemberProfile from "@/components/MemberProfile";

export default async function MemberPage() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="p-8">
        <p className="text-red-600">Auth not configured.</p>
        <Link href="/" className="mt-4 inline-block text-[color:var(--byu-blue)] underline">
          Back to home
        </Link>
      </div>
    );
  }

  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  return (
    <div className="flex flex-col gap-8 p-8">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-[color:var(--byu-blue)]">
          Your Profile
        </h1>
        <form action="/api/auth/signout" method="post">
          <button
            type="submit"
            className="rounded-md border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
          >
            Sign out
          </button>
        </form>
      </div>

      <MemberProfile user={user} profile={profile} />

      <p className="text-sm text-gray-500">
        <Link href="/" className="text-[color:var(--byu-blue)] underline">
          ← Back to home
        </Link>
      </p>
    </div>
  );
}
