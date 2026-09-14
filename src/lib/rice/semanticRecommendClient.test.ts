import { describe, expect, it } from "vitest";
import {
  coordinateFromSemanticTop,
  requestSemanticRecommend,
  toSemanticRailMatches,
} from "@/lib/rice/semanticRecommendClient";
import type { RiceDisplayPoint, RiceProfileV2 } from "@/types/rice";

function sampleRice(overrides: Partial<RiceProfileV2> = {}): RiceProfileV2 {
  return {
    id: "a",
    name: "つや姫",
    prefecture: "山形県",
    region: "北海道・東北",
    sweetness: 3,
    hardness: 3,
    stickiness: 3,
    aroma: 3,
    umami: 3,
    aftertaste: 3,
    grain_size: 3,
    clarity: 3,
    richness: 3,
    cold_rice_quality: 3,
    sauce_absorption: 3,
    oil_compatibility: 3,
    quadrant: "balanced",
    texture_label: "もっちり",
    sweetness_label: "ほどよい甘み",
    best_match_dishes: [],
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
    short_: "",
    description: "やわらかな食感。",
    sommelier_note: "",
    pairing_reason: "和食に寄り添う。",
    semantic_tags: [],
    search_queries: [],
    rakuten_search_keyword: "山形県 つや姫 白米",
    data_source: "editorial",
    data_confidence: "high",
    ...overrides,
  };
}

describe("toSemanticRailMatches", () => {
  it("prefers in-memory profile rows and drops invalid entries", () => {
    const catalogRice = sampleRice({ id: "koshihikari", pairing_reason: "catalog reason" });
    const apiRice = sampleRice({ id: "koshihikari", pairing_reason: "api reason" });
    const mapped = toSemanticRailMatches(
      [
        { rice: apiRice, score: 0.87, reason: "semantic reason" },
        { rice: sampleRice({ id: "" }) },
      ],
      [catalogRice]
    );

    expect(mapped).toHaveLength(1);
    expect(mapped[0].rice).toBe(catalogRice);
    expect(mapped[0].score).toBe(0.87);
    expect(mapped[0].reason).toBe("semantic reason");
  });
});

describe("coordinateFromSemanticTop", () => {
  it("uses map placement when the top match exists on the map", () => {
    const top = sampleRice({ id: "hit" });
    const points: RiceDisplayPoint[] = [
      {
        ...top,
        display_x: 3.6,
        display_y: 2.2,
      },
    ];

    expect(coordinateFromSemanticTop(top, points)).toEqual({
      hardness: 3.8,
      sweetness: 3.6,
    });
  });

  it("falls back to clamped taste values when map placement is unavailable", () => {
    const top = sampleRice({ hardness: 9, sweetness: -2 });
    expect(coordinateFromSemanticTop(top, [])).toEqual({ hardness: 5, sweetness: 1 });
  });
});

describe("requestSemanticRecommend", () => {
  it("returns server message when the API responds non-2xx", async () => {
    const result = await requestSemanticRecommend({
      query: "唐揚げに合う米",
      matchCount: 4,
      fetchImpl: async () =>
        new Response(JSON.stringify({ message: "問い合わせ上限です。" }), { status: 429 }),
    });

    expect(result).toEqual({ ok: false, message: "問い合わせ上限です。" });
  });

  it("falls back to generic response message for non-json non-2xx responses", async () => {
    const result = await requestSemanticRecommend({
      query: "寿司に合う米",
      matchCount: 4,
      fetchImpl: async () => new Response("bad gateway", { status: 502 }),
    });

    expect(result).toEqual({
      ok: false,
      message: "相談に失敗しました。味わいの地図から銘柄を探してみてください。",
    });
  });

  it("returns timeout guidance on aborted request", async () => {
    const result = await requestSemanticRecommend({
      query: "おにぎり向き",
      matchCount: 4,
      timeoutMs: 1,
      fetchImpl: async (_input, init) =>
        await new Promise<Response>((_resolve, reject) => {
          init?.signal?.addEventListener("abort", () => {
            const err = new Error("aborted");
            (err as Error & { name: string }).name = "AbortError";
            reject(err);
          });
        }),
    });

    expect(result).toEqual({
      ok: false,
      message: "返事が遅かったので、いったん味わいの地図から探してみてください。",
    });
  });
});
