import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase", () => ({
  getSupabaseServerClient: vi.fn(),
}));

const { getSupabaseServerClient } = await import("@/lib/supabase");
const { GET } = await import("./route.js");

function buildQuery(resolveValue) {
  const q = {
    select: vi.fn().mockReturnThis(),
    order: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    then: (resolve, reject) => Promise.resolve(resolveValue).then(resolve, reject),
  };
  return q;
}

describe("GET /api/stars/leaderboard", () => {
  beforeEach(() => {
    vi.mocked(getSupabaseServerClient).mockReset();
  });

  it("returns empty data when database not configured", async () => {
    getSupabaseServerClient.mockReturnValue(null);
    const req = new Request("http://localhost/api/stars/leaderboard");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual([]);
  });

  it("builds leaderboard from profiles and stars", async () => {
    const profiles = [
      { id: "p1", full_name: "Alice", email: "alice@byu.edu", avatar_url: null, headline: "Student", linkedin_url: null },
      { id: "p2", full_name: "Bob", email: "bob@byu.edu", avatar_url: null, headline: null, linkedin_url: null },
    ];
    const stars = [
      { member_id: "p1", star_count: 3, source: "event_attendance", event_id: "e1" },
      { member_id: "p1", star_count: 2, source: "manual", event_id: null },
      { member_id: "p2", star_count: 1, source: "event_attendance", event_id: "e2" },
    ];
    const tiers = [
      { tier_name: "AI Leader", min_stars: 5, badge_emoji: "🚀" },
      { tier_name: "AI Explorer", min_stars: 1, badge_emoji: "🌱" },
    ];

    const mock = {
      from: vi.fn().mockImplementation((table) => {
        if (table === "profiles") return buildQuery({ data: profiles, error: null });
        if (table === "member_stars") return buildQuery({ data: stars, error: null });
        if (table === "star_tiers") return buildQuery({ data: tiers, error: null });
      }),
    };
    getSupabaseServerClient.mockReturnValue(mock);

    const req = new Request("http://localhost/api/stars/leaderboard");
    const res = await GET(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(2);
    expect(json.data[0].display_name).toBe("Alice");
    expect(json.data[0].total_stars).toBe(5);
    expect(json.data[0].tier_name).toBe("AI Leader");
    expect(json.data[0].tier_emoji).toBe("🚀");
    expect(json.data[0].rank).toBe(1);
    expect(json.data[1].display_name).toBe("Bob");
    expect(json.data[1].total_stars).toBe(1);
    expect(json.data[1].tier_name).toBe("AI Explorer");
    expect(json.data[1].rank).toBe(2);
  });

  it("excludes members with zero stars from leaderboard", async () => {
    const profiles = [
      { id: "p1", full_name: "Alice", email: "alice@byu.edu", avatar_url: null, headline: null, linkedin_url: null },
      { id: "p2", full_name: "Bob", email: "bob@byu.edu", avatar_url: null, headline: null, linkedin_url: null },
    ];
    const stars = [
      { member_id: "p1", star_count: 2, source: "manual", event_id: null },
    ];

    const mock = {
      from: vi.fn().mockImplementation((table) => {
        if (table === "profiles") return buildQuery({ data: profiles, error: null });
        if (table === "member_stars") return buildQuery({ data: stars, error: null });
        return buildQuery({ data: [], error: null });
      }),
    };
    getSupabaseServerClient.mockReturnValue(mock);

    const req = new Request("http://localhost/api/stars/leaderboard");
    const res = await GET(req);
    const json = await res.json();
    expect(json.data).toHaveLength(1);
    expect(json.data[0].display_name).toBe("Alice");
  });

  it("respects limit query param", async () => {
    const profiles = Array.from({ length: 5 }, (_, i) => ({
      id: `p${i}`, full_name: `Member ${i}`, email: null, avatar_url: null, headline: null, linkedin_url: null,
    }));
    const stars = profiles.map((p, i) => ({
      member_id: p.id, star_count: 10 - i, source: "manual", event_id: null,
    }));

    const mock = {
      from: vi.fn().mockImplementation((table) => {
        if (table === "profiles") return buildQuery({ data: profiles, error: null });
        if (table === "member_stars") return buildQuery({ data: stars, error: null });
        return buildQuery({ data: [], error: null });
      }),
    };
    getSupabaseServerClient.mockReturnValue(mock);

    const req = new Request("http://localhost/api/stars/leaderboard?limit=3");
    const res = await GET(req);
    const json = await res.json();
    expect(json.data).toHaveLength(3);
  });
});
