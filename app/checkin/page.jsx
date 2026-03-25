import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import CheckInForm from "@/components/CheckInForm";
import QRCheckInForm from "@/components/QRCheckInForm";

export const metadata = {
  title: "Check In — AI in Business Society",
  description: "Check in to an ABS meeting to earn stars and progress toward your AI Proficiency Certificate.",
};

export default async function CheckInPage({ searchParams }) {
  const params = await searchParams;
  const eventId = params?.event;
  const code = params?.code;

  // QR code flow: no auth required, just show email form
  if (eventId && code) {
    return (
      <div className="flex flex-col gap-6 p-4 sm:p-6 md:p-8">
        <QRCheckInForm initialEventId={eventId} initialCode={code} />
      </div>
    );
  }

  // Existing password-based flow: require auth
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
