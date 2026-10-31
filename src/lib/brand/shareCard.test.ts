import { describe, expect, it } from "vitest";
import {
  scrubShareCopy,
  shareCardBlurb,
  shareCardInkArtFile,
  shareCardScores,
  SHARE_CARD_INK_ARTS,
} from "@/lib/brand/shareCard";
import { shareCardConstellation } from "@/lib/brand/shareCardLayout";
import { shareCardQrDataUrl } from "@/lib/brand/shareCardQr";
import type { RiceProfileV2 } from "@/types/rice";

function stub(partial: Partial<RiceProfileV2> = {}): RiceProfileV2 {
  return {
    id: "test",
    name: "テスト米",
    prefecture: "北海道",
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
    texture_label: "ほどよい",
    sweetness_label: "ほどよい",
    region_id: "hokkaido_tohoku",
    region_color: "#7ca83b",
    best_match_dishes: ["おにぎり"],
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
    short_: "ほどよい甘み",
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

describe("shareCard copy scrub", () => {
  it("strips banned hype and qualification wording", () => {
    expect(scrubShareCopy("最強のお米ソムリエ最安")).toBe("のお");
  });

  it("builds a short editorial blurb", () => {
    const text = shareCardBlurb(
      stub({
        short_: "冷めても美味しい、弁当向き",
        best_match_dishes: ["弁当"],
        cold_rice_quality: 5,
      }),
      80
    );
    expect(text.length).toBeGreaterThan(0);
    expect(text).not.toMatch(/最強|最安|お米ソムリエ/);
  });

  it("maps taste scores to grain-meter rows", () => {
    expect(
      shareCardScores(
        stub({ sweetness: 4.4, stickiness: 2.6, hardness: 3, cold_rice_quality: 5 })
      )
    ).toEqual([
      { label: "甘み", value: 4 },
      { label: "粘り", value: 3 },
      { label: "硬さ", value: 3 },
      { label: "冷めた時の旨み", value: 5 },
    ]);
  });

  it("builds a local QR data URL without network", () => {
    const url = shareCardQrDataUrl("https://komesomme.jp/library/emihokoro");
    expect(url.startsWith("data:image/svg+xml;base64,")).toBe(true);
    const svg = Buffer.from(url.split(",")[1]!, "base64").toString("utf8");
    expect(svg).toContain("<svg");
    expect(svg).toContain("<circle");
  });

  it("plots the full catalog constellation without the hero", () => {
    const stars = shareCardConstellation(
      stub({
        id: "emihokoro",
        name: "えみほころ",
        sweetness: 4,
        hardness: 3,
      })
    );
    expect(stars.length).toBeGreaterThan(80);
    expect(stars.every((s) => s.id !== "emihokoro")).toBe(true);
    expect(stars.every((s) => Boolean(s.region_color) && Boolean(s.region))).toBe(
      true
    );
  });

  it("picks a stable ink art per rice id", () => {
    const a = shareCardInkArtFile("emihokoro");
    const b = shareCardInkArtFile("emihokoro");
    const c = shareCardInkArtFile("yumepirika");
    expect(SHARE_CARD_INK_ARTS).toContain(a);
    expect(a).toBe(b);
    expect(SHARE_CARD_INK_ARTS).toContain(c);
  });
});
