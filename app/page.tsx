"use client";

import React, { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { SettingsModal } from "@/components/SettingsModal";
import { QuestionChoiceView } from "@/components/QuestionChoiceView";
import { QuestionNoulView } from "@/components/QuestionNoulView";
import { QuestionScoreView } from "@/components/QuestionScoreView";
import {
  ListFilter,
  CheckCircle2,
  Award,
  Sparkles,
} from "lucide-react";
import { DEFAULT_OPENROUTER_BASE_URL, DEFAULT_JEV_MODEL } from "@/lib/jev/client";
import { QUESTION_PRESETS } from "@/lib/jev/presets";

type TabType = "choice" | "noul" | "score";

export default function Home() {
  const [activeTab, setActiveTab] = useState<TabType>("choice");
  const [selectedChoicePreset, setSelectedChoicePreset] = useState<string>("");
  const [selectedNoulPreset, setSelectedNoulPreset] = useState<string>("");
  const [selectedScorePreset, setSelectedScorePreset] = useState<string>("");
  const [apiKey, setApiKey] = useState<string>("");
  const [baseURL, setBaseURL] = useState<string>(DEFAULT_OPENROUTER_BASE_URL);
  const [model, setModel] = useState<string>(DEFAULT_JEV_MODEL);
  const [isSimulated, setIsSimulated] = useState<boolean>(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false);
  const [theme, setTheme] = useState<"dark" | "light">("light");

  // Server API key detection state
  const [hasServerKey, setHasServerKey] = useState<boolean>(false);
  const [keySource, setKeySource] = useState<string>(".env");
  const [keyPreview, setKeyPreview] = useState<string>("");

  // System Theme Detection & Listeners
  useEffect(() => {
    const savedTheme = localStorage.getItem("jev_theme") as "dark" | "light" | null;
    let initialTheme: "dark" | "light" = "light";

    if (savedTheme === "dark" || savedTheme === "light") {
      initialTheme = savedTheme;
    } else if (
      typeof window !== "undefined" &&
      window.matchMedia &&
      window.matchMedia("(prefers-color-scheme: dark)").matches
    ) {
      initialTheme = "dark";
    } else {
      initialTheme = "light";
    }

    setTheme(initialTheme);
    const root = document.documentElement;
    if (initialTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }

    if (typeof window !== "undefined" && window.matchMedia) {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleMediaChange = (e: MediaQueryListEvent) => {
        if (!localStorage.getItem("jev_theme")) {
          const newTheme = e.matches ? "dark" : "light";
          setTheme(newTheme);
          if (newTheme === "dark") {
            document.documentElement.classList.add("dark");
          } else {
            document.documentElement.classList.remove("dark");
          }
        }
      };

      if (mediaQuery.addEventListener) {
        mediaQuery.addEventListener("change", handleMediaChange);
        return () => mediaQuery.removeEventListener("change", handleMediaChange);
      } else {
        mediaQuery.addListener(handleMediaChange);
        return () => mediaQuery.removeListener(handleMediaChange);
      }
    }
  }, []);

  // Saved preferences & Server Key Detection
  useEffect(() => {
    const savedKey = localStorage.getItem("jev_openrouter_api_key") || "";
    const savedBase = localStorage.getItem("jev_openrouter_base_url") || DEFAULT_OPENROUTER_BASE_URL;
    const savedModel = localStorage.getItem("jev_model") || DEFAULT_JEV_MODEL;
    const savedSim = localStorage.getItem("jev_simulation");

    if (savedKey) {
      setApiKey(savedKey);
      setIsSimulated(false);
    } else if (savedSim !== null) {
      setIsSimulated(savedSim === "true");
    }

    if (savedBase) setBaseURL(savedBase);
    if (savedModel) setModel(savedModel);

    // Call GET /api/decisions to detect server-configured OpenRouter key
    if (typeof fetch === "function") {
      try {
        const promise = fetch("/api/decisions");
        if (promise && typeof promise.then === "function") {
          promise
            .then((res) => {
              if (res && typeof res.json === "function") {
                return res.json();
              }
              return null;
            })
            .then((data) => {
              if (data?.hasKey) {
                setHasServerKey(true);
                setKeyPreview(data.keyPreview || "");
                setKeySource(data.source || ".env");
                setIsSimulated(false);
              }
            })
            .catch(() => {
              // Silently handle any initialization fetch error
            });
        }
      } catch {
        // Silently handle fetch error
      }
    }
  }, []);

  const handleToggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("jev_theme", newTheme);
    const root = document.documentElement;
    if (newTheme === "dark") {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  };

  const handleSaveApiKey = (key: string) => {
    setApiKey(key);
    localStorage.setItem("jev_openrouter_api_key", key);
    if (key) {
      setIsSimulated(false);
      localStorage.setItem("jev_simulation", "false");
    }
  };

  const handleSaveBaseURL = (url: string) => {
    setBaseURL(url);
    localStorage.setItem("jev_openrouter_base_url", url);
  };

  const handleSaveModel = (newModel: string) => {
    setModel(newModel);
    localStorage.setItem("jev_model", newModel);
  };

  const handleToggleSimulated = (enabled: boolean) => {
    setIsSimulated(enabled);
    localStorage.setItem("jev_simulation", String(enabled));
  };

  const effectiveHasKey = Boolean(apiKey) || hasServerKey;
  const effectiveKeySource = apiKey ? "settings" : keySource;
  const effectiveKeyPreview = apiKey
    ? "sk-or-v1-••••••••" + apiKey.slice(-4)
    : keyPreview;

  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground transition-colors">
      <Header
        onOpenSettings={() => setIsSettingsOpen(true)}
        hasApiKey={effectiveHasKey}
        keySource={effectiveKeySource}
        keyPreview={effectiveKeyPreview}
        isSimulated={isSimulated}
        model={model}
        theme={theme}
        onToggleTheme={handleToggleTheme}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {/* Simplified Question Type Tabs */}
        <div className="space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-px gap-4">
            <nav className="flex space-x-4 overflow-x-auto" aria-label="Tabs">
              {/* Tab 1: Choice */}
              <button
                onClick={() => setActiveTab("choice")}
                className={`flex items-center gap-2 py-3 px-4 border-b-2 text-sm whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === "choice"
                    ? "border-foreground text-foreground font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <ListFilter className="h-4 w-4" />
                <span>Choice</span>
              </button>

              {/* Tab 2: Noul */}
              <button
                onClick={() => setActiveTab("noul")}
                className={`flex items-center gap-2 py-3 px-4 border-b-2 text-sm whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === "noul"
                    ? "border-foreground text-foreground font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <CheckCircle2 className="h-4 w-4" />
                <span>Noul</span>
              </button>

              {/* Tab 3: Score */}
              <button
                onClick={() => setActiveTab("score")}
                className={`flex items-center gap-2 py-3 px-4 border-b-2 text-sm whitespace-nowrap transition-colors cursor-pointer ${
                  activeTab === "score"
                    ? "border-foreground text-foreground font-semibold"
                    : "border-transparent text-muted-foreground hover:text-foreground hover:border-border"
                }`}
              >
                <Award className="h-4 w-4" />
                <span>Score</span>
              </button>
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              {activeTab === "choice" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 whitespace-nowrap">
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                    Choice Presets
                  </span>
                  <select
                    value={selectedChoicePreset}
                    onChange={(e) => setSelectedChoicePreset(e.target.value)}
                    className="h-7 text-xs rounded-md border border-input bg-background px-2.5 py-0.5 text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                  >
                    <option value="" disabled>Select a preset...</option>
                    {QUESTION_PRESETS.choice.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {activeTab === "noul" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 whitespace-nowrap">
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                    Noul Presets
                  </span>
                  <select
                    value={selectedNoulPreset}
                    onChange={(e) => setSelectedNoulPreset(e.target.value)}
                    className="h-7 text-xs rounded-md border border-input bg-background px-2.5 py-0.5 text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                  >
                    <option value="" disabled>Select a preset...</option>
                    {QUESTION_PRESETS.noul.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
              {activeTab === "score" && (
                <div className="flex items-center gap-2">
                  <span className="text-xs font-medium text-muted-foreground flex items-center gap-1.5 whitespace-nowrap">
                    <Sparkles className="h-3.5 w-3.5 text-muted-foreground" />
                    Score Presets
                  </span>
                  <select
                    value={selectedScorePreset}
                    onChange={(e) => setSelectedScorePreset(e.target.value)}
                    className="h-7 text-xs rounded-md border border-input bg-background px-2.5 py-0.5 text-foreground shadow-sm focus:outline-none focus:ring-1 focus:ring-ring cursor-pointer"
                  >
                    <option value="" disabled>Select a preset...</option>
                    {QUESTION_PRESETS.score.map((preset) => (
                      <option key={preset.id} value={preset.id}>
                        {preset.title}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          {/* Active Tab Content */}
          <div className="pt-2">
            {activeTab === "choice" && (
              <QuestionChoiceView
                apiKey={apiKey}
                baseURL={baseURL}
                model={model}
                isSimulated={isSimulated}
                selectedPreset={selectedChoicePreset}
                onPresetChange={setSelectedChoicePreset}
              />
            )}
            {activeTab === "noul" && (
              <QuestionNoulView
                apiKey={apiKey}
                baseURL={baseURL}
                model={model}
                isSimulated={isSimulated}
                selectedPreset={selectedNoulPreset}
                onPresetChange={setSelectedNoulPreset}
              />
            )}
            {activeTab === "score" && (
              <QuestionScoreView
                apiKey={apiKey}
                baseURL={baseURL}
                model={model}
                isSimulated={isSimulated}
                selectedPreset={selectedScorePreset}
                onPresetChange={setSelectedScorePreset}
              />
            )}
          </div>
        </div>
      </main>

      {/* Settings Modal */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        apiKey={apiKey}
        onSaveApiKey={handleSaveApiKey}
        baseURL={baseURL}
        onSaveBaseURL={handleSaveBaseURL}
        model={model}
        onSaveModel={handleSaveModel}
        isSimulated={isSimulated}
        onToggleSimulated={handleToggleSimulated}
      />
    </div>
  );
}
