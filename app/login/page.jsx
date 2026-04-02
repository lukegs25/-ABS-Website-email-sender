import LinkedInSignIn from "@/components/LinkedInSignIn";
import GitHubSignIn from "@/components/GitHubSignIn";

export default function LoginPage() {
  return (
    <div className="flex flex-col gap-8 p-8">
      <div>
        <h1 className="text-2xl font-bold text-[color:var(--byu-blue)]">
          Member Login
        </h1>
        <p className="mt-2 text-gray-600">
          Sign in to build your member profile and access the dashboard.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="flex flex-col gap-3">
          <LinkedInSignIn redirectTo="/member" />
          <GitHubSignIn redirectTo="/member" />
        </div>
      </div>
    </div>
  );
}
