/* eslint-disable shadcn/no-arbitrary-values */
"use client";

import React, { useState } from "react";
import { X, Copy, Check, FileCode } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface RawResponseModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: unknown;
  title?: string;
}

export function RawResponseModal({
  isOpen,
  onClose,
  data,
  title = "Raw Jev API Response",
}: RawResponseModalProps) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    try {
      const text = typeof data === "string" ? data : JSON.stringify(data, null, 2);
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
      <div className="w-full max-w-2xl bg-card border border-border rounded-lg shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2">
            <FileCode className="h-5 w-5 text-foreground" />
            <h3 className="text-base md:text-lg font-semibold text-foreground">
              {title}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="text-xs h-8 rounded-md flex items-center gap-1.5"
            >
              {copied ? (
                <Check className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <Copy className="h-3.5 w-3.5" />
              )}
              <span>{copied ? "Copied!" : "Copy JSON"}</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="h-8 w-8 rounded-md"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="p-6 overflow-hidden flex flex-col flex-1">
          <pre className="font-mono text-xs overflow-auto max-h-[70vh] p-4 bg-muted/50 rounded-lg text-foreground">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}
