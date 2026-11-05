import { describe, expect, it } from "vitest";
import { encyclopediaManifest } from "@/data/rice/encyclopedia/load";
import {
  PREFECTURE_MIN_BRANDS,
  PREFECTURE_PAGES,
  prefectureAreaWord,
  prefectureBySlug,
  prefectureLede,
  prefectureMapSummaries,
  prefecturesByRegion,
} from "@/lib/editorial/prefectures";

const SCENE_KEYS = new Set([
  "cold_rice_quality",
  "oil_compatibility",
  "sauce_absorption",
]);

const KNOWN = new Set(encyclopediaManifest().map((entry) => entry.id));

describe("prefecture pages", () => {
  it("builds a page for every prefecture with enough brands", () => {
    expect(PREFECTURE_PAGES.length).toBeGreaterThanOrEqual(15);
    const slugs = PREFECTURE_PAGES.map((page) => page.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    expect(slugs).toContain("hokkaido");
    expect(slugs).toContain("niigata");
    for (const page of PREFECTURE_PAGES) {
      expect(page.brands.length).toBeGreaterThanOrEqual(PREFECTURE_MIN_BRANDS);
    }
  });

  it("only lists brands that exist in the encyclopedia", () => {
    for (const page of PREFECTURE_PAGES) {
      for (const brand of page.brands) {
        expect(KNOWN.has(brand.id)).toBe(true);
      }
    }
  });

  it("averages stay inside the 1–5 indicator scale", () => {
    for (const page of PREFECTURE_PAGES) {
      expect(page.traits).toHaveLength(12);
      expect(page.topTraits).toHaveLength(2);
      for (const trait of page.traits) {
        expect(trait.value).toBeGreaterThanOrEqual(1);
        expect(trait.value).toBeLessThanOrEqual(5);
      }
    }
  });

  it("resolves by slug and composes a lede from the data", () => {
    const hokkaido = prefectureBySlug("hokkaido");
    expect(hokkaido?.prefecture).toBe("北海道");
    expect(prefectureBySlug("no-such-prefecture")).toBeNull();
    const lede = prefectureLede(hokkaido!);
    expect(lede).toContain("北海道");
    expect(lede).toContain(String(hokkaido!.brands.length));
  });

  it("keeps scene indicators out of the taste signature", () => {
    for (const page of PREFECTURE_PAGES) {
      for (const trait of page.topTraits) {
        expect(SCENE_KEYS.has(trait.key)).toBe(false);
      }
    }
  });

  it("only adds 「など」 when the flagship list is partial", () => {
    for (const page of PREFECTURE_PAGES) {
      const lede = prefectureLede(page);
      if (page.brands.length <= 3) {
        expect(lede).not.toContain("など");
      } else {
        expect(lede).toContain("など");
      }
    }
  });

  it("names each prefecture's own area word", () => {
    expect(prefectureAreaWord("北海道")).toBe("道内");
    expect(prefectureAreaWord("東京都")).toBe("都内");
    expect(prefectureAreaWord("京都府")).toBe("府内");
    expect(prefectureAreaWord("新潟県")).toBe("県内");
  });

  it("summarises every catalogued prefecture for the map", () => {
    const summaries = prefectureMapSummaries();
    // 38 prefectures carry at least one brand (2026-11 catalogue).
    expect(summaries.length).toBe(38);
    for (const summary of summaries) {
      expect(summary.brands.length).toBeGreaterThanOrEqual(1);
      for (const brand of summary.brands) {
        expect(KNOWN.has(brand.id)).toBe(true);
      }
      if (summary.brands.length >= PREFECTURE_MIN_BRANDS) {
        expect(summary.pageSlug).not.toBeNull();
      } else {
        expect(summary.pageSlug).toBeNull();
      }
    }
    const withPages = summaries.filter((summary) => summary.pageSlug);
    expect(withPages).toHaveLength(PREFECTURE_PAGES.length);
  });

  it("groups pages by region without dropping any", () => {
    const grouped = prefecturesByRegion().flatMap((group) => group.pages);
    expect(grouped).toHaveLength(PREFECTURE_PAGES.length);
  });
});
