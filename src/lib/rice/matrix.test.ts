import { describe, expect, it } from "vitest";
import {
  AXIS_MAX,
  AXIS_MIN,
  calculateDisplayScore,
  clamp,
  displayYToHardness,
  hardnessToDisplayY,
  normalizeTasteValue,
} from "./matrix";

describe("TS-UNIT-01 clamp / normalizeTasteValue", () => {
  it("clamps to axis bounds", () => {
    expect(clamp(0)).toBe(AXIS_MIN);
    expect(clamp(9)).toBe(AXIS_MAX);
    expect(clamp(3.2)).toBe(3.2);
  });

  it("normalizes invalid scores to centre", () => {
    expect(normalizeTasteValue(null)).toBe(3);
    expect(normalizeTasteValue(undefined)).toBe(3);
    expect(normalizeTasteValue(Number.NaN)).toBe(3);
    expect(normalizeTasteValue(4)).toBe(4);
  });
});

describe("TS-UNIT-02 hardness display Y round-trip", () => {
  it("maps hardness through display Y and back", () => {
    for (const h of [1, 2, 3, 4, 5]) {
      const y = hardnessToDisplayY(h);
      expect(displayYToHardness(y)).toBeCloseTo(h, 5);
    }
  });
});

describe("TS-UNIT-03 calculateDisplayScore", () => {
  it("returns integers in 45..100", () => {
    expect(calculateDisplayScore(0)).toBe(100);
    const mid = calculateDisplayScore(1);
    expect(Number.isInteger(mid)).toBe(true);
    expect(mid).toBeGreaterThanOrEqual(45);
    expect(mid).toBeLessThanOrEqual(100);
    expect(calculateDisplayScore(10)).toBeGreaterThanOrEqual(45);
  });
});
