import { describe, expect, it } from "vitest";
import { encyclopediaManifest } from "@/data/rice/encyclopedia/load";
import {
  PREFECTURE_MIN_BRANDS,
  PREFECTURE_PAGES,
  prefectureBySlug,
  prefectureLede,
  prefecturesByRegion,
} from "@/lib/editorial/prefectures";

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

  it("groups pages by region without dropping any", () => {
    const grouped = prefecturesByRegion().flatMap((group) => group.pages);
    expect(grouped).toHaveLength(PREFECTURE_PAGES.length);
  });
});
