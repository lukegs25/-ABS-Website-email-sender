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
          <a
            href="https://join.slack.com/t/byuabsleadership/shared_invite/zt-3rvopax86-qQILQC6bJ2XBWWfc84D34A"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm hover:bg-gray-50"
          >
            Join our club Slack
          </a>
        </div>
      </div>
    </div>
  );
}
