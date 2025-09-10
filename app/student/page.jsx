import StudentForm from "@/components/forms/StudentForm";

export default function StudentPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Student Signup</h1>
      <p className="mt-2 text-gray-600">Join the main email and subgroups you care about.</p>
      <StudentForm />
    </div>
  );
}


