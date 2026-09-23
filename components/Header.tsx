"use client";

import React from "react";
import { Settings2, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface HeaderProps {
  hasApiKey: boolean;
  keySource?: string;
  keyPreview?: string;
  isSimulated: boolean;
  model: string;
  theme: "dark" | "light";
  onToggleTheme: () => void;
  onOpenSettings: () => void;
}

export function Header({
  hasApiKey,
  keySource,
  keyPreview,
  model,
  theme,
  onToggleTheme,
  onOpenSettings,
}: HeaderProps) {
  const keyLabel = `Key: ${keySource || ".env"}${keyPreview ? ` (${keyPreview})` : ""}`;

  return (
    <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-40 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo */}
        <div className="flex items-center space-x-3">
          <div className="h-9 w-9 rounded-lg overflow-hidden border border-border bg-card flex items-center justify-center shadow-xs shrink-0">
            <img src="/logo.png" alt="TypeSafe Jev Logo" className="h-full w-full object-cover" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <span className="font-semibold text-base tracking-tight text-foreground">Jev Studio</span>
              <Badge variant="outline" className="text-xs font-mono font-medium rounded-md px-1.5 py-0 border-border text-muted-foreground">
                System One
              </Badge>
            </div>
            <p className="text-xs text-muted-foreground hidden sm:block">
              Fast, calibrated decisions via OpenRouter •{" "}
              <span className="font-mono">{model}</span>
            </p>
          </div>
        </div>

        {/* Status & Actions */}
        <div className="flex items-center space-x-2 sm:space-x-3">
          {hasApiKey ? (
            <Badge
              variant="success"
              className="hidden sm:inline-flex items-center gap-1.5 py-1 px-2.5 text-xs font-medium rounded-md bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 border border-emerald-500/30"
            >
              <span className="h-2 w-2 rounded-full bg-emerald-500 shrink-0" />
              <span>{keyLabel}</span>
            </Badge>
          ) : (
            <Badge
              variant="outline"
              className="hidden sm:inline-flex items-center gap-1.5 py-1 px-2.5 text-xs font-medium rounded-md text-amber-600 dark:text-amber-400 border-amber-500/30 bg-amber-500/10"
            >
              <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
              <span>No Key (.env)</span>
            </Badge>
          )}

          <Button
            variant="ghost"
            size="icon"
            onClick={onToggleTheme}
            title={theme === "dark" ? "Switch to Light mode" : "Switch to Dark mode"}
            aria-label="Toggle theme"
            className="rounded-md"
          >
            {theme === "dark" ? (
              <Sun className="h-4 w-4" />
            ) : (
              <Moon className="h-4 w-4" />
            )}
          </Button>

          <Button
            variant="outline"
            size="sm"
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 rounded-md"
          >
            <Settings2 className="h-4 w-4" />
            <span className="hidden sm:inline">Settings</span>
          </Button>
        </div>
      </div>
    </header>
  );
}
