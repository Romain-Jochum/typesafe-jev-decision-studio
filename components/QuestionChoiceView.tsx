"use client";

import React, { useState, useEffect } from "react";
import {
  BarChart2,
  Play,
  RotateCcw,
  Sparkles,
  Layers,
  FileCode,
  CheckCircle2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { RawResponseModal } from "@/components/RawResponseModal";
import {
  SELF_HOSTED_FOLDERS,
  QUESTION_PRESETS,
} from "@/lib/jev/presets";
import type { ChoiceAnswer } from "@/lib/jev/types";

interface QuestionChoiceViewProps {
  apiKey?: string;
  baseURL?: string;
  model: string;
  isSimulated: boolean;
  selectedPreset?: string;
  onPresetChange?: (presetId: string) => void;
}

export function QuestionChoiceView({
  apiKey,
  baseURL,
  model,
  isSimulated,
  selectedPreset,
  onPresetChange,
}: QuestionChoiceViewProps) {
  // Empty by default, populated when preset is selected
  const [stateText, setStateText] = useState("");
  const [instructions, setInstructions] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [isBulkEditing, setIsBulkEditing] = useState(false);
  const [bulkText, setBulkText] = useState("");

  // Query state
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<ChoiceAnswer | null>(null);
  const [rawResponse, setRawResponse] = useState<unknown>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isRawModalOpen, setIsRawModalOpen] = useState(false);

  const handleApplyPreset = (presetId: string) => {
    const preset = QUESTION_PRESETS.choice.find((p) => p.id === presetId);
    if (!preset) return;
    setStateText(preset.state);
    setInstructions(preset.instructions);
    if (preset.options) {
      setOptions(preset.options);
      setBulkText(JSON.stringify(preset.options, null, 2));
    }
    setResult(null);
    setError(null);
  };

  useEffect(() => {
    if (selectedPreset) {
      handleApplyPreset(selectedPreset);
    }
  }, [selectedPreset]);

  const handleSaveBulkOptions = () => {
    try {
      let parsed: string[] = [];
      const trimmed = bulkText.trim();
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        parsed = JSON.parse(trimmed);
      } else {
        parsed = trimmed
          .split("\n")
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (!Array.isArray(parsed) || parsed.length === 0) {
        throw new Error("Must provide at least one option.");
      }
      setOptions(parsed);
      setIsBulkEditing(false);
      setError(null);
    } catch (e: any) {
      setError(`Invalid options format: ${e.message}`);
    }
  };

  const handleExecute = async () => {
    if (!stateText.trim()) {
      setError("Please provide application state or text context.");
      return;
    }
    if (!instructions.trim()) {
      setError("Please provide question instructions.");
      return;
    }
    if (options.length < 2) {
      setError("Choice questions require at least 2 possibilities/options.");
      return;
    }

    setIsLoading(true);
    setError(null);

    const criteriaObj: Record<string, null> = {};
    for (const opt of options) {
      criteriaObj[opt] = null;
    }

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
            predicted_choice: {
              type: "choice",
              instructions,
              criteria: criteriaObj,
            },
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Failed to evaluate decision.");
      }

      const answer = (data.answers?.predicted_choice ||
        data.answers?.predicted_folder ||
        Object.values(data.answers || {})[0]) as ChoiceAnswer;
      if (!answer) {
        throw new Error("No answer returned from decision engine.");
      }

      // Ensure rankedOptions is populated if missing
      if (!answer.rankedOptions && answer.probabilities) {
        answer.rankedOptions = Object.entries(answer.probabilities)
          .sort(([, a], [, b]) => b - a)
          .map(([option, prob]) => ({
            option,
            probability: prob,
            percentage: `${(prob * 100).toFixed(1)}%`,
            isWinner: option === answer.choice,
          }));
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
          {/* State / Context Input */}
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

          {/* Instructions Input */}
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
                placeholder="e.g. What is the most probable folder to contain self hosted projects about this topic?"
                className="text-xs rounded-lg h-9 border-input focus:ring-1 focus:ring-ring"
              />
            </CardContent>
          </Card>

          {/* Candidate Options */}
          <Card className="rounded-lg border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <span>Candidate Options ({options.length})</span>
                  </CardTitle>
                  <CardDescription>
                    Possible discrete classifications for Jev to select from.
                  </CardDescription>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsBulkEditing(!isBulkEditing)}
                  className="text-xs h-7 rounded-md"
                >
                  <Layers className="h-3.5 w-3.5 mr-1" />
                  {isBulkEditing ? "Cancel Edit" : "Bulk Edit JSON"}
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {result ? (
                <div className="p-3 rounded-lg bg-muted/20 border border-border text-xs text-muted-foreground flex items-center justify-between">
                  <span>{options.length} options evaluated</span>
                  <Badge variant="outline" className="text-xs font-mono rounded-md">
                    Active Results
                  </Badge>
                </div>
              ) : isBulkEditing ? (
                <div className="space-y-2">
                  <Textarea
                    value={bulkText}
                    onChange={(e) => setBulkText(e.target.value)}
                    rows={8}
                    className="font-mono text-xs rounded-lg"
                    placeholder='["Option 1", "Option 2"]'
                  />
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={handleSaveBulkOptions}
                      className="text-xs rounded-md"
                    >
                      Save Possibilities
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto rounded-lg border border-border p-2 space-y-1 bg-muted/20">
                  {options.length === 0 ? (
                    <div className="p-4 text-center text-xs text-muted-foreground">
                      No candidate options added yet. Select a preset above or click "Bulk Edit JSON" to add options.
                    </div>
                  ) : (
                    options.map((opt) => (
                      <div
                        key={opt}
                        className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-md hover:bg-muted/80 text-foreground transition-colors font-mono"
                      >
                        <span className="truncate pr-2">{opt}</span>
                        {opt === "Task Management & To-do Lists" && (
                          <Badge variant="outline" className="text-xs py-0 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 bg-emerald-500/10 rounded-md">
                            Target Match
                          </Badge>
                        )}
                      </div>
                    ))
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Error notice */}
          {error && (
            <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-xs">
              {error}
            </div>
          )}

          {/* Submit Button */}
          <div className="flex gap-3">
            <Button
              variant="primary"
              size="lg"
              onClick={handleExecute}
              isLoading={isLoading}
              className="flex-1 font-semibold shadow-md rounded-md"
            >
              <Play className="h-4 w-4 mr-2 fill-current" />
              Ask Jev to Choose
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                const presetToApply = selectedPreset || "self-hosted-folders";
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

        {/* Right Column: Exact Results & Probabilities */}
        <div className="lg:col-span-6 space-y-5">
          <Card className="h-full border-border rounded-lg">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <BarChart2 className="h-5 w-5 text-foreground" />
                    Decision Results
                  </CardTitle>
                  <CardDescription>
                    Calibrated choice and complete probability distribution.
                  </CardDescription>
                </div>
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
                    <BarChart2 className="h-6 w-6" />
                  </div>
                  <h4 className="font-medium text-sm text-foreground">
                    Ready to evaluate
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Click &quot;Ask Jev to Choose&quot; to score all {options.length} options
                    against your application state.
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
                      Jev is evaluating candidate choices...
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Running System One parallel classification pass
                    </p>
                  </div>
                </div>
              )}

              {result && !isLoading && (
                <div className="space-y-6">
                  {/* Top Choice Winner Banner */}
                  <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                        Top Choice
                      </span>
                      <Badge variant="success" className="text-xs font-mono font-bold rounded-md">
                        Winner
                      </Badge>
                    </div>
                    <div className="flex items-baseline justify-between gap-2">
                      <div className="text-xl sm:text-2xl font-bold text-foreground flex items-center gap-2">
                        <CheckCircle2 className="h-6 w-6 text-emerald-500 shrink-0" />
                        <span>Winner: {result.choice}</span>
                      </div>
                      <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 dark:text-emerald-400 font-mono">
                        {(result.confidence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Ranked #1 out of {result.rankedOptions?.length || options.length} candidates with calibrated certainty.
                    </p>
                  </div>

                  {/* ONE Unified Scrollable Ranked List */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Candidate Ranking ({result.rankedOptions?.length || 0})
                      </h4>
                    </div>

                    <div className="max-h-96 overflow-y-auto pr-1 space-y-2">
                      {result.rankedOptions?.map((item, idx) => (
                        <div
                          key={item.option}
                          className={`p-3 rounded-lg border text-xs space-y-1.5 transition-colors ${
                            item.isWinner
                              ? "border-emerald-500/40 bg-emerald-500/10"
                              : "border-border/80 bg-muted/20"
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span className="font-medium flex items-center gap-2 min-w-0 pr-2">
                              <span className="text-muted-foreground font-mono shrink-0">
                                #{idx + 1}
                              </span>
                              <span className="truncate text-foreground">{item.option}</span>
                              {item.isWinner && (
                                <Badge variant="success" className="text-xs py-0 px-1.5 h-4 shrink-0 rounded-md">
                                  Winner
                                </Badge>
                              )}
                            </span>
                            <span className="font-mono font-semibold text-foreground shrink-0">
                              {item.percentage}
                            </span>
                          </div>

                          {/* Probability Bar */}
                          <div className="w-full bg-muted rounded-md h-1.5 overflow-hidden">
                            <div
                              className={`h-full rounded-md transition-all duration-500 ${
                                item.isWinner ? "bg-emerald-500" : "bg-muted-foreground/30"
                              }`}
                              style={{ width: `${Math.max(item.probability * 100, item.probability > 0 ? 1 : 0)}%` }}
                            />
                          </div>
                        </div>
                      ))}
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
