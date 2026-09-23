import { describe, it, expect } from "vitest";
import {
  SELF_HOSTED_FOLDERS,
  SELF_HOSTED_PRESET,
  QUESTION_PRESETS,
  buildChoiceQuestion,
  buildNoulQuestion,
  buildScoreQuestion,
} from "@/lib/jev/presets";

describe("Jev Presets & Question Builders", () => {
  it("should contain the complete list of 90+ self-hosted project folders", () => {
    expect(SELF_HOSTED_FOLDERS).toBeDefined();
    expect(Array.isArray(SELF_HOSTED_FOLDERS)).toBe(true);
    expect(SELF_HOSTED_FOLDERS.length).toBeGreaterThanOrEqual(90);

    // Verify key folders from the user's list
    expect(SELF_HOSTED_FOLDERS).toContain("Task Management & To-do Lists");
    expect(SELF_HOSTED_FOLDERS).toContain("Note-taking & Editors");
    expect(SELF_HOSTED_FOLDERS).toContain("Calendar & Contacts");
    expect(SELF_HOSTED_FOLDERS).toContain("Personal Dashboards");
    expect(SELF_HOSTED_FOLDERS).toContain("Time Tracking");
    expect(SELF_HOSTED_FOLDERS).toContain("Money, Budgeting & Management");
    expect(SELF_HOSTED_FOLDERS).toContain("Analytics");
    expect(SELF_HOSTED_FOLDERS).toContain("Wikis");
  });

  it("should provide the user's exact self-hosted folders preset", () => {
    expect(SELF_HOSTED_PRESET).toBeDefined();
    expect(SELF_HOSTED_PRESET.state).toBe(
      "personal organization, to-do tracker..."
    );
    expect(SELF_HOSTED_PRESET.questionType).toBe("choice");
    expect(SELF_HOSTED_PRESET.instructions).toContain(
      "most probable folder to contain self hosted projects"
    );
    expect(SELF_HOSTED_PRESET.options).toEqual(SELF_HOSTED_FOLDERS);
  });

  it("should provide pre-configured presets for all 3 question types (Choice, Noul, Score)", () => {
    expect(QUESTION_PRESETS.choice).toBeDefined();
    expect(QUESTION_PRESETS.noul).toBeDefined();
    expect(QUESTION_PRESETS.score).toBeDefined();

    expect(QUESTION_PRESETS.choice.some((p) => p.id === "self-hosted-folders")).toBe(
      true
    );
    expect(QUESTION_PRESETS.noul.length).toBeGreaterThan(0);
    expect(QUESTION_PRESETS.score.length).toBeGreaterThan(0);
  });

  it("should build a valid Choice question structure", () => {
    const question = buildChoiceQuestion(
      "Which folder does this belong to?",
      ["Folder A", "Folder B", "Folder C"]
    );
    expect(question.type).toBe("choice");
    expect(question.instructions).toBe("Which folder does this belong to?");
    expect(question.criteria).toEqual({
      "Folder A": null,
      "Folder B": null,
      "Folder C": null,
    });
  });

  it("should build a valid Choice question with detailed criteria descriptions", () => {
    const question = buildChoiceQuestion(
      "Select the department",
      {
        billing: "Invoices and credit card payments",
        support: "Technical bugs and errors",
      }
    );
    expect(question.type).toBe("choice");
    expect(question.criteria).toEqual({
      billing: "Invoices and credit card payments",
      support: "Technical bugs and errors",
    });
  });

  it("should build a valid Noul question structure", () => {
    const question = buildNoulQuestion("Is this a critical bug?");
    expect(question.type).toBe("noul");
    expect(question.instructions).toBe("Is this a critical bug?");
  });

  it("should build a valid Score question structure with rubric legend", () => {
    const rubric = [
      "Not applicable",
      "Minor relevance",
      "Moderate relevance",
      "Exact match",
    ];
    const question = buildScoreQuestion("How relevant is this folder?", rubric);
    expect(question.type).toBe("score");
    expect(question.instructions).toBe("How relevant is this folder?");
    expect(question.criteria).toEqual(rubric);
  });
});
