import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { POST } from "./route.js";

const originalEnv = process.env;

describe("POST /api/jobs/parse-description", () => {
  beforeEach(() => {
    process.env = { ...originalEnv };
    vi.stubGlobal("fetch", vi.fn());
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
  });

  it("returns 503 when CHATGPT_API_KEY is not set", async () => {
    delete process.env.CHATGPT_API_KEY;
    const req = new Request("http://localhost/api/jobs/parse-description", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Job title: Dev. Company: Acme." }),
    });
    const res = await POST(req);
    expect(res.status).toBe(503);
    const json = await res.json();
    expect(json.error).toMatch(/CHATGPT_API_KEY/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns 400 when no text provided", async () => {
    process.env.CHATGPT_API_KEY = "sk-test";
    const req = new Request("http://localhost/api/jobs/parse-description", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toMatch(/No text/);
    expect(fetch).not.toHaveBeenCalled();
  });

  it("returns 400 when body has no text key", async () => {
    process.env.CHATGPT_API_KEY = "sk-test";
    const req = new Request("http://localhost/api/jobs/parse-description", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("returns 200 and parsed fields when OpenAI responds successfully", async () => {
    process.env.CHATGPT_API_KEY = "sk-test";
    const mockParsed = {
      title: "AI Strategy Intern",
      company: "Peterson Search Partners",
      description: "Paid internship...",
      url: "mailto:ladcock@petersonpartners.com",
    };
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({
          choices: [
            {
              message: {
                content: JSON.stringify(mockParsed),
              },
            },
          ],
        }),
    });

    const req = new Request("http://localhost/api/jobs/parse-description", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Job posting text here..." }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.title).toBe(mockParsed.title);
    expect(json.company).toBe(mockParsed.company);
    expect(json.description).toBe(mockParsed.description);
    expect(json.url).toBe(mockParsed.url);
    expect(fetch).toHaveBeenCalledWith(
      "https://api.openai.com/v1/chat/completions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer sk-test",
        }),
      })
    );
  });

  it("returns 502 when OpenAI API fails", async () => {
    process.env.CHATGPT_API_KEY = "sk-test";
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      text: () => Promise.resolve("OpenAI error"),
    });

    const req = new Request("http://localhost/api/jobs/parse-description", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Some job text" }),
    });
    const res = await POST(req);
    expect(res.status).toBe(502);
    const json = await res.json();
    expect(json.error).toMatch(/parse job description/);
  });
});
