import TeacherForm from "@/components/forms/TeacherForm";

export default function TeacherPage() {
  return (
    <div>
      <h1 className="text-3xl font-bold">Teacher Signup</h1>
      <p className="mt-2 text-gray-600">Subscribe and optionally request Student Consultants on AI.</p>
      <TeacherForm />
    </div>
  );
}


