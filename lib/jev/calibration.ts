export type ValidationCurveType = "linear" | "sigmoid" | "strict" | "permissive";

export interface ValidationCurve {
  id: ValidationCurveType;
  name: string;
  desc: string;
}

export const VALIDATION_CURVES: ValidationCurve[] = [
  {
    id: "linear",
    name: "Linear (Default)",
    desc: "Direct probability mapping f(p) = p",
  },
  {
    id: "sigmoid",
    name: "Sigmoid",
    desc: "Sharp S-curve emphasizing confident decisions",
  },
  {
    id: "strict",
    name: "Strict",
    desc: "Conservative power curve penalizing uncertainty (p^1.8)",
  },
  {
    id: "permissive",
    name: "Permissive",
    desc: "Lenient power curve (p^0.55)",
  },
];

export function applyValidationCurve(
  probability: number,
  curveType: ValidationCurveType
): number {
  if (probability < 0) return 0;
  if (probability > 1) return 1;

  let val: number;
  switch (curveType) {
    case "linear":
      val = probability;
      break;
    case "sigmoid":
      val = 1 / (1 + Math.exp(-10 * (probability - 0.5)));
      break;
    case "strict":
      val = Math.pow(probability, 1.8);
      break;
    case "permissive":
      val = Math.pow(probability, 0.55);
      break;
    default:
      val = probability;
      break;
  }

  return Math.max(0, Math.min(1, val));
}

export interface NoulVerdictResult {
  rawProbability: number;
  calibratedScore: number;
  threshold: number;
  verdict: boolean;
  percentage: string;
}

export function evaluateNoulVerdict(
  probability: number,
  threshold: number,
  curveType: ValidationCurveType = "linear"
): NoulVerdictResult {
  const calibratedScore = applyValidationCurve(probability, curveType);
  const verdict = calibratedScore >= threshold;
  const percentage = `${(calibratedScore * 100).toFixed(1)}%`;

  return {
    rawProbability: probability,
    calibratedScore,
    threshold,
    verdict,
    percentage,
  };
}
