import { describe, expect, it } from "vitest";
import type { RiceProfileV2 } from "@/types/rice";
import {
  AXIS_MAX,
  AXIS_MIN,
  calculateDisplayScore,
  calculateMatrixDisplayPoint,
  clamp,
  displayYToHardness,
  generateCoordinateReason,
  hardnessToDisplayY,
  normalizeTasteValue,
  toDisplayPoints,
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
      reasonStub({ short_: "   ", sweetness: 4, hardness: 3 }),
    );
    expect(reason).toContain("馬刺し");
    expect(reason).not.toContain("選んだ粒感");
  });
});

describe("toDisplayPoints drift contract", () => {
  it("keeps every brand within 0.85 of its integer score cell", async () => {
    const { riceProfiles } = await import("@/data/rice/catalog");
    const { toMapProfiles } = await import("./mapProfile");
    for (const point of toDisplayPoints(toMapProfiles(riceProfiles))) {
      const drift = Math.hypot(
        point.display_x - point.sweetness,
        point.display_y - hardnessToDisplayY(point.hardness),
      );
      expect(drift).toBeLessThanOrEqual(0.85);
    }
  });

  it("keeps taste neighbours as map neighbours (tsubuzoroi x yumeobako)", async () => {
    const { riceProfiles } = await import("@/data/rice/catalog");
    const { toMapProfiles } = await import("./mapProfile");
    const points = toDisplayPoints(toMapProfiles(riceProfiles));
    const tsubu = points.find((point) => point.id === "tsubuzoroi")!;
    const obako = points.find((point) => point.id === "yumeobako")!;
    const distance = Math.hypot(
      tsubu.display_x - obako.display_x,
      tsubu.display_y - obako.display_y,
    );
    expect(distance).toBeGreaterThan(0.7);
    expect(distance).toBeLessThan(1.5);
  });

  it("keeps a readable minimum gap across the catalogue", async () => {
    const { riceProfiles } = await import("@/data/rice/catalog");
    const { toMapProfiles } = await import("./mapProfile");
    const points = toDisplayPoints(toMapProfiles(riceProfiles));
    let min = Number.POSITIVE_INFINITY;
    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        min = Math.min(
          min,
          Math.hypot(
            points[i].display_x - points[j].display_x,
            points[i].display_y - points[j].display_y,
          ),
        );
      }
    }
    expect(min).toBeGreaterThanOrEqual(0.08);
  });
});

describe("calculateMatrixDisplayPoint decimal refinement", () => {
  it("leans a brand toward its own secondary ratings within the cell", () => {
    const base = {
      id: "probe",
      name: "probe",
      prefecture: "秋田県",
      sweetness: 3,
      hardness: 3,
      stickiness: 3,
      aroma: 3,
      umami: 3,
      aftertaste: 3,
      grain_size: 3,
      clarity: 3,
      richness: 3,
    } as unknown as Parameters<typeof calculateMatrixDisplayPoint>[0];
    const neutral = calculateMatrixDisplayPoint(base);
    const rich = calculateMatrixDisplayPoint({
      ...base,
      umami: 5,
      richness: 5,
    });
    const sticky = calculateMatrixDisplayPoint({ ...base, stickiness: 5 });
    expect(rich.display_x).toBeGreaterThan(neutral.display_x);
    expect(sticky.display_y).toBeGreaterThan(neutral.display_y);
    // never leaves the integer score's half-step neighbourhood
    expect(Math.abs(rich.display_x - 3)).toBeLessThanOrEqual(0.5);
  });
});
