import type {
  JevDecisionsRequest,
  NormalizedDecisionsResult,
  ChoiceAnswer,
  NoulAnswer,
  ScoreAnswer,
  RankedOption,
  QuestionDefinition,
} from "./types";

export const DEFAULT_OPENROUTER_BASE_URL = "https://openrouter.ai/api";
export const DEFAULT_JEV_MODEL = "typesafe/jev-1.13";

export interface QueryJevOptions {
  apiKey?: string;
  baseURL?: string;
  model?: string;
  request: JevDecisionsRequest;
  useSimulationIfNoKey?: boolean;
}

/**
 * Format questions into the exact schema expected by OpenRouter Decisions API
 */
export function formatDecisionsPayload(req: JevDecisionsRequest): {
  model: string;
  state: unknown;
  questions: Record<string, unknown>;
} {
  const model = req.model || DEFAULT_JEV_MODEL;
  const questions: Record<string, unknown> = {};

  for (const [key, q] of Object.entries(req.questions)) {
    if (q.type === "choice") {
      let criteria = q.criteria;
      if (Array.isArray(criteria)) {
        const obj: Record<string, null> = {};
        for (const item of criteria) {
          obj[item] = null;
        }
        criteria = obj;
      }
      questions[key] = {
        type: "choice",
        instructions: q.instructions,
        criteria: criteria || {},
      };
    } else if (q.type === "noul") {
      questions[key] = {
        type: "noul",
        instructions: q.instructions,
      };
    } else if (q.type === "score") {
      questions[key] = {
        type: "score",
        instructions: q.instructions,
        criteria: q.criteria,
      };
    }
  }

  return {
    model,
    state: req.state,
    questions,
  };
}

/**
 * Normalizes raw responses from the OpenRouter decisions endpoint into typed representations
 */
export function normalizeDecisionsResponse(raw: {
  answers?: Record<string, any>;
  model?: string;
}): NormalizedDecisionsResult {
  const normalizedAnswers: Record<string, any> = {};
  const rawAnswers = raw.answers || {};

  for (const [key, ans] of Object.entries(rawAnswers)) {
    if (!ans) continue;

    if (ans.type === "choice" || ans.choice !== undefined) {
      const choice = String(ans.choice || "");
      const confidence = typeof ans.confidence === "number" ? ans.confidence : 1.0;
      const probabilities: Record<string, number> = ans.probabilities || {};

      // Build ranked options list sorted by probability descending
      const entries = Object.entries(probabilities);
      if (entries.length === 0 && choice) {
        entries.push([choice, confidence]);
      }

      entries.sort((a, b) => b[1] - a[1]);

      const rankedOptions: RankedOption[] = entries.map(([opt, prob]) => ({
        option: opt,
        probability: prob,
        percentage: `${(prob * 100).toFixed(1)}%`,
        isWinner: opt === choice,
      }));

      const choiceAnswer: ChoiceAnswer = {
        type: "choice",
        choice,
        confidence,
        probabilities,
        rankedOptions,
      };
      normalizedAnswers[key] = choiceAnswer;
    } else if (ans.type === "noul" || ans.noul !== undefined) {
      const probYes = typeof ans.noul === "number" ? ans.noul : 0.5;
      const verdict = probYes >= 0.5;
      const noulAnswer: NoulAnswer = {
        type: "noul",
        noul: probYes,
        verdict,
        percentage: `${(probYes * 100).toFixed(1)}%`,
      };
      normalizedAnswers[key] = noulAnswer;
    } else if (ans.type === "score" || ans.score !== undefined) {
      const scoreIndex = typeof ans.score === "number" ? ans.score : 0;
      const legend: string[] = ans.legend || [];
      const scoreLabel =
        legend[scoreIndex] || `Level ${scoreIndex}`;
      const confidence = typeof ans.confidence === "number" ? ans.confidence : 1.0;
      const probabilities: Record<string, number> = ans.probabilities || {};

      const scoreAnswer: ScoreAnswer = {
        type: "score",
        score: scoreIndex,
        scoreLabel,
        confidence,
        probabilities,
        legend,
      };
      normalizedAnswers[key] = scoreAnswer;
    }
  }

  return {
    model: raw.model,
    answers: normalizedAnswers,
    raw,
  };
}

/**
 * Execute query against OpenRouter Decisions API or fallback to simulated decision if offline
 */
export async function queryJevDecisions(
  options: QueryJevOptions
): Promise<NormalizedDecisionsResult> {
  const { apiKey, baseURL = DEFAULT_OPENROUTER_BASE_URL, request, useSimulationIfNoKey } = options;

  if (!apiKey) {
    if (useSimulationIfNoKey) {
      return simulateOfflineDecision(request);
    }
    throw new Error(
      "Missing OpenRouter API Key. Please provide it in your .env file as OPENROUTER_API_KEY or configure it in the web UI settings."
    );
  }

  const endpoint = `${baseURL.replace(/\/+$/, "")}/alpha/decisions`;
  const payload = formatDecisionsPayload(request);

  const startTime = Date.now();
  const response = await fetch(endpoint, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://github.com/typesafe-ai/jev",
      "X-Title": "Jev Studio Web UI",
    },
    body: JSON.stringify(payload),
  });

  const latencyMs = Date.now() - startTime;

  if (!response.ok) {
    let errorDetails = `HTTP ${response.status} ${response.statusText}`;
    try {
      const errJson = await response.json();
      if (errJson.error?.message) {
        errorDetails = errJson.error.message;
      }
    } catch {
      // Ignore json parse error
    }
    throw new Error(`OpenRouter Decisions API error: ${errorDetails}`);
  }

  const rawJson = await response.json();
  const normalized = normalizeDecisionsResponse(rawJson);
  normalized.latencyMs = latencyMs;
  return normalized;
}

/**
 * High-fidelity offline simulation for testing and local development
 */
export function simulateOfflineDecision(
  request: JevDecisionsRequest
): NormalizedDecisionsResult {
  const answers: Record<string, any> = {};
  const stateStr =
    typeof request.state === "string"
      ? request.state.toLowerCase()
      : JSON.stringify(request.state).toLowerCase();

  for (const [key, q] of Object.entries(request.questions)) {
    if (q.type === "choice") {
      let options: string[] = [];
      if (Array.isArray(q.criteria)) {
        options = q.criteria;
      } else if (q.criteria) {
        options = Object.keys(q.criteria);
      }

      // Semantic matching heuristic
      let bestOpt = options[0] || "Unknown";
      let maxScore = -1;
      const rawScores: Record<string, number> = {};

      for (const opt of options) {
        const optLower = opt.toLowerCase();
        let score = 0.05; // Base prior

        // Words intersection
        const optWords = optLower.split(/[\s,&/\\-]+/).filter(Boolean);
        for (const word of optWords) {
          if (word.length > 2 && stateStr.includes(word)) {
            score += 2.0;
          }
        }

        // Domain-specific boosts for known terms
        if (
          (stateStr.includes("to-do") ||
            stateStr.includes("organization") ||
            stateStr.includes("tracker")) &&
          optLower.includes("task management & to-do")
        ) {
          score += 15.0;
        }
        if (
          (stateStr.includes("invoice") || stateStr.includes("refund")) &&
          optLower.includes("billing")
        ) {
          score += 10.0;
        }
        if (
          (stateStr.includes("usestate") || stateStr.includes("const")) &&
          optLower.includes("typescript")
        ) {
          score += 10.0;
        }

        rawScores[opt] = score;
        if (score > maxScore) {
          maxScore = score;
          bestOpt = opt;
        }
      }

      // Convert scores to softmax probabilities
      const sumExp = Object.values(rawScores).reduce(
        (sum, s) => sum + Math.exp(Math.min(s, 20)),
        0
      );
      const probabilities: Record<string, number> = {};
      const ranked: RankedOption[] = [];

      for (const opt of options) {
        const prob = Math.round((Math.exp(Math.min(rawScores[opt], 20)) / sumExp) * 1000) / 1000;
        probabilities[opt] = prob;
        ranked.push({
          option: opt,
          probability: prob,
          percentage: `${(prob * 100).toFixed(1)}%`,
          isWinner: opt === bestOpt,
        });
      }

      ranked.sort((a, b) => b.probability - a.probability);
      const confidence = ranked[0]?.probability || 0.95;

      answers[key] = {
        type: "choice",
        choice: bestOpt,
        confidence,
        probabilities,
        rankedOptions: ranked,
      };
    } else if (q.type === "noul") {
      let pYes = 0.15;
      const instructionsLower = q.instructions.toLowerCase();

      if (
        (stateStr.includes("to-do") || stateStr.includes("organization")) &&
        (instructionsLower.includes("task") || instructionsLower.includes("to-do"))
      ) {
        pYes = 0.985;
      } else if (
        stateStr.includes("urgent") ||
        stateStr.includes("outage") ||
        stateStr.includes("500") ||
        stateStr.includes("fail")
      ) {
        pYes = 0.972;
      } else if (
        stateStr.includes("breach") ||
        stateStr.includes("plaintext") ||
        stateStr.includes("leak")
      ) {
        pYes = 0.965;
      }

      answers[key] = {
        type: "noul",
        noul: pYes,
        verdict: pYes >= 0.5,
        percentage: `${(pYes * 100).toFixed(1)}%`,
      };
    } else if (q.type === "score") {
      const legend = q.criteria || [];
      const scoreIndex = Math.min(legend.length - 1, Math.max(0, legend.length - 1));
      const probabilities: Record<string, number> = {};

      for (let i = 0; i < legend.length; i++) {
        probabilities[String(i)] = i === scoreIndex ? 0.88 : 0.12 / (legend.length - 1 || 1);
      }

      answers[key] = {
        type: "score",
        score: scoreIndex,
        scoreLabel: legend[scoreIndex] || `Level ${scoreIndex}`,
        confidence: 0.88,
        probabilities,
        legend,
      };
    }
  }

  return {
    model: `${request.model || DEFAULT_JEV_MODEL} (simulation)`,
    answers,
    latencyMs: 85,
    raw: { simulated: true },
  };
}
