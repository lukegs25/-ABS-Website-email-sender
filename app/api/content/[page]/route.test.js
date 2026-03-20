import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase", () => ({
  getSupabaseServerClient: vi.fn(),
}));

const { getSupabaseServerClient } = await import("@/lib/supabase");
const { GET } = await import("./route.js");

describe("GET /api/content/[page]", () => {
  beforeEach(() => {
    vi.mocked(getSupabaseServerClient).mockReset();
  });

  it("returns empty data when database not configured", async () => {
    getSupabaseServerClient.mockReturnValue(null);
    const res = await GET(new Request("http://localhost/api/content/home"), { params: Promise.resolve({ page: "home" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual({});
  });

  it("returns 400 for invalid page", async () => {
    getSupabaseServerClient.mockReturnValue({});
    const res = await GET(new Request("http://localhost/api/content/invalid"), { params: Promise.resolve({ page: "invalid" }) });
    expect(res.status).toBe(400);
  });

  it("returns structured content for a valid page", async () => {
    const rows = [
      { section: "hero", content_key: "headline", content_value: "AI in Business Society", content_type: "text" },
      { section: "hero", content_key: "subheadline", content_value: "BYU club", content_type: "text" },
      { section: "footer", content_key: "copyright", content_value: "© 2025 ABS", content_type: "text" },
    ];
    const mock = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ data: rows, error: null }),
    };
    getSupabaseServerClient.mockReturnValue(mock);

    const res = await GET(new Request("http://localhost/api/content/home"), { params: Promise.resolve({ page: "home" }) });
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.hero.headline).toBe("AI in Business Society");
    expect(json.data.hero.subheadline).toBe("BYU club");
    expect(json.data.footer.copyright).toBe("© 2025 ABS");
  });
});
