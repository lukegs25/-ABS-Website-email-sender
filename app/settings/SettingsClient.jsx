"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/utils/supabase/client";
import { exampleMajors } from "@/lib/constants";
import { Github, Linkedin, Star, Calendar, User, Link2, GitBranch, CheckSquare } from "lucide-react";

export default function SettingsClient({
  user,
  profile: initialProfile,
  stars,
  totalStars,
  currentTier,
  eventsAttended,
  attendanceRecords,
}) {
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [profile, setProfile] = useState({
    display_name: initialProfile?.display_name || user?.user_metadata?.full_name || user?.user_metadata?.name || "",
    bio: initialProfile?.bio || "",
    major: initialProfile?.major || "",
    expected_graduation: initialProfile?.expected_graduation || "",
    github_username: initialProfile?.github_username || "",
    linkedin_url: initialProfile?.linkedin_url || "",
  });

  const [githubRepos, setGithubRepos] = useState([]);
  const [featuredRepos, setFeaturedRepos] = useState([]);
  const [loadingRepos, setLoadingRepos] = useState(false);
  const [repoError, setRepoError] = useState("");
  const [manualRepo, setManualRepo] = useState({ repo_name: "", repo_url: "", description: "", language: "" });
  const [addingManual, setAddingManual] = useState(false);

  const [linkedIdentities, setLinkedIdentities] = useState([]);
  const [linkingGithub, setLinkingGithub] = useState(false);
  const [linkingLinkedin, setLinkingLinkedin] = useState(false);

  // Load user identities and featured repos on mount
  useEffect(() => {
    setLinkedIdentities(user?.identities || []);
    fetchFeaturedRepos();
  }, []);

  // Load GitHub repos if GitHub is connected
  const githubIdentity = linkedIdentities.find((i) => i.provider === "github");
  const linkedinIdentity = linkedIdentities.find((i) => i.provider === "linkedin_oidc");

  const githubUsername =
    profile.github_username ||
    githubIdentity?.identity_data?.user_name ||
    "";

  useEffect(() => {
    if (githubUsername) {
      fetchGithubRepos(githubUsername);
    }
  }, [githubUsername]);

  async function fetchGithubRepos(username) {
    setLoadingRepos(true);
    setRepoError("");
    try {
      const res = await fetch(`/api/repos/github/${encodeURIComponent(username)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load repos");
      setGithubRepos(data.repos || []);
    } catch (e) {
      setRepoError(e.message);
    } finally {
      setLoadingRepos(false);
    }
  }

  async function fetchFeaturedRepos() {
    try {
      const res = await fetch("/api/repos");
      const data = await res.json();
      setFeaturedRepos(data.repos || []);
    } catch {
      // silently ignore
    }
  }

  async function handleSaveProfile(e) {
    e.preventDefault();
    setSaving(true);
    setSaveMessage("");
    try {
      const res = await fetch("/api/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to save");
      setSaveMessage("Profile saved!");
    } catch (e) {
      setSaveMessage("Error: " + e.message);
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(""), 3000);
    }
  }

  async function handleToggleRepo(repo) {
    const alreadyFeatured = featuredRepos.find((r) => r.repo_name === repo.name);
    if (alreadyFeatured) {
      // Remove
      try {
        await fetch(`/api/repos/${alreadyFeatured.id}`, { method: "DELETE" });
        setFeaturedRepos((prev) => prev.filter((r) => r.id !== alreadyFeatured.id));
      } catch {
        // ignore
      }
    } else {
      // Add
      try {
        const res = await fetch("/api/repos", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            repo_name: repo.name,
            repo_url: repo.html_url,
            description: repo.description,
            language: repo.language,
            stars: repo.stargazers_count,
            display_order: featuredRepos.length,
          }),
        });
        const data = await res.json();
        if (res.ok) setFeaturedRepos((prev) => [...prev, data.repo]);
      } catch {
        // ignore
      }
    }
  }

  async function handleAddManualRepo(e) {
    e.preventDefault();
    if (!manualRepo.repo_name || !manualRepo.repo_url) return;
    setAddingManual(true);
    try {
      const res = await fetch("/api/repos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...manualRepo,
          is_manual_entry: true,
          display_order: featuredRepos.length,
        }),
      });
      const data = await res.json();
      if (res.ok) {
        setFeaturedRepos((prev) => [...prev, data.repo]);
        setManualRepo({ repo_name: "", repo_url: "", description: "", language: "" });
      }
    } catch {
      // ignore
    } finally {
      setAddingManual(false);
    }
  }

  async function handleLinkGithub() {
    setLinkingGithub(true);
    try {
      const supabase = createClient();
      if (!supabase) return;
      await supabase.auth.linkIdentity({ provider: "github" });
    } catch {
      setLinkingGithub(false);
    }
  }

  async function handleLinkLinkedin() {
    setLinkingLinkedin(true);
    try {
      const supabase = createClient();
      if (!supabase) return;
      await supabase.auth.linkIdentity({ provider: "linkedin_oidc" });
    } catch {
      setLinkingLinkedin(false);
    }
  }

  const displayName =
    profile.display_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "Member";
  const avatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 flex flex-col gap-8">
      <div className="flex items-center gap-4">
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="h-16 w-16 rounded-full object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-[color:var(--byu-blue)]/20 text-2xl font-bold text-[color:var(--byu-blue)]">
            {displayName[0]?.toUpperCase() || "?"}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold text-[color:var(--byu-blue)]">Member Settings</h1>
          <p className="text-gray-500">{user?.email}</p>
        </div>
      </div>

      {/* Profile Information */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <User size={18} /> Profile Information
        </h2>
        <form onSubmit={handleSaveProfile} className="grid gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Display Name</label>
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
              value={profile.display_name}
              onChange={(e) => setProfile((p) => ({ ...p, display_name: e.target.value }))}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Bio <span className="text-gray-400">({profile.bio.length}/280)</span>
            </label>
            <textarea
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
              rows={3}
              maxLength={280}
              value={profile.bio}
              onChange={(e) => setProfile((p) => ({ ...p, bio: e.target.value }))}
              placeholder="Short bio shown on your public profile"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Major</label>
            <select
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
              value={profile.major}
              onChange={(e) => setProfile((p) => ({ ...p, major: e.target.value }))}
            >
              <option value="">Select major...</option>
              {exampleMajors.map((m) => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Expected Graduation</label>
            <input
              type="month"
              className="mt-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
              value={profile.expected_graduation ? profile.expected_graduation.substring(0, 7) : ""}
              onChange={(e) => setProfile((p) => ({ ...p, expected_graduation: e.target.value ? e.target.value + "-01" : "" }))}
              min={new Date().toISOString().substring(0, 7)}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">GitHub Username</label>
            <input
              type="text"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
              value={profile.github_username}
              onChange={(e) => setProfile((p) => ({ ...p, github_username: e.target.value }))}
              placeholder="your-github-username"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">LinkedIn URL</label>
            <input
              type="url"
              className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[color:var(--byu-blue)]"
              value={profile.linkedin_url}
              onChange={(e) => setProfile((p) => ({ ...p, linkedin_url: e.target.value }))}
              placeholder="https://linkedin.com/in/yourprofile"
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-[color:var(--byu-blue)] px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {saving ? "Saving..." : "Save Profile"}
            </button>
            {saveMessage && (
              <span className={`text-sm ${saveMessage.startsWith("Error") ? "text-red-600" : "text-green-600"}`}>
                {saveMessage}
              </span>
            )}
          </div>
        </form>
      </section>

      {/* Linked Accounts */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Link2 size={18} /> Linked Accounts
        </h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {/* GitHub */}
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <Github size={20} className="text-gray-700" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">GitHub</p>
                {githubIdentity ? (
                  <p className="text-sm text-green-600">
                    ✅ Connected as {githubIdentity.identity_data?.user_name || githubUsername}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Not connected</p>
                )}
              </div>
              {!githubIdentity && (
                <button
                  type="button"
                  onClick={handleLinkGithub}
                  disabled={linkingGithub}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  {linkingGithub ? "Connecting..." : "Connect"}
                </button>
              )}
            </div>
          </div>

          {/* LinkedIn */}
          <div className="rounded-lg border border-gray-200 p-4">
            <div className="flex items-center gap-3">
              <Linkedin size={20} className="text-[#0A66C2]" />
              <div className="flex-1">
                <p className="font-medium text-gray-900">LinkedIn</p>
                {linkedinIdentity ? (
                  <p className="text-sm text-green-600">
                    ✅ Connected as {linkedinIdentity.identity_data?.name || "LinkedIn"}
                  </p>
                ) : (
                  <p className="text-sm text-gray-500">Not connected</p>
                )}
              </div>
              {!linkedinIdentity && (
                <button
                  type="button"
                  onClick={handleLinkLinkedin}
                  disabled={linkingLinkedin}
                  className="rounded-lg border border-gray-300 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                >
                  {linkingLinkedin ? "Connecting..." : "Connect"}
                </button>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Featured GitHub Repos */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <GitBranch size={18} /> Featured Repositories
        </h2>

        {!githubUsername ? (
          <div className="rounded-lg bg-gray-50 p-4 text-sm text-gray-600">
            Connect your GitHub account or enter a GitHub username above to showcase your repositories.
          </div>
        ) : loadingRepos ? (
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-12 animate-pulse rounded-lg bg-gray-100" />
            ))}
          </div>
        ) : repoError ? (
          <p className="text-sm text-red-600">{repoError}</p>
        ) : (
          <div className="space-y-2">
            {githubRepos.map((repo) => {
              const featured = featuredRepos.find((r) => r.repo_name === repo.name);
              return (
                <label
                  key={repo.id}
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors ${
                    featured ? "border-[color:var(--byu-blue)] bg-[color:var(--byu-blue)]/5" : "border-gray-200 hover:bg-gray-50"
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={!!featured}
                    onChange={() => handleToggleRepo(repo)}
                    className="h-4 w-4 accent-[color:var(--byu-blue)]"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-gray-900 truncate">{repo.name}</p>
                    {repo.description && (
                      <p className="text-xs text-gray-500 truncate">{repo.description}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-500 shrink-0">
                    {repo.language && <span>{repo.language}</span>}
                    {repo.stargazers_count > 0 && (
                      <span className="flex items-center gap-0.5">
                        <Star size={12} /> {repo.stargazers_count}
                      </span>
                    )}
                  </div>
                </label>
              );
            })}
          </div>
        )}

        {/* Manual repo entry */}
        <details className="mt-4">
          <summary className="cursor-pointer text-sm text-[color:var(--byu-blue)] hover:underline">
            Add a repo manually
          </summary>
          <form onSubmit={handleAddManualRepo} className="mt-3 grid gap-3">
            <input
              type="text"
              placeholder="Repository name"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={manualRepo.repo_name}
              onChange={(e) => setManualRepo((r) => ({ ...r, repo_name: e.target.value }))}
              required
            />
            <input
              type="url"
              placeholder="Repository URL"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={manualRepo.repo_url}
              onChange={(e) => setManualRepo((r) => ({ ...r, repo_url: e.target.value }))}
              required
            />
            <input
              type="text"
              placeholder="Description (optional)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={manualRepo.description}
              onChange={(e) => setManualRepo((r) => ({ ...r, description: e.target.value }))}
            />
            <input
              type="text"
              placeholder="Language (optional)"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
              value={manualRepo.language}
              onChange={(e) => setManualRepo((r) => ({ ...r, language: e.target.value }))}
            />
            <button
              type="submit"
              disabled={addingManual}
              className="rounded-lg bg-[color:var(--byu-blue)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
            >
              {addingManual ? "Adding..." : "Add Repository"}
            </button>
          </form>
        </details>

        {/* Featured repos list */}
        {featuredRepos.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-sm font-medium text-gray-700">Currently featured ({featuredRepos.length})</p>
            <div className="space-y-1">
              {featuredRepos.map((repo) => (
                <div key={repo.id} className="flex items-center gap-2 rounded-lg border border-gray-100 bg-gray-50 px-3 py-2 text-sm">
                  <a
                    href={repo.repo_url}
                    target="_blank"
                    rel="noreferrer"
                    className="flex-1 font-medium text-[color:var(--byu-blue)] hover:underline truncate"
                  >
                    {repo.repo_name}
                  </a>
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await fetch(`/api/repos/${repo.id}`, { method: "DELETE" });
                      if (res.ok) {
                        setFeaturedRepos((prev) => prev.filter((r) => r.id !== repo.id));
                      } else {
                        alert("Failed to remove repository. Please try again.");
                      }
                    }}
                    className="text-xs text-red-500 hover:text-red-700"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </section>

      {/* Event History */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Calendar size={18} /> My Event History
        </h2>
        <div className="mb-3 flex items-center gap-4">
          <div className="rounded-lg bg-[color:var(--byu-blue)]/10 px-4 py-2">
            <p className="text-2xl font-bold text-[color:var(--byu-blue)]">{eventsAttended}</p>
            <p className="text-xs text-gray-600">events attended</p>
          </div>
          {eventsAttended >= 4 && (
            <span className="rounded-full bg-amber-100 px-3 py-1 text-sm font-medium text-amber-700">
              🏆 Attended 4+ events
            </span>
          )}
        </div>
        {attendanceRecords.length > 0 ? (
          <ul className="space-y-2">
            {attendanceRecords.map((record) => (
              <li key={record.id} className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2 text-sm">
                <CheckSquare size={14} className="shrink-0 text-green-500" />
                <span className="flex-1 font-medium text-gray-800">{record.event_name || "Event"}</span>
                {record.event_type && (
                  <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">{record.event_type}</span>
                )}
                {record.checked_in_at && (
                  <span className="text-xs text-gray-400">
                    {new Date(record.checked_in_at).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                )}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">
            No events attended yet.{" "}
            <a href="/checkin" className="text-[color:var(--byu-blue)] underline">Check in at your next event</a>.
          </p>
        )}
      </section>

      {/* Stars & Recognition */}
      <section className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
        <h2 className="mb-4 flex items-center gap-2 text-lg font-semibold text-gray-900">
          <Star size={18} /> Stars &amp; Recognition
        </h2>
        <div className="flex items-center gap-4 mb-4">
          <div className="rounded-lg bg-amber-50 px-4 py-2">
            <p className="text-2xl font-bold text-amber-600">{totalStars} ⭐</p>
            <p className="text-xs text-gray-600">total stars</p>
          </div>
          {currentTier && (
            <div className="rounded-lg bg-[color:var(--byu-blue)]/10 px-4 py-2">
              <p className="text-lg font-bold text-[color:var(--byu-blue)]">
                {currentTier.badge_emoji} {currentTier.tier_name}
              </p>
              <p className="text-xs text-gray-600">current tier</p>
            </div>
          )}
        </div>
        {stars.length > 0 ? (
          <ul className="space-y-2">
            {stars.slice(0, 10).map((star) => (
              <li key={star.id} className="flex items-center gap-3 rounded-lg border border-gray-100 px-3 py-2 text-sm">
                <span className="text-amber-500">⭐</span>
                <span className="flex-1 text-gray-800">{star.skill || star.event_name || "Recognition"}</span>
                {star.star_count > 1 && (
                  <span className="text-xs font-semibold text-amber-600">×{star.star_count}</span>
                )}
                {star.note && <span className="text-xs text-gray-400 truncate max-w-[120px]">{star.note}</span>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-gray-500">No stars yet. Attend events and participate to earn recognition!</p>
        )}
        <a href="/leaderboard" className="mt-3 inline-block text-sm text-[color:var(--byu-blue)] underline hover:no-underline">
          View full leaderboard →
        </a>
      </section>
    </div>
  );
}
