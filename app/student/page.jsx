import SignupForm from "@/components/forms/SignupForm";
import { createClient } from "@/utils/supabase/client";

export default function StudentPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Student Signup</h1>
      <p className="mt-2 text-gray-600">Join the main email and subgroups you care about.</p>
      <SignupForm role="student" supabase={createClient()} />
    </div>
  );
}


