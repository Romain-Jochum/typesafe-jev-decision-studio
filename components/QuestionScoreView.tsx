"use client";

import React, { useState, useEffect } from "react";
import {
  Award,
  Play,
  RotateCcw,
  Sparkles,
  Plus,
  Trash2,
  FileCode,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { RawResponseModal } from "@/components/RawResponseModal";
import { QUESTION_PRESETS } from "@/lib/jev/presets";
import type { ScoreAnswer } from "@/lib/jev/types";

interface QuestionScoreViewProps {
  apiKey?: string;
  baseURL?: string;
  model: string;
  isSimulated: boolean;
  selectedPreset?: string;
  onPresetChange?: (presetId: string) => void;
}

export function QuestionScoreView({
  apiKey,
  baseURL,
  model,
  isSimulated,
  selectedPreset,
  onPresetChange,
}: QuestionScoreViewProps) {
  const [stateText, setStateText] = useState("");
  const [instructions, setInstructions] = useState("");
  const [rubric, setRubric] = useState<string[]>([]);
  const [newLevelText, setNewLevelText] = useState("");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ScoreAnswer | null>(null);
  const [rawResponse, setRawResponse] = useState<unknown>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isRawModalOpen, setIsRawModalOpen] = useState(false);

  const handleApplyPreset = (presetId: string) => {
    const preset = QUESTION_PRESETS.score.find((p) => p.id === presetId);
    if (!preset) return;
    setStateText(preset.state);
    setInstructions(preset.instructions);
    if (preset.rubric) {
      setRubric(preset.rubric);
    }
    setResult(null);
    setError(null);
  };

  useEffect(() => {
    if (selectedPreset) {
      handleApplyPreset(selectedPreset);
    }
  }, [selectedPreset]);

  const handleAddRubricLevel = () => {
    if (!newLevelText.trim()) return;
    setRubric([...rubric, newLevelText.trim()]);
    setNewLevelText("");
  };

  const handleRemoveRubricLevel = (index: number) => {
    if (rubric.length <= 2) {
      setError("Score rubric must have at least 2 levels.");
      return;
    }
    const updated = rubric.filter((_, i) => i !== index);
    setRubric(updated);
  };

  const handleExecute = async () => {
    if (!stateText.trim()) {
      setError("Please provide application state or context.");
      return;
    }
    if (!instructions.trim()) {
      setError("Please provide question instructions.");
      return;
    }
    if (rubric.length < 2) {
      setError("Score questions require at least 2 rubric levels.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: stateText,
          model,
          apiKey: apiKey || undefined,
          baseURL: baseURL || undefined,
          useSimulationIfNoKey: isSimulated,
          questions: {
            scored_level: {
              type: "score",
              instructions,
              criteria: rubric,
            },
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Evaluation failed");
      }

      const answer = (data.answers?.scored_level ||
        Object.values(data.answers || {})[0]) as ScoreAnswer;
      if (!answer) {
        throw new Error("No answer returned from decision engine");
      }

      setResult(answer);
      setRawResponse(data);
      setLatencyMs(data.latencyMs || null);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Inputs */}
        <div className="lg:col-span-6 space-y-5">
          <Card className="rounded-lg border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Context
              </CardTitle>
              <CardDescription>
                The statement, document, or event being evaluated.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Textarea
                value={stateText}
                onChange={(e) => setStateText(e.target.value)}
                placeholder="e.g. personal organization, to-do tracker..."
                className="font-mono text-xs min-h-24 rounded-lg border-input focus:ring-1 focus:ring-ring"
              />
            </CardContent>
          </Card>

          <Card className="rounded-lg border-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-base font-semibold">
                Instructions{"\u200B"}
              </CardTitle>
              <CardDescription>
                Specific decision criteria or question Jev should resolve.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Input
                value={instructions}
                onChange={(e) => setInstructions(e.target.value)}
                placeholder="e.g. Rate how closely this relates to organization tools"
                className="text-xs rounded-lg h-9 border-input focus:ring-1 focus:ring-ring"
              />
            </CardContent>
          </Card>

          {/* Ordered Rubric Legend */}
          <Card className="rounded-lg border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <span>Rubric Levels ({rubric.length})</span>
                  </CardTitle>
                  <CardDescription>
                    Ordered evaluation tiers scored from low to high.
                  </CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                {rubric.length === 0 ? (
                  <div className="p-4 text-center text-xs text-muted-foreground border border-dashed border-border rounded-lg">
                    No rubric levels configured. Select a preset above or add a custom level below.
                  </div>
                ) : (
                  rubric.map((desc, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 p-2 rounded-lg border border-border bg-muted/20 text-xs"
                    >
                      <Badge variant="secondary" className="font-mono shrink-0 rounded-md">
                        Tier {idx}
                      </Badge>
                      <span className="flex-1 truncate text-foreground">{desc}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveRubricLevel(idx)}
                        disabled={rubric.length <= 2}
                        className="h-6 w-6 text-muted-foreground hover:text-destructive rounded-md"
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))
                )}
              </div>

              {/* Add level */}
              <div className="flex gap-2 pt-2">
                <Input
                  value={newLevelText}
                  onChange={(e) => setNewLevelText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddRubricLevel()}
                  placeholder="Add custom rubric level..."
                  className="text-xs h-8 rounded-lg"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleAddRubricLevel}
                  className="text-xs h-8 shrink-0 rounded-md"
                >
                  <Plus className="h-3.5 w-3.5 mr-1" />
                  Add Level
                </Button>
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              {error}
            </div>
          )}

          <div className="flex gap-3">
            <Button
              data-testid="score-submit-btn"
              variant="primary"
              size="lg"
              onClick={handleExecute}
              isLoading={isLoading}
              className="flex-1 font-semibold shadow-md rounded-md"
            >
              <Play className="h-4 w-4 mr-2 fill-current" />
              Score on Rubric
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                const presetToApply = selectedPreset || "organization-relevance-score";
                handleApplyPreset(presetToApply);
                if (onPresetChange) onPresetChange(presetToApply);
              }}
              title="Reset"
              className="rounded-md"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* Right Column: Score Results */}
        <div className="lg:col-span-6 space-y-5">
          <Card className="h-full border-border rounded-lg">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <Award className="h-5 w-5 text-foreground" />
                  Score Rating Verdict
                </CardTitle>
                {latencyMs !== null && (
                  <Badge variant="secondary" className="font-mono text-xs rounded-md">
                    {latencyMs}ms
                  </Badge>
                )}
              </div>
            </CardHeader>

            <CardContent className="pt-6 space-y-6">
              {!result && !isLoading && (
                <div className="py-20 text-center space-y-3">
                  <div className="mx-auto w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                    <Award className="h-6 w-6" />
                  </div>
                  <h4 className="font-medium text-sm text-foreground">
                    Ready to score
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Score evaluates inputs along a continuous rubric and identifies the exact matching level with calibrated certainty.
                  </p>
                </div>
              )}

              {isLoading && (
                <div className="py-20 text-center space-y-4">
                  <div className="mx-auto w-12 h-12 rounded-lg bg-muted flex items-center justify-center text-foreground animate-pulse">
                    <Sparkles className="h-6 w-6" />
                  </div>
                  <div>
                    <h4 className="font-medium text-sm text-foreground">
                      Jev is assessing rubric position...
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Calculating probability distribution across {rubric.length} tiers
                    </p>
                  </div>
                </div>
              )}

              {result && !isLoading && (
                <div className="space-y-6">
                  {/* Single Clean Score Banner */}
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-2">
                    <div className="flex items-center justify-between">
                      <Badge variant="success" className="text-xs font-mono font-bold rounded-md">
                        Level {result.score}
                      </Badge>
                      <span className="text-xs font-mono text-muted-foreground">
                        {(result.confidence * 100).toFixed(1)}% Confidence
                      </span>
                    </div>
                    <div className="text-xl font-bold text-foreground">
                      {result.scoreLabel}
                    </div>
                  </div>

                  {/* Single Ordered Rubric Distribution List */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                      Rubric Distribution ({rubric.length} levels)
                    </h4>
                    <div className="space-y-2">
                      {rubric.map((desc, idx) => {
                        const isChosen = idx === result.score;
                        const prob = result.probabilities[String(idx)] ?? 0;
                        return (
                          <div
                            key={idx}
                            className={`p-3 rounded-lg border text-xs space-y-1.5 transition-all ${
                              isChosen
                                ? "border-emerald-500/40 bg-emerald-500/10 shadow-xs"
                                : "border-border/60 bg-muted/20 opacity-70"
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <span className="font-medium flex items-center gap-2">
                                <Badge
                                  variant={isChosen ? "success" : "outline"}
                                  className="text-xs py-0 rounded-md"
                                >
                                  Tier {idx}
                                </Badge>
                                <span className="text-foreground">{desc}</span>
                              </span>
                              <span className="font-mono font-semibold text-foreground">
                                {(prob * 100).toFixed(1)}%
                              </span>
                            </div>
                            <div className="w-full bg-muted rounded-md h-1.5 overflow-hidden">
                              <div
                                className={`h-full rounded-md transition-all duration-500 ${
                                  isChosen ? "bg-emerald-500" : "bg-muted-foreground/30"
                                }`}
                                style={{ width: `${Math.max(prob * 100, prob > 0 ? 1 : 0)}%` }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Raw API Response Action */}
                  <div className="pt-2 border-t border-border">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setIsRawModalOpen(true)}
                      className="w-full text-xs h-8 rounded-md flex items-center justify-center gap-1.5"
                    >
                      <FileCode className="h-3.5 w-3.5" />
                      <span>View Raw API Response</span>
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Raw Response Modal */}
      <RawResponseModal
        isOpen={isRawModalOpen}
        onClose={() => setIsRawModalOpen(false)}
        data={rawResponse}
      />
    </div>
  );
}
