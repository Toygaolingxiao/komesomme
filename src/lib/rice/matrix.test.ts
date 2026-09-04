import { describe, expect, it } from "vitest";
import type { RiceProfileV2 } from "@/types/rice";
import {
  AXIS_MAX,
  AXIS_MIN,
  calculateDisplayScore,
  clamp,
  displayYToHardness,
  generateCoordinateReason,
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

function reasonStub(partial: Partial<RiceProfileV2> = {}): RiceProfileV2 {
  return {
    id: "test",
    name: "テスト米",
    prefecture: "熊本県",
    region: "九州・沖縄",
    sweetness: 4,
    hardness: 3,
    stickiness: 4,
    aroma: 3,
    umami: 3,
    aftertaste: 3,
    grain_size: 3,
    clarity: 3,
    richness: 3,
    cold_rice_quality: 4,
    sauce_absorption: 4,
    oil_compatibility: 3,
    quadrant: "balanced",
    texture_label: "ほどよい",
    sweetness_label: "甘い",
    best_match_dishes: ["馬刺し"],
    good_with: [],
    avoid_pairings: [],
    spring_pairings: [],
    summer_pairings: [],
    autumn_pairings: [],
    winter_pairings: [],
    sake_pairings: [],
    beer_pairings: [],
    wine_pairings: [],
    whisky_pairings: [],
    tea_pairings: [],
    mood_pairings: [],
    occasion_pairings: [],
    lifestyle_scenes: [],
    short_: "もっちりした甘みと粘り。熊本の人気銘柄。",
    description: "説明",
    sommelier_note: "メモ",
    pairing_reason: "",
    semantic_tags: [],
    search_queries: [],
    rakuten_search_keyword: "テスト米",
    data_source: "editorial",
    data_confidence: "medium",
    ...partial,
  };
}

describe("generateCoordinateReason", () => {
  const nearby = { hardness: 3, sweetness: 4 };

  it("uses the brand short line instead of a generic closest-match sentence", () => {
    const reason = generateCoordinateReason(nearby, reasonStub());
    expect(reason).toBe("もっちりした甘みと粘り。熊本の人気銘柄。");
    expect(reason).not.toContain("選んだ粒感");
    expect(reason).not.toContain("最も近い");
  });

  it("falls back to a dish line when short_ is empty", () => {
    const reason = generateCoordinateReason(
      nearby,
      reasonStub({ short_: "   ", sweetness: 4, hardness: 3 })
    );
    expect(reason).toContain("馬刺し");
    expect(reason).not.toContain("選んだ粒感");
  });
});
