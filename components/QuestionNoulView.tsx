"use client";

import React, { useState, useEffect } from "react";
import {
  CheckCircle2,
  XCircle,
  Play,
  RotateCcw,
  Sparkles,
  FileCode,
  Sliders,
  TrendingUp,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { RawResponseModal } from "@/components/RawResponseModal";
import { QUESTION_PRESETS } from "@/lib/jev/presets";
import {
  VALIDATION_CURVES,
  applyValidationCurve,
  evaluateNoulVerdict,
  type ValidationCurveType,
} from "@/lib/jev/calibration";
import type { NoulAnswer } from "@/lib/jev/types";

interface QuestionNoulViewProps {
  apiKey?: string;
  baseURL?: string;
  model: string;
  isSimulated: boolean;
  selectedPreset?: string;
  onPresetChange?: (presetId: string) => void;
}

export function QuestionNoulView({
  apiKey,
  baseURL,
  model,
  isSimulated,
  selectedPreset,
  onPresetChange,
}: QuestionNoulViewProps) {
  const [stateText, setStateText] = useState("");
  const [instructions, setInstructions] = useState("");
  const [threshold, setThreshold] = useState(0.5);
  const [activeCurve, setActiveCurve] = useState<ValidationCurveType>("linear");

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<NoulAnswer | null>(null);
  const [rawResponse, setRawResponse] = useState<unknown>(null);
  const [latencyMs, setLatencyMs] = useState<number | null>(null);
  const [isRawModalOpen, setIsRawModalOpen] = useState(false);

  const handleApplyPreset = (presetId: string) => {
    const preset = QUESTION_PRESETS.noul.find((p) => p.id === presetId);
    if (!preset) return;
    setStateText(preset.state);
    setInstructions(preset.instructions);
    setResult(null);
    setError(null);
  };

  useEffect(() => {
    if (selectedPreset) {
      handleApplyPreset(selectedPreset);
    }
  }, [selectedPreset]);

  const handleExecute = async () => {
    if (!stateText.trim()) {
      setError("Please provide application state or context.");
      return;
    }
    if (!instructions.trim()) {
      setError("Please provide question instructions.");
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
            boolean_check: {
              type: "noul",
              instructions,
            },
          },
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Evaluation failed");
      }

      const answer = (data.answers?.boolean_check ||
        Object.values(data.answers || {})[0]) as NoulAnswer;
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

  // Evaluate verdict considering validation curve and threshold
  const evaluation = result
    ? evaluateNoulVerdict(result.noul, threshold, activeCurve)
    : null;
  const effectiveVerdict = evaluation ? evaluation.verdict : false;

  // Generate SVG curve points (viewBox 0 0 300 120)
  // X: 30 to 280 (width 250)
  // Y: 95 (y=0) to 15 (y=1) (height 80)
  const curvePoints: string[] = [];
  for (let i = 0; i <= 50; i++) {
    const x = i / 50;
    const y = applyValidationCurve(x, activeCurve);
    const px = 30 + x * 250;
    const py = 95 - y * 80;
    curvePoints.push(`${i === 0 ? "M" : "L"} ${px.toFixed(1)} ${py.toFixed(1)}`);
  }
  const curvePathD = curvePoints.join(" ");
  const threshSvgX = 30 + threshold * 250;

  // Active answer point on curve
  const dotX = result ? 30 + result.noul * 250 : null;
  const dotY = result
    ? 95 - applyValidationCurve(result.noul, activeCurve) * 80
    : null;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form & Inputs */}
        <div className="lg:col-span-6 space-y-5">
          {/* Context / State */}
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

          {/* Question Instructions */}
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
                placeholder="e.g. Does this topic describe a task management or to-do tracking system?"
                className="text-xs rounded-lg h-9 border-input focus:ring-1 focus:ring-ring"
              />
            </CardContent>
          </Card>

          {/* Validation Curve & Decision Threshold */}
          <Card className="rounded-lg border-border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-foreground" />
                    <span>Validation Curve &amp; Threshold</span>
                  </CardTitle>
                  <CardDescription>
                    Probability cutoff and calibration curve for binary evaluation.
                  </CardDescription>
                </div>
                <Badge variant="outline" className="font-mono text-xs rounded-md">
                  {(threshold * 100).toFixed(0)}% Cutoff
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Curve Selection Buttons */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-foreground flex items-center justify-between">
                  <span>Curve Selection</span>
                  <span className="font-mono text-xs text-muted-foreground">
                    {VALIDATION_CURVES.find((c) => c.id === activeCurve)?.desc}
                  </span>
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {VALIDATION_CURVES.map((curve) => (
                    <Button
                      key={curve.id}
                      variant={activeCurve === curve.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveCurve(curve.id)}
                      className={`text-xs h-8 rounded-md ${
                        activeCurve === curve.id ? "font-semibold shadow-xs" : ""
                      }`}
                    >
                      {curve.name.split(" ")[0]}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Threshold Slider */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                    <Sliders className="h-3.5 w-3.5 text-foreground" />
                    Decision Threshold
                  </span>
                  <span className="font-mono text-xs font-bold text-foreground">
                    {(threshold * 100).toFixed(0)}%
                  </span>
                </div>
                <input
                  type="range"
                  min="0.05"
                  max="0.95"
                  step="0.05"
                  value={threshold}
                  onChange={(e) => setThreshold(parseFloat(e.target.value))}
                  className="w-full h-2 bg-muted rounded-md appearance-none cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground font-mono">
                  <span>5% (Permissive)</span>
                  <span>50% (Standard)</span>
                  <span>95% (Strict)</span>
                </div>
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
              variant="primary"
              size="lg"
              onClick={handleExecute}
              isLoading={isLoading}
              className="flex-1 font-semibold shadow-md rounded-md"
            >
              <Play className="h-4 w-4 mr-2 fill-current" />
              Evaluate Noul Condition
            </Button>
            <Button
              variant="outline"
              size="lg"
              onClick={() => {
                const presetToApply = selectedPreset || "todo-relevance-check";
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

        {/* Right Column: Results */}
        <div className="lg:col-span-6 space-y-5">
          <Card className="h-full border-border rounded-lg">
            <CardHeader className="pb-3 border-b border-border/50">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base font-semibold flex items-center gap-2">
                  <CheckCircle2 className="h-5 w-5 text-foreground" />
                  Decision Verdict
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
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <h4 className="font-medium text-sm text-foreground">
                    Ready to test condition
                  </h4>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto">
                    Noul returns calibrated probability scores between 0.0 and 1.0 for binary conditions.
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
                      Jev is evaluating boolean probability...
                    </h4>
                    <p className="text-xs text-muted-foreground mt-1">
                      Calibrating p(yes) against prompt instructions
                    </p>
                  </div>
                </div>
              )}

              {result && !isLoading && evaluation && (
                <div className="space-y-6">
                  {/* Single Clear Verdict Banner */}
                  <div
                    className={`rounded-lg border p-6 text-center space-y-3 ${
                      effectiveVerdict
                        ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                        : "border-destructive/30 bg-destructive/10 text-destructive"
                    }`}
                  >
                    <div className="flex justify-center">
                      {effectiveVerdict ? (
                        <CheckCircle2 className="h-14 w-14" />
                      ) : (
                        <XCircle className="h-14 w-14" />
                      )}
                    </div>
                    <div className="text-3xl font-extrabold tracking-tight">
                      {effectiveVerdict ? "YES / TRUE" : "NO / FALSE"}
                    </div>
                    <div className="flex items-center justify-center gap-3 text-xs font-mono">
                      <span>
                        Calibrated Probability:{" "}
                        <span className="font-bold text-foreground text-sm">
                          {evaluation.percentage}
                        </span>
                      </span>
                      <span className="text-muted-foreground">•</span>
                      <span>
                        Threshold Cutoff:{" "}
                        <span className="font-bold text-foreground text-sm">
                          {(threshold * 100).toFixed(0)}%
                        </span>
                      </span>
                    </div>
                  </div>

                  {/* Mathematical Curve Visualization (interactive SVG) */}
                  <div className="p-4 rounded-lg border border-border bg-muted/20 space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-foreground">Mathematical Calibration Curve</span>
                      <span className="font-mono text-muted-foreground text-xs">
                        f(p) mapping [0, 1]
                      </span>
                    </div>
                    <svg
                      viewBox="0 0 300 120"
                      className="w-full h-32 bg-card rounded-md border border-border/60"
                    >
                      {/* Grid Lines */}
                      <line x1="30" y1="95" x2="280" y2="95" stroke="currentColor" strokeWidth="1" className="text-border" />
                      <line x1="30" y1="15" x2="280" y2="15" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" className="text-border/50" />
                      <line x1="30" y1="15" x2="30" y2="95" stroke="currentColor" strokeWidth="1" className="text-border" />
                      <line x1="280" y1="15" x2="280" y2="95" stroke="currentColor" strokeWidth="1" strokeDasharray="2,2" className="text-border/50" />

                      {/* Reference diagonal y = x */}
                      <line x1="30" y1="95" x2="280" y2="15" stroke="currentColor" strokeWidth="1" strokeDasharray="3,3" className="text-muted-foreground/30" />

                      {/* Threshold Line */}
                      <line
                        x1={threshSvgX}
                        y1="15"
                        x2={threshSvgX}
                        y2="95"
                        stroke="#f59e0b"
                        strokeWidth="1.5"
                        strokeDasharray="3,3"
                      />
                      <text
                        x={threshSvgX}
                        y="12"
                        textAnchor="middle"
                        fill="#f59e0b"
                        fontSize="9"
                        className="font-mono font-semibold"
                      >
                        cutoff {(threshold * 100).toFixed(0)}%
                      </text>

                      {/* Validation Curve Path */}
                      <path
                        d={curvePathD}
                        fill="none"
                        stroke="currentColor"
                        strokeWidth="2"
                        strokeLinecap="round"
                        className="text-foreground"
                      />

                      {/* Landing Dot if answer exists */}
                      {dotX !== null && dotY !== null && (
                        <g>
                          <circle
                            cx={dotX}
                            cy={dotY}
                            r="8"
                            className="fill-emerald-500/25 animate-pulse"
                          />
                          <circle
                            cx={dotX}
                            cy={dotY}
                            r="4.5"
                            fill="#10b981"
                            stroke="#ffffff"
                            strokeWidth="1.5"
                          />
                        </g>
                      )}

                      {/* Axis labels */}
                      <text x="30" y="107" textAnchor="middle" fontSize="9" className="fill-muted-foreground font-mono">0</text>
                      <text x="155" y="107" textAnchor="middle" fontSize="9" className="fill-muted-foreground font-mono">0.5</text>
                      <text x="280" y="107" textAnchor="middle" fontSize="9" className="fill-muted-foreground font-mono">1.0</text>
                      <text x="18" y="98" textAnchor="end" fontSize="9" className="fill-muted-foreground font-mono">0</text>
                      <text x="18" y="20" textAnchor="end" fontSize="9" className="fill-muted-foreground font-mono">1</text>
                    </svg>
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
