"use client";

import React, { useState } from "react";
import { X, Key, Globe, Cpu, Check, AlertCircle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  apiKey: string;
  onSaveApiKey: (key: string) => void;
  baseURL: string;
  onSaveBaseURL: (url: string) => void;
  model: string;
  onSaveModel: (model: string) => void;
  isSimulated: boolean;
  onToggleSimulated: (enabled: boolean) => void;
}

export function SettingsModal({
  isOpen,
  onClose,
  apiKey,
  onSaveApiKey,
  baseURL,
  onSaveBaseURL,
  model,
  onSaveModel,
  isSimulated,
  onToggleSimulated,
}: SettingsModalProps) {
  const [localApiKey, setLocalApiKey] = useState(apiKey);
  const [localBaseURL, setLocalBaseURL] = useState(baseURL);
  const [localModel, setLocalModel] = useState(model);
  const [localSimulated, setLocalSimulated] = useState(isSimulated);
  const [testStatus, setTestStatus] = useState<
    "idle" | "testing" | "success" | "error"
  >("idle");
  const [testMessage, setTestMessage] = useState<string>("");

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveApiKey(localApiKey.trim());
    onSaveBaseURL(localBaseURL.trim());
    onSaveModel(localModel.trim());
    onToggleSimulated(localSimulated);
    onClose();
  };

  const handleTestConnection = async () => {
    setTestStatus("testing");
    setTestMessage("");
    try {
      const res = await fetch("/api/decisions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          state: "ping test",
          model: localModel,
          apiKey: localApiKey || undefined,
          baseURL: localBaseURL || undefined,
          questions: {
            ping: {
              type: "noul",
              instructions: "Is this a connection test?",
            },
          },
          useSimulationIfNoKey: localSimulated,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }

      setTestStatus("success");
      setTestMessage(
        `Connection successful! Jev answered in ${data.latencyMs || 0}ms.`
      );
    } catch (err: any) {
      setTestStatus("error");
      setTestMessage(err.message || "Connection failed.");
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <Card className="w-full max-w-lg shadow-2xl border-border bg-card rounded-lg">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Cpu className="h-5 w-5 text-foreground" />
            OpenRouter & Jev Configuration
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-md">
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-lg bg-muted/60 p-3 text-xs text-muted-foreground leading-relaxed">
            Credentials can be set either via the project{" "}
            <code className="text-foreground font-semibold">.env</code> file (as{" "}
            <code className="text-foreground font-semibold">
              OPENROUTER_API_KEY
            </code>
            ) or entered below directly in your browser.
          </div>

          <div className="flex items-center gap-4 py-0.5">
            <a
              href="https://openrouter.ai/docs"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-foreground/80 hover:text-foreground underline underline-offset-4 inline-flex items-center gap-1 transition-colors"
            >
              OpenRouter Docs
            </a>
            <a
              href="https://docs.typesafe.ai"
              target="_blank"
              rel="noreferrer"
              className="text-xs text-foreground/80 hover:text-foreground underline underline-offset-4 inline-flex items-center gap-1 transition-colors"
            >
              TypeSafe Documentation
            </a>
          </div>

          {/* API Key */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Key className="h-3.5 w-3.5 text-muted-foreground" />
              OpenRouter API Key
            </label>
            <Input
              type="password"
              placeholder="sk-or-v1-..."
              value={localApiKey}
              onChange={(e) => setLocalApiKey(e.target.value)}
              className="font-mono text-xs rounded-md"
            />
            <p className="text-xs text-muted-foreground">
              Leaves server .env precedence if left blank.
            </p>
          </div>

          {/* Model selection */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Cpu className="h-3.5 w-3.5 text-muted-foreground" />
              Model Name
            </label>
            <div className="flex gap-2">
              <Input
                type="text"
                value={localModel}
                onChange={(e) => setLocalModel(e.target.value)}
                className="font-mono text-xs flex-1 rounded-md"
              />
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLocalModel("typesafe/jev-1.13")}
                className="text-xs rounded-md"
              >
                Default
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Official: <span className="font-mono">typesafe/jev-1.13</span> or{" "}
              <span className="font-mono">~typesafe/jev-latest</span>
            </p>
          </div>

          {/* Base URL */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-foreground flex items-center gap-1.5">
              <Globe className="h-3.5 w-3.5 text-muted-foreground" />
              OpenRouter Base URL
            </label>
            <Input
              type="text"
              value={localBaseURL}
              onChange={(e) => setLocalBaseURL(e.target.value)}
              className="font-mono text-xs rounded-md"
            />
          </div>

          {/* Simulation Toggle */}
          <div className="flex items-center justify-between pt-2 border-t border-border">
            <div>
              <p className="text-xs font-semibold text-foreground">
                Offline Simulation Mode
              </p>
              <p className="text-xs text-muted-foreground">
                Test UI without spending OpenRouter credits
              </p>
            </div>
            <input
              type="checkbox"
              checked={localSimulated}
              onChange={(e) => setLocalSimulated(e.target.checked)}
              className="h-4 w-4 rounded-md border-border accent-foreground cursor-pointer"
            />
          </div>

          {/* Test Status feedback */}
          {testStatus !== "idle" && (
            <div
              className={`p-3 rounded-lg text-xs flex items-center gap-2 ${
                testStatus === "success"
                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                  : testStatus === "error"
                  ? "bg-destructive/10 text-destructive border border-destructive/20"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {testStatus === "testing" && (
                <RefreshCw className="h-3.5 w-3.5 animate-spin" />
              )}
              {testStatus === "success" && (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              )}
              {testStatus === "error" && (
                <AlertCircle className="h-3.5 w-3.5 text-destructive" />
              )}
              <span>{testMessage || "Testing connection..."}</span>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex justify-between items-center pt-3 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              onClick={handleTestConnection}
              isLoading={testStatus === "testing"}
              className="rounded-md"
            >
              Test Connection
            </Button>
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={onClose} className="rounded-md">
                Cancel
              </Button>
              <Button variant="primary" size="sm" onClick={handleSave} className="rounded-md">
                Save & Apply
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
