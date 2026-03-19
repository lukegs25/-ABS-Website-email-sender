import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/lib/supabase", () => ({
  getSupabaseServerClient: vi.fn(),
}));
vi.mock("@/lib/auth-helpers", () => ({
  getAdminSession: vi.fn(),
}));

const { getSupabaseServerClient } = await import("@/lib/supabase");
const { getAdminSession } = await import("@/lib/auth-helpers");
const { POST } = await import("./route.js");

function makeReq(body) {
  return new Request("http://localhost/api/admin/attendance", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/admin/attendance", () => {
  beforeEach(() => {
    vi.mocked(getSupabaseServerClient).mockReset();
    vi.mocked(getAdminSession).mockReset();
  });

  it("returns 401 when not authenticated", async () => {
    getAdminSession.mockResolvedValue(null);
    const res = await POST(makeReq({ member_id: "m1", event_id: "e1" }));
    expect(res.status).toBe(401);
  });

  it("returns 400 when member_id is missing", async () => {
    getAdminSession.mockResolvedValue({ email: "admin@byu.edu" });
    getSupabaseServerClient.mockReturnValue({});
    const res = await POST(makeReq({ event_id: "e1" }));
    expect(res.status).toBe(400);
  });

  it("returns 400 when event_id is missing", async () => {
    getAdminSession.mockResolvedValue({ email: "admin@byu.edu" });
    getSupabaseServerClient.mockReturnValue({});
    const res = await POST(makeReq({ member_id: "m1" }));
    expect(res.status).toBe(400);
  });

  it("returns 404 when event not found", async () => {
    getAdminSession.mockResolvedValue({ email: "admin@byu.edu" });
    const mock = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: null, error: { message: "not found" } }),
    };
    getSupabaseServerClient.mockReturnValue(mock);
    const res = await POST(makeReq({ member_id: "m1", event_id: "e1" }));
    expect(res.status).toBe(404);
  });

  it("returns 409 when member already attended", async () => {
    getAdminSession.mockResolvedValue({ email: "admin@byu.edu" });
    let callCount = 0;
    const mock = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) {
          // First call: get event
          return Promise.resolve({ data: { id: "e1", title: "Bootcamp", star_value: 2 }, error: null });
        }
        // Second call: insert attendance fails with duplicate
        return Promise.resolve({ data: null, error: { code: "23505", message: "duplicate key" } });
      }),
    };
    getSupabaseServerClient.mockReturnValue(mock);
    const res = await POST(makeReq({ member_id: "m1", event_id: "e1" }));
    expect(res.status).toBe(409);
    const json = await res.json();
    expect(json.error).toMatch(/already marked/);
  });

  it("returns 200 and records attendance + stars", async () => {
    getAdminSession.mockResolvedValue({ email: "admin@byu.edu" });
    const mockAttendance = { id: "att1", member_id: "m1", event_id: "e1" };
    const mockStar = { id: "star1", member_id: "m1", star_count: 2 };
    let callCount = 0;
    const mock = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve({ data: { id: "e1", title: "Bootcamp", star_value: 2 }, error: null });
        if (callCount === 2) return Promise.resolve({ data: mockAttendance, error: null });
        return Promise.resolve({ data: mockStar, error: null });
      }),
    };
    getSupabaseServerClient.mockReturnValue(mock);
    const res = await POST(makeReq({ member_id: "m1", event_id: "e1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.message).toMatch(/2 star/);
  });

  it("returns 200 without stars when event star_value is 0", async () => {
    getAdminSession.mockResolvedValue({ email: "admin@byu.edu" });
    let callCount = 0;
    const mock = {
      from: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      insert: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockImplementation(() => {
        callCount++;
        if (callCount === 1) return Promise.resolve({ data: { id: "e1", title: "Social", star_value: 0 }, error: null });
        return Promise.resolve({ data: { id: "att1" }, error: null });
      }),
    };
    getSupabaseServerClient.mockReturnValue(mock);
    const res = await POST(makeReq({ member_id: "m1", event_id: "e1" }));
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.star).toBeNull();
  });
});
