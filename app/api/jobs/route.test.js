import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route.js";

vi.mock("@/lib/supabase", () => ({
  getSupabaseServerClient: vi.fn(),
}));

const { getSupabaseServerClient } = await import("@/lib/supabase");

describe("GET /api/jobs", () => {
  beforeEach(() => {
    vi.mocked(getSupabaseServerClient).mockReset();
  });

  it("returns 503 when database is not configured", async () => {
    getSupabaseServerClient.mockReturnValue(null);
    const res = await GET();
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toBe("Database not configured");
  });

  it("returns 500 when Supabase query errors", async () => {
    getSupabaseServerClient.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: null, error: { message: "DB error" } }),
    });
    const res = await GET();
    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.error).toBe("DB error");
  });

  it("returns 200 and job list when query succeeds", async () => {
    const mockJobs = [
      { id: "1", title: "Dev", company: "Acme", url: "https://a.com", posted_at: "2025-01-01" },
    ];
    getSupabaseServerClient.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      order: vi.fn().mockReturnThis(),
      limit: vi.fn().mockResolvedValue({ data: mockJobs, error: null }),
    });
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json).toEqual(mockJobs);
  });
});

describe("POST /api/jobs", () => {
  beforeEach(() => {
    vi.mocked(getSupabaseServerClient).mockReset();
  });

  it("returns 503 when database is not configured", async () => {
    getSupabaseServerClient.mockReturnValue(null);
    const req = new Request("http://localhost/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Engineer",
        company: "Co",
        url: "https://apply.co",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(503);
  });

  it("returns 400 when body is invalid JSON", async () => {
    getSupabaseServerClient.mockReturnValue({});
    const req = new Request("http://localhost/api/jobs", {
      method: "POST",
      body: "not json",
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBe("Invalid JSON body");
  });

  it("returns 400 when validation fails (missing title)", async () => {
    getSupabaseServerClient.mockReturnValue({});
    const req = new Request("http://localhost/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "",
        company: "Co",
        url: "https://apply.co",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/Job title|Validation/);
  });

  it("returns 200 and created job when insert succeeds", async () => {
    const inserted = {
      id: "new-id",
      title: "Engineer",
      company: "Co",
      url: "https://apply.co",
      posted_at: "2025-03-01T00:00:00Z",
    };
    getSupabaseServerClient.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: inserted, error: null }),
    });
    const req = new Request("http://localhost/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Engineer",
        company: "Co",
        url: "https://apply.co",
        description: "Optional",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.title).toBe("Engineer");
    expect(json.company).toBe("Co");
    expect(json.url).toBe("https://apply.co");
  });

  it("returns 409 when duplicate title+company", async () => {
    getSupabaseServerClient.mockReturnValue({
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({
        data: null,
        error: { code: "23505", message: "duplicate key" },
      }),
    });
    const req = new Request("http://localhost/api/jobs", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: "Engineer",
        company: "Co",
        url: "https://apply.co",
      }),
    });
    const res = await POST(req);
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toMatch(/already exists/);
  });
});
