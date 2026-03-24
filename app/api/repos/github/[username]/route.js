import { NextResponse } from "next/server";

// Cache GitHub responses for 5 minutes
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000;

export async function GET(request, { params }) {
  const { username } = await params;

  if (!username || typeof username !== "string" || !/^[a-zA-Z0-9](?:[a-zA-Z0-9-]*[a-zA-Z0-9])?$/.test(username)) {
    return NextResponse.json({ error: "Invalid username" }, { status: 400 });
  }

  const cacheKey = username.toLowerCase();
  const cached = cache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return NextResponse.json({ repos: cached.repos });
  }

  const res = await fetch(
    `https://api.github.com/users/${username}/repos?sort=updated&per_page=30&type=public`,
    {
      headers: {
        Accept: "application/vnd.github+json",
        "X-GitHub-Api-Version": "2022-11-28",
      },
      next: { revalidate: 300 },
    }
  );

  if (!res.ok) {
    if (res.status === 404) {
      return NextResponse.json({ error: "GitHub user not found" }, { status: 404 });
    }
    return NextResponse.json({ error: "Failed to fetch GitHub repos" }, { status: 502 });
  }

  const data = await res.json();
  const repos = data.map((r) => ({
    id: r.id,
    name: r.name,
    full_name: r.full_name,
    html_url: r.html_url,
    description: r.description,
    language: r.language,
    stargazers_count: r.stargazers_count,
    updated_at: r.updated_at,
  }));

  cache.set(cacheKey, { repos, timestamp: Date.now() });

  return NextResponse.json({ repos });
}
