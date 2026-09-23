import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { Header } from "@/components/Header";
import { SettingsModal } from "@/components/SettingsModal";
import { QuestionChoiceView } from "@/components/QuestionChoiceView";
import { QuestionNoulView } from "@/components/QuestionNoulView";
import { QuestionScoreView } from "@/components/QuestionScoreView";
import Home from "@/app/page";

describe("UI Components & User Workflows", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders Header with branding, key detection status, and action buttons", () => {
    const handleOpenSettings = vi.fn();
    const handleToggleTheme = vi.fn();

    render(
      <Header
        onOpenSettings={handleOpenSettings}
        hasApiKey={true}
        keySource=".env"
        keyPreview="sk-or-v1-••••••••9999"
        isSimulated={false}
        model="typesafe/jev-1.13"
        theme="light"
        onToggleTheme={handleToggleTheme}
      />
    );

    expect(screen.getByText("Jev Studio")).toBeInTheDocument();
    expect(screen.getByText(/Key: .env/i)).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();

    const settingsBtn = screen.getByRole("button", { name: /settings/i });
    fireEvent.click(settingsBtn);
    expect(handleOpenSettings).toHaveBeenCalled();

    const themeBtn = screen.getByLabelText(/toggle theme/i);
    fireEvent.click(themeBtn);
    expect(handleToggleTheme).toHaveBeenCalled();
  });

  it("renders QuestionChoiceView with candidate options without search bar or repeated badges", () => {
    render(
      <QuestionChoiceView
        apiKey="test-key"
        model="typesafe/jev-1.13"
        isSimulated={true}
      />
    );

    const textarea = screen.getByPlaceholderText(/personal organization, to-do tracker.../i);
    expect(textarea).toBeInTheDocument();
    expect((textarea as HTMLTextAreaElement).value).toBe("");

    // Search bar is removed
    expect(screen.queryByPlaceholderText(/search/i)).not.toBeInTheDocument();

    // No duplicate state or instructions badges
    expect(screen.queryByText(/^state$/i)).not.toBeInTheDocument();
    // Candidate options is empty by default
    expect(screen.getByText(/No candidate options added yet/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /ask jev to choose/i })).toBeInTheDocument();
  });

  it("executes decision in QuestionChoiceView and renders unified scrollable ranked list with winning choice", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        answers: {
          predicted_choice: {
            type: "choice",
            choice: "Task Management & To-do Lists",
            confidence: 0.942,
            probabilities: {
              "Task Management & To-do Lists": 0.942,
              "Note-taking & Editors": 0.038,
              "Personal Dashboards": 0.015,
            },
            rankedOptions: [
              {
                option: "Task Management & To-do Lists",
                probability: 0.942,
                percentage: "94.2%",
                isWinner: true,
              },
              {
                option: "Note-taking & Editors",
                probability: 0.038,
                percentage: "3.8%",
                isWinner: false,
              },
              {
                option: "Personal Dashboards",
                probability: 0.015,
                percentage: "1.5%",
                isWinner: false,
              },
            ],
          },
        },
        latencyMs: 120,
      }),
    } as unknown as Response);

    render(
      <QuestionChoiceView
        apiKey="test-key"
        model="typesafe/jev-1.13"
        isSimulated={false}
        selectedPreset="self-hosted-folders"
      />
    );

    const askBtn = screen.getByRole("button", { name: /ask jev to choose/i });
    fireEvent.click(askBtn);

    await waitFor(() => {
      // General winner label, NOT tied to "folders"
      expect(screen.getByText(/Top Choice/i)).toBeInTheDocument();
      expect(screen.getAllByText("94.2%").length).toBeGreaterThanOrEqual(1);
      // Single unified ranked list containing items
      expect(screen.getByText("Task Management & To-do Lists")).toBeInTheDocument();
      expect(screen.getByText("Note-taking & Editors")).toBeInTheDocument();
      // Raw API button available
      expect(screen.getByRole("button", { name: /view raw api response/i })).toBeInTheDocument();
    });
  });

  it("allows opening raw API response modal and copying payload", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        answers: {
          predicted_choice: {
            type: "choice",
            choice: "Task Management & To-do Lists",
            confidence: 1.0,
            rankedOptions: [
              {
                option: "Task Management & To-do Lists",
                probability: 1.0,
                percentage: "100.0%",
                isWinner: true,
              },
            ],
          },
        },
        latencyMs: 80,
      }),
    } as unknown as Response);

    render(
      <QuestionChoiceView
        apiKey="test-key"
        model="typesafe/jev-1.13"
        isSimulated={false}
        selectedPreset="self-hosted-folders"
      />
    );

    const askBtn = screen.getByRole("button", { name: /ask jev to choose/i });
    fireEvent.click(askBtn);

    await waitFor(() => {
      expect(screen.getByRole("button", { name: /view raw api response/i })).toBeInTheDocument();
    });

    const rawBtn = screen.getByRole("button", { name: /view raw api response/i });
    fireEvent.click(rawBtn);

    await waitFor(() => {
      expect(screen.getByText(/Raw Jev API Response/i)).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /copy json/i })).toBeInTheDocument();
    });
  });

  it("renders QuestionNoulView and executes binary evaluation without redundant metrics", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        answers: {
          boolean_check: {
            type: "noul",
            noul: 0.985,
            verdict: true,
            percentage: "98.5%",
          },
        },
        latencyMs: 75,
      }),
    } as unknown as Response);

    render(
      <QuestionNoulView
        apiKey="test-key"
        model="typesafe/jev-1.13"
        isSimulated={false}
        selectedPreset="todo-relevance-check"
      />
    );

    const evalBtn = screen.getByRole("button", { name: /evaluate noul condition/i });
    fireEvent.click(evalBtn);

    await waitFor(() => {
      expect(screen.getByText("YES / TRUE")).toBeInTheDocument();
      expect(screen.getByText("98.5%")).toBeInTheDocument();
    });
  });

  it("supports switching validation curves in QuestionNoulView", () => {
    render(
      <QuestionNoulView
        apiKey="test-key"
        model="typesafe/jev-1.13"
        isSimulated={true}
      />
    );

    const sigmoidBtn = screen.getByRole("button", { name: /sigmoid/i });
    expect(sigmoidBtn).toBeInTheDocument();
    fireEvent.click(sigmoidBtn);
    expect(screen.getByText(/Sigmoid/i)).toBeInTheDocument();
  });

  it("renders QuestionScoreView and scores state against rubric without redundant cards", async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        answers: {
          scored_level: {
            type: "score",
            score: 2,
            scoreLabel: "High Relevance",
            confidence: 0.91,
            probabilities: { "0": 0.02, "1": 0.07, "2": 0.91 },
            legend: { "0": "None", "1": "Medium", "2": "High Relevance" },
          },
        },
        latencyMs: 95,
      }),
    } as unknown as Response);

    render(
      <QuestionScoreView
        apiKey="test-key"
        model="typesafe/jev-1.13"
        isSimulated={false}
        selectedPreset="organization-relevance-score"
      />
    );

    const scoreBtn = screen.getByRole("button", { name: /score on rubric/i });
    fireEvent.click(scoreBtn);

    await waitFor(() => {
      expect(screen.getByText("High Relevance")).toBeInTheDocument();
      expect(screen.getByText(/Level 2/i)).toBeInTheDocument();
    });
  });

  it("renders SettingsModal with documentation links to OpenRouter and TypeSafe", () => {
    const handleClose = vi.fn();
    const handleSaveApiKey = vi.fn();
    const handleSaveBaseURL = vi.fn();
    const handleSaveModel = vi.fn();
    const handleToggleSimulated = vi.fn();

    render(
      <SettingsModal
        isOpen={true}
        onClose={handleClose}
        apiKey="existing-key"
        onSaveApiKey={handleSaveApiKey}
        baseURL="https://openrouter.ai/api"
        onSaveBaseURL={handleSaveBaseURL}
        model="typesafe/jev-1.13"
        onSaveModel={handleSaveModel}
        isSimulated={true}
        onToggleSimulated={handleToggleSimulated}
      />
    );

    expect(screen.getByText("OpenRouter & Jev Configuration")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /openrouter docs/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /typesafe documentation/i })).toBeInTheDocument();

    const saveBtn = screen.getByRole("button", { name: /save & apply/i });
    fireEvent.click(saveBtn);

    expect(handleSaveApiKey).toHaveBeenCalledWith("existing-key");
    expect(handleClose).toHaveBeenCalled();
  });

  it("renders Home without hero banner or footer, and only 3 core tabs (Choice, Noul, Score)", () => {
    render(<Home />);

    // Branding in header
    expect(screen.getByText("Jev Studio")).toBeInTheDocument();

    // Verify hero section is NOT present
    expect(screen.queryByText(/TypeSafe Decision Engine/i)).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Jev is a high-speed System One model designed for calibrated/i)
    ).not.toBeInTheDocument();

    // Verify footer is NOT present
    expect(
      screen.queryByText(/Built with Next.js, TypeScript, and Tailwind CSS/i)
    ).not.toBeInTheDocument();

    // Verify only the 3 fundamental tabs exist
    const choiceTab = screen.getByRole("button", { name: /^Choice$/i });
    const noulTab = screen.getByRole("button", { name: /^Noul$/i });
    const scoreTab = screen.getByRole("button", { name: /^Score$/i });
    const parallelTab = screen.queryByRole("button", { name: /Parallel/i });

    expect(choiceTab).toBeInTheDocument();
    expect(noulTab).toBeInTheDocument();
    expect(scoreTab).toBeInTheDocument();
    expect(parallelTab).not.toBeInTheDocument();

    // Verify presets selector is in the top tab row
    expect(screen.getByText(/Choice Presets/i)).toBeInTheDocument();

    // Verify tabs work and presets switch accordingly
    fireEvent.click(noulTab);
    expect(screen.getByText(/Validation Curve/i)).toBeInTheDocument();
    expect(screen.getByText(/Noul Presets/i)).toBeInTheDocument();

    fireEvent.click(scoreTab);
    expect(screen.getAllByText(/Rubric Levels/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/Score Presets/i)).toBeInTheDocument();
  });
});
