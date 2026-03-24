import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import CheckInForm from "@/components/CheckInForm";

export const metadata = {
  title: "Check In — AI in Business Society",
  description: "Check in to an ABS meeting to earn stars and progress toward your AI Proficiency Certificate.",
};

export default async function CheckInPage() {
  const supabase = await createClient();
  if (!supabase) {
    return (
      <div className="p-8">
        <p className="text-red-600">Auth not configured.</p>
      </div>
    );
  }

  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    redirect("/login?next=/checkin");
  }

  return (
    <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
      <CheckInForm />
    </div>
  );
}
