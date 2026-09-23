import { NextResponse } from "next/server";
import { z } from "zod";
import {
  queryJevDecisions,
  DEFAULT_OPENROUTER_BASE_URL,
  DEFAULT_JEV_MODEL,
} from "@/lib/jev/client";
import type { QuestionDefinition } from "@/lib/jev/types";

const RequestSchema = z.object({
  state: z.union([z.string(), z.record(z.unknown()), z.array(z.unknown())]),
  model: z.string().optional(),
  questions: z.record(
    z.object({
      type: z.enum(["choice", "noul", "score"]),
      instructions: z.string().min(1, "Instructions are required"),
      criteria: z.union([z.record(z.nullable(z.string())), z.array(z.string())]).optional(),
    })
  ).refine((q) => Object.keys(q).length > 0, "At least one question is required"),
  apiKey: z.string().optional(),
  baseURL: z.string().optional(),
  useSimulationIfNoKey: z.boolean().optional(),
});

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: "Invalid JSON in request body" },
        { status: 400 }
      );
    }

    const parsed = RequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        {
          error: "Validation failed",
          details: parsed.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const {
      state,
      model = process.env.JEV_MODEL || DEFAULT_JEV_MODEL,
      questions,
      apiKey = process.env.OPENROUTER_API_KEY,
      baseURL = process.env.OPENROUTER_BASE_URL || DEFAULT_OPENROUTER_BASE_URL,
      useSimulationIfNoKey = false,
    } = parsed.data;

    // Check if client provided API key in Authorization header
    const authHeader = request.headers.get("authorization");
    let effectiveApiKey = apiKey;
    if (!effectiveApiKey && authHeader?.startsWith("Bearer ")) {
      effectiveApiKey = authHeader.substring(7).trim();
    }

    const result = await queryJevDecisions({
      apiKey: effectiveApiKey,
      baseURL,
      model,
      request: {
        state,
        model,
        questions: questions as Record<string, QuestionDefinition>,
      },
      useSimulationIfNoKey,
    });

    return NextResponse.json(result);
  } catch (error: any) {
    const status = error.message?.includes("Missing OpenRouter API Key") ? 401 : 500;
    return NextResponse.json(
      { error: error.message || "An unexpected error occurred" },
      { status }
    );
  }
}

export async function GET() {
  const key = process.env.OPENROUTER_API_KEY;
  if (key) {
    return NextResponse.json({
      hasKey: true,
      source: ".env",
      keyPreview: "sk-or-v1-••••••••" + key.slice(-4),
      model: process.env.JEV_MODEL || DEFAULT_JEV_MODEL,
      baseURL: process.env.OPENROUTER_BASE_URL || DEFAULT_OPENROUTER_BASE_URL,
      status: "ready",
    });
  }

  return NextResponse.json({
    hasKey: false,
    source: "none",
    keyPreview: "",
    model: process.env.JEV_MODEL || DEFAULT_JEV_MODEL,
    baseURL: process.env.OPENROUTER_BASE_URL || DEFAULT_OPENROUTER_BASE_URL,
    status: "no_key",
  });
}

