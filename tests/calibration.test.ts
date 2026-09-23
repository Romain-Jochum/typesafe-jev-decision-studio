import { describe, it, expect } from "vitest";
import {
  applyValidationCurve,
  evaluateNoulVerdict,
  VALIDATION_CURVES,
  type ValidationCurveType,
} from "@/lib/jev/calibration";

describe("Validation Curve & Decision Threshold Engine", () => {
  it("should support the 4 standard validation curves", () => {
    expect(VALIDATION_CURVES).toHaveLength(4);
    expect(VALIDATION_CURVES.map((c) => c.id)).toEqual([
      "linear",
      "sigmoid",
      "strict",
      "permissive",
    ]);
  });

  it("should accurately compute linear curve values f(p) = p", () => {
    expect(applyValidationCurve(0.0, "linear")).toBeCloseTo(0.0, 5);
    expect(applyValidationCurve(0.5, "linear")).toBeCloseTo(0.5, 5);
    expect(applyValidationCurve(0.85, "linear")).toBeCloseTo(0.85, 5);
    expect(applyValidationCurve(1.0, "linear")).toBeCloseTo(1.0, 5);
  });

  it("should compute sigmoidal S-curve transformation with calibrated midpoint at 0.5", () => {
    const atZero = applyValidationCurve(0.0, "sigmoid");
    const atMid = applyValidationCurve(0.5, "sigmoid");
    const atOne = applyValidationCurve(1.0, "sigmoid");

    expect(atMid).toBeCloseTo(0.5, 2);
    expect(atZero).toBeLessThan(0.05);
    expect(atOne).toBeGreaterThan(0.95);
    // Sigmoid is strictly monotonic
    expect(applyValidationCurve(0.6, "sigmoid")).toBeGreaterThan(
      applyValidationCurve(0.4, "sigmoid")
    );
  });

  it("should penalize uncertain probabilities under strict conservative curve", () => {
    // Under strict curve, p=0.7 should yield a lower calibrated score than linear
    const linear = applyValidationCurve(0.7, "linear");
    const strict = applyValidationCurve(0.7, "strict");
    expect(strict).toBeLessThan(linear);
    expect(applyValidationCurve(1.0, "strict")).toBeCloseTo(1.0, 4);
    expect(applyValidationCurve(0.0, "strict")).toBeCloseTo(0.0, 4);
  });

  it("should boost moderate evidence under permissive curve", () => {
    // Under permissive curve, p=0.4 should yield a higher calibrated score than linear
    const linear = applyValidationCurve(0.4, "linear");
    const permissive = applyValidationCurve(0.4, "permissive");
    expect(permissive).toBeGreaterThan(linear);
    expect(applyValidationCurve(1.0, "permissive")).toBeCloseTo(1.0, 4);
    expect(applyValidationCurve(0.0, "permissive")).toBeCloseTo(0.0, 4);
  });

  it("should clamp inputs outside [0, 1] range defensively", () => {
    expect(applyValidationCurve(-0.2, "linear")).toBe(0);
    expect(applyValidationCurve(1.5, "linear")).toBe(1);
    expect(applyValidationCurve(-0.5, "sigmoid")).toBe(0);
    expect(applyValidationCurve(2.0, "sigmoid")).toBe(1);
  });

  it("evaluates Noul verdict with custom threshold and curve", () => {
    // raw = 0.55, threshold = 0.50 -> Linear passes
    const resLinear = evaluateNoulVerdict(0.55, 0.5, "linear");
    expect(resLinear.verdict).toBe(true);
    expect(resLinear.rawProbability).toBe(0.55);
    expect(resLinear.calibratedScore).toBeCloseTo(0.55, 3);
    expect(resLinear.percentage).toBe("55.0%");

    // With higher threshold 0.60 -> Fails
    const resStrictThreshold = evaluateNoulVerdict(0.55, 0.6, "linear");
    expect(resStrictThreshold.verdict).toBe(false);

    // With strict curve on 0.55, calibrated score drops below 0.50 threshold
    const resStrictCurve = evaluateNoulVerdict(0.55, 0.5, "strict");
    expect(resStrictCurve.verdict).toBe(false);
    expect(resStrictCurve.calibratedScore).toBeLessThan(0.5);
  });
});
