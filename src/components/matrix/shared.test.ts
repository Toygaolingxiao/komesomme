import { describe, expect, it } from "vitest";
import { riceProfiles } from "@/data/rice/catalog";
import { appetiteLine, copyEchoes, suitabilityLine, technicalLine } from "./shared";
import type { RiceProfileV2 } from "@/types/rice";

function stub(partial: Partial<RiceProfileV2> = {}): RiceProfileV2 {
  return {
    id: "test",
    name: "テスト米",
    prefecture: "北海道",
    region: "北海道・東北",
    sweetness: 4,
    hardness: 2,
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
    texture_label: "やわらかめ",
    sweetness_label: "甘い",
    best_match_dishes: ["ハンバーグ"],
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
    short_: "低アミロース由来の強い粘りとふくよかな甘み。北海道の上級銘柄。",
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

describe("appetiteLine", () => {
  it("uses the brand short line, not a grain/sweetness bucket", () => {
    const line = appetiteLine(stub());
    expect(line).toBe(
      "低アミロース由来の強い粘りとふくよかな甘み。北海道の上級銘柄。"
    );
    expect(line).not.toContain("やわらかい口当たりとふくよかな甘みが");
  });

  it("is unique across the running catalogue", () => {
    const lines = riceProfiles.map((rice) => ({
      id: rice.id,
      line: appetiteLine(rice),
    }));
    const byLine = new Map<string, string[]>();
    for (const row of lines) {
      const ids = byLine.get(row.line) ?? [];
      ids.push(row.id);
      byLine.set(row.line, ids);
    }
    const collisions = [...byLine.entries()].filter(([, ids]) => ids.length > 1);
    expect(collisions, JSON.stringify(collisions, null, 2)).toEqual([]);
  });
});

describe("suitabilityLine", () => {
  it("follows the brand short line instead of a shared bucket", () => {
    expect(suitabilityLine(stub())).toBe(
      "低アミロース由来の強い粘りとふくよかな甘み"
    );
  });
});

describe("technicalLine", () => {
  it("skips a description that restates short_ for こしいぶき", () => {
    const rice = riceProfiles.find((row) => row.id === "koshiibuki");
    expect(rice).toBeTruthy();
    const line = technicalLine(rice!);
    expect(line).not.toContain("系統");
    expect(line).not.toContain("早生品種");
    expect(line.length).toBeGreaterThan(0);
  });

  it("never repeats the recommendation line as the follow-up", () => {
    const repeats = riceProfiles.filter((rice) => {
      const follow = technicalLine(rice);
      return Boolean(follow) && copyEchoes(appetiteLine(rice), follow);
    });
    expect(repeats.map((rice) => rice.id)).toEqual([]);
  });

  it("treats lineage restatements as echoes", () => {
    expect(
      copyEchoes(
        "コシヒカリの系統を引く、扱いやすい早生。",
        "コシヒカリの系統を受け継ぐ新潟の早生品種。"
      )
    ).toBe(true);
    expect(
      copyEchoes(
        "コシヒカリの系統を引く、扱いやすい早生。",
        "味わいはやや軽く、日々のご飯として扱いやすい性格です。"
      )
    ).toBe(false);
  });
});
