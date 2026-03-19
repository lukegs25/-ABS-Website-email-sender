import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase", () => ({
  getSupabaseServerClient: vi.fn(),
}));
vi.mock("@/lib/auth-helpers", () => ({
  getAdminSession: vi.fn(),
}));

const { getSupabaseServerClient } = await import("@/lib/supabase");
const { getAdminSession } = await import("@/lib/auth-helpers");
const { GET, POST, PUT, DELETE } = await import("./route.js");

function buildMockSupabase({ insertData, insertError, updateData, updateError, deleteError, selectData, selectError } = {}) {
  const mock = {
    from: vi.fn().mockReturnThis(),
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    order: vi.fn().mockResolvedValue({ data: selectData || [], error: selectError || null }),
    single: vi.fn().mockResolvedValue({ data: insertData || updateData || null, error: insertError || updateError || null }),
  };
  return mock;
}

describe("GET /api/admin/events", () => {
  beforeEach(() => {
    vi.mocked(getSupabaseServerClient).mockReset();
    vi.mocked(getAdminSession).mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    getAdminSession.mockResolvedValue(null);
    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("returns 503 when database not configured", async () => {
    getAdminSession.mockResolvedValue({ email: "admin@byu.edu" });
    getSupabaseServerClient.mockReturnValue(null);
    const res = await GET();
    expect(res.status).toBe(503);
  });

  it("returns 200 with events list", async () => {
    getAdminSession.mockResolvedValue({ email: "admin@byu.edu" });
    const mockEvents = [
      { id: "e1", title: "Bootcamp", star_value: 3, event_date: "2025-04-01T18:00:00Z" },
    ];
    getSupabaseServerClient.mockReturnValue(buildMockSupabase({ selectData: mockEvents }));
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toEqual(mockEvents);
  });
});

describe("POST /api/admin/events", () => {
  beforeEach(() => {
    vi.mocked(getSupabaseServerClient).mockReset();
    vi.mocked(getAdminSession).mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    getAdminSession.mockResolvedValue(null);
    const req = new Request("http://localhost/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Test", event_date: "2025-04-01T18:00:00Z", star_value: 1 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns 400 when title is missing", async () => {
    getAdminSession.mockResolvedValue({ email: "admin@byu.edu" });
    getSupabaseServerClient.mockReturnValue({});
    const req = new Request("http://localhost/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "", event_date: "2025-04-01T18:00:00Z", star_value: 1 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/title/);
  });

  it("returns 400 when event_date is missing", async () => {
    getAdminSession.mockResolvedValue({ email: "admin@byu.edu" });
    getSupabaseServerClient.mockReturnValue({});
    const req = new Request("http://localhost/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Bootcamp", star_value: 2 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/event_date/);
  });

  it("returns 400 when star_value is negative", async () => {
    getAdminSession.mockResolvedValue({ email: "admin@byu.edu" });
    getSupabaseServerClient.mockReturnValue({});
    const req = new Request("http://localhost/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Bootcamp", event_date: "2025-04-01T18:00:00Z", star_value: -1 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/star_value/);
  });

  it("returns 201 when event is created", async () => {
    getAdminSession.mockResolvedValue({ email: "admin@byu.edu" });
    const created = { id: "new-e1", title: "Bootcamp", event_date: "2025-04-01T18:00:00Z", star_value: 2 };
    const mock = {
      from: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: created, error: null }),
    };
    getSupabaseServerClient.mockReturnValue(mock);
    const req = new Request("http://localhost/api/admin/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Bootcamp", event_date: "2025-04-01T18:00:00Z", star_value: 2 }),
    });
    const res = await POST(req);
    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.title).toBe("Bootcamp");
  });
});

describe("DELETE /api/admin/events", () => {
  beforeEach(() => {
    vi.mocked(getSupabaseServerClient).mockReset();
    vi.mocked(getAdminSession).mockReset();
  });

  it("returns 400 when id is missing", async () => {
    getAdminSession.mockResolvedValue({ email: "admin@byu.edu" });
    getSupabaseServerClient.mockReturnValue({});
    const req = new Request("http://localhost/api/admin/events");
    const res = await DELETE(req);
    expect(res.status).toBe(400);
  });

  it("returns 200 when event is deleted", async () => {
    getAdminSession.mockResolvedValue({ email: "admin@byu.edu" });
    const mock = {
      from: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockResolvedValue({ error: null }),
    };
    getSupabaseServerClient.mockReturnValue(mock);
    const req = new Request("http://localhost/api/admin/events?id=e1");
    const res = await DELETE(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
  });
});
