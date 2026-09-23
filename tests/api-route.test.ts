import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST, GET } from "@/app/api/decisions/route";

describe("Next.js /api/decisions Route Handler", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    delete process.env.OPENROUTER_API_KEY;
  });

  it("should report missing server API key on GET when OPENROUTER_API_KEY is unset", async () => {
    delete process.env.OPENROUTER_API_KEY;
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.hasKey).toBe(false);
    expect(json.source).toBe("none");
    expect(json.keyPreview).toBe("");
    expect(json.model).toBeDefined();
  });

  it("should detect server API key on GET with masked preview", async () => {
    process.env.OPENROUTER_API_KEY = "sk-or-v1-9876543210abcdef9999";
    const res = await GET();
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.hasKey).toBe(true);
    expect(json.source).toBe(".env");
    expect(json.keyPreview).toBe("sk-or-v1-••••••••9999");
    expect(json.model).toBeDefined();
  });

  it("should validate missing request body and return 400", async () => {
    const req = new Request("http://localhost:3000/api/decisions", {
      method: "POST",
      body: JSON.stringify({}),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toBeDefined();
  });

  it("should return 400 on malformed JSON", async () => {
    const req = new Request("http://localhost:3000/api/decisions", {
      method: "POST",
      body: "invalid-json{",
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.error).toContain("Invalid JSON");
  });

  it("should return 401 when no API key is provided and simulation is false", async () => {
    const req = new Request("http://localhost:3000/api/decisions", {
      method: "POST",
      body: JSON.stringify({
        state: "personal organization, to-do tracker...",
        questions: {
          folder: {
            type: "choice",
            instructions: "Most probable folder?",
            criteria: {
              "Task Management & To-do Lists": null,
            },
          },
        },
        useSimulationIfNoKey: false,
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
    const json = await res.json();
    expect(json.error).toContain("Missing OpenRouter API Key");
  });

  it("should process a valid request using simulation when no API key is provided and allowSimulation is set", async () => {
    const req = new Request("http://localhost:3000/api/decisions", {
      method: "POST",
      body: JSON.stringify({
        state: "personal organization, to-do tracker...",
        questions: {
          folder: {
            type: "choice",
            instructions: "Most probable folder?",
            criteria: {
              "Task Management & To-do Lists": null,
              "Note-taking & Editors": null,
            },
          },
        },
        useSimulationIfNoKey: true,
      }),
      headers: { "Content-Type": "application/json" },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.answers.folder).toBeDefined();
    expect(json.answers.folder.choice).toBe("Task Management & To-do Lists");
  });

  it("should accept Authorization Bearer token header", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        answers: {
          folder: {
            type: "choice",
            choice: "Task Management & To-do Lists",
            confidence: 0.99,
          },
        },
      }),
    } as Response);

    const req = new Request("http://localhost:3000/api/decisions", {
      method: "POST",
      body: JSON.stringify({
        state: "personal organization, to-do tracker...",
        questions: {
          folder: {
            type: "choice",
            instructions: "Most probable folder?",
            criteria: {
              "Task Management & To-do Lists": null,
            },
          },
        },
      }),
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer sk-or-custom-bearer-key",
      },
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.answers.folder.choice).toBe("Task Management & To-do Lists");
  });
});
