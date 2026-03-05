import PostJobForm from "@/components/forms/PostJobForm";

export default function PostJobPage() {
  return (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <h1 className="text-2xl font-bold text-[color:var(--byu-blue)]">
          Post a Job
        </h1>
        <p className="mt-2 text-gray-600">
          Submit a job posting for approval and inclusion on the board.
        </p>
      </div>
      <PostJobForm />
    </div>
  );
}
