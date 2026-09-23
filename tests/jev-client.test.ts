import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  queryJevDecisions,
  formatDecisionsPayload,
  normalizeDecisionsResponse,
  simulateOfflineDecision,
  DEFAULT_JEV_MODEL,
  DEFAULT_OPENROUTER_BASE_URL,
} from "@/lib/jev/client";
import type {
  JevDecisionsRequest,
  ChoiceAnswer,
  NoulAnswer,
  ScoreAnswer,
} from "@/lib/jev/types";

describe("Jev Decisions Client & Normalizer", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });

  it("should format request payloads correctly according to OpenRouter Decisions API schema", () => {
    const request: JevDecisionsRequest = {
      state: "personal organization, to-do tracker...",
      model: "typesafe/jev-1.13",
      questions: {
        folder: {
          type: "choice",
          instructions:
            "What is the most probable folder to contain self hosted projects about this topic?",
          criteria: {
            "Task Management & To-do Lists": null,
            "Calendar & Contacts": null,
            "Note-taking & Editors": null,
          },
        },
        has_todo: {
          type: "noul",
          instructions: "Does this topic involve task or to-do management?",
        },
        relevance: {
          type: "score",
          instructions: "Rate how closely this relates to organization tools",
          criteria: ["None", "Low", "Medium", "High"],
        },
      },
    };

    const payload = formatDecisionsPayload(request);
    expect(payload.model).toBe("typesafe/jev-1.13");
    expect(payload.state).toBe("personal organization, to-do tracker...");
    expect(payload.questions.folder).toEqual({
      type: "choice",
      instructions:
        "What is the most probable folder to contain self hosted projects about this topic?",
      criteria: {
        "Task Management & To-do Lists": null,
        "Calendar & Contacts": null,
        "Note-taking & Editors": null,
      },
    });
    expect(payload.questions.has_todo).toEqual({
      type: "noul",
      instructions: "Does this topic involve task or to-do management?",
    });
    expect(payload.questions.relevance).toEqual({
      type: "score",
      instructions: "Rate how closely this relates to organization tools",
      criteria: ["None", "Low", "Medium", "High"],
    });
  });

  it("should support criteria formatted as string array for choice questions", () => {
    const request: JevDecisionsRequest = {
      state: "test",
      questions: {
        folder: {
          type: "choice",
          instructions: "test",
          criteria: ["Opt1", "Opt2"],
        },
      },
    };
    const payload = formatDecisionsPayload(request);
    expect(payload.questions.folder).toEqual({
      type: "choice",
      instructions: "test",
      criteria: { Opt1: null, Opt2: null },
    });
  });

  it("should normalize raw Choice answer with sorted probabilities and ranking", () => {
    const rawAnswer = {
      type: "choice",
      choice: "Task Management & To-do Lists",
      confidence: 0.942,
      probabilities: {
        "Task Management & To-do Lists": 0.942,
        "Note-taking & Editors": 0.038,
        "Personal Dashboards": 0.015,
        "Calendar & Contacts": 0.005,
      },
    };

    const normalized = normalizeDecisionsResponse({
      answers: { folder: rawAnswer },
    });

    const folderAnswer = normalized.answers.folder as ChoiceAnswer;
    expect(folderAnswer.type).toBe("choice");
    expect(folderAnswer.choice).toBe("Task Management & To-do Lists");
    expect(folderAnswer.confidence).toBe(0.942);
    expect(folderAnswer.rankedOptions).toBeDefined();
    expect(folderAnswer.rankedOptions[0].option).toBe(
      "Task Management & To-do Lists"
    );
    expect(folderAnswer.rankedOptions[0].probability).toBe(0.942);
    expect(folderAnswer.rankedOptions[0].isWinner).toBe(true);
    expect(folderAnswer.rankedOptions[1].option).toBe("Note-taking & Editors");
    expect(folderAnswer.rankedOptions[1].isWinner).toBe(false);
  });

  it("should handle choice answers where probabilities object is empty", () => {
    const normalized = normalizeDecisionsResponse({
      answers: {
        folder: {
          type: "choice",
          choice: "Task Management & To-do Lists",
          confidence: 0.85,
        },
      },
    });
    const folder = normalized.answers.folder as ChoiceAnswer;
    expect(folder.choice).toBe("Task Management & To-do Lists");
    expect(folder.rankedOptions.length).toBe(1);
  });

  it("should normalize raw Noul answer with boolean decision and percentage", () => {
    const rawAnswer = {
      type: "noul",
      noul: 0.985,
    };

    const normalized = normalizeDecisionsResponse({
      answers: { is_urgent: rawAnswer },
    });

    const answer = normalized.answers.is_urgent as NoulAnswer;
    expect(answer.type).toBe("noul");
    expect(answer.noul).toBe(0.985);
    expect(answer.verdict).toBe(true);
    expect(answer.percentage).toBe("98.5%");
  });

  it("should normalize raw Score answer with score index, level description, and probabilities", () => {
    const rawAnswer = {
      type: "score",
      score: 3,
      confidence: 0.89,
      probabilities: {
        "0": 0.01,
        "1": 0.02,
        "2": 0.08,
        "3": 0.89,
      },
      legend: ["None", "Low", "Medium", "High"],
    };

    const normalized = normalizeDecisionsResponse({
      answers: { rating: rawAnswer },
    });

    const answer = normalized.answers.rating as ScoreAnswer;
    expect(answer.type).toBe("score");
    expect(answer.score).toBe(3);
    expect(answer.scoreLabel).toBe("High");
    expect(answer.confidence).toBe(0.89);
  });

  it("should execute fetch to OpenRouter decisions endpoint and return normalized results", async () => {
    const fakeResponse = {
      answers: {
        folder: {
          type: "choice",
          choice: "Task Management & To-do Lists",
          confidence: 0.95,
          probabilities: {
            "Task Management & To-do Lists": 0.95,
            "Note-taking & Editors": 0.05,
          },
        },
      },
    };

    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => fakeResponse,
    } as Response);

    const result = await queryJevDecisions({
      apiKey: "sk-or-v1-testkey",
      request: {
        state: "personal organization, to-do tracker...",
        questions: {
          folder: {
            type: "choice",
            instructions: "Pick folder",
            criteria: {
              "Task Management & To-do Lists": null,
              "Note-taking & Editors": null,
            },
          },
        },
      },
    });

    expect(result.answers.folder).toBeDefined();
    expect((result.answers.folder as ChoiceAnswer).choice).toBe(
      "Task Management & To-do Lists"
    );
    expect(result.latencyMs).toBeGreaterThanOrEqual(0);
  });

  it("should handle 401 Unauthorized errors with clear actionable messages", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      statusText: "Unauthorized",
      json: async () => ({
        error: { message: "Invalid OpenRouter API Key" },
      }),
    } as Response);

    await expect(
      queryJevDecisions({
        apiKey: "bad-key",
        request: {
          state: "test",
          questions: {
            q1: { type: "noul", instructions: "test" },
          },
        },
      })
    ).rejects.toThrow(/Invalid OpenRouter API Key|Unauthorized/i);
  });

  it("should handle non-JSON error responses gracefully", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 502,
      statusText: "Bad Gateway",
      json: async () => {
        throw new Error("Invalid JSON");
      },
    } as unknown as Response);

    await expect(
      queryJevDecisions({
        apiKey: "good-key",
        request: {
          state: "test",
          questions: {
            q1: { type: "noul", instructions: "test" },
          },
        },
      })
    ).rejects.toThrow(/HTTP 502 Bad Gateway/i);
  });

  it("should throw when API key is missing and simulation is disabled", async () => {
    await expect(
      queryJevDecisions({
        apiKey: "",
        useSimulationIfNoKey: false,
        request: {
          state: "test",
          questions: {
            q1: { type: "noul", instructions: "test" },
          },
        },
      })
    ).rejects.toThrow(/Missing OpenRouter API Key/i);
  });

  it("should provide an offline simulated decision for testing without spending credits", () => {
    const offlineResult = simulateOfflineDecision({
      state: "personal organization, to-do tracker...",
      questions: {
        folder: {
          type: "choice",
          instructions:
            "What is the most probable folder to contain self hosted projects about this topic?",
          criteria: {
            "Task Management & To-do Lists": null,
            Analytics: null,
            Games: null,
          },
        },
        has_todo: {
          type: "noul",
          instructions: "Does this mention to-do or tasks?",
        },
        relevance: {
          type: "score",
          instructions: "Relevance score",
          criteria: ["Low", "Medium", "High"],
        },
      },
    });

    expect(offlineResult.answers.folder).toBeDefined();
    const folder = offlineResult.answers.folder as ChoiceAnswer;
    expect(folder.choice).toBe("Task Management & To-do Lists");
    expect(folder.confidence).toBeGreaterThan(0.7);

    const noul = offlineResult.answers.has_todo as NoulAnswer;
    expect(noul.verdict).toBe(true);

    const score = offlineResult.answers.relevance as ScoreAnswer;
    expect(score.score).toBe(2);
    expect(score.scoreLabel).toBe("High");
  });
});
