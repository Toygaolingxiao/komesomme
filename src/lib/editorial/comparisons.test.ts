import { describe, expect, it } from "vitest";
import { COMPARISON_PAGES } from "@/data/editorial/comparisons";
import {
  allResolvedComparisons,
  resolveComparisonBySlug,
} from "@/lib/editorial/comparisons";

describe("COMPARISON_PAGES", () => {
  it("has unique slugs in A-vs-B form matching the brand ids", () => {
    const slugs = COMPARISON_PAGES.map((page) => page.slug);
    expect(new Set(slugs).size).toBe(slugs.length);
    for (const page of COMPARISON_PAGES) {
      expect(page.slug).toBe(`${page.aId}-vs-${page.bId}`);
      expect(page.aId).not.toBe(page.bId);
    }
  });

  it("resolves every page against the catalogue", () => {
    expect(allResolvedComparisons()).toHaveLength(COMPARISON_PAGES.length);
    for (const page of COMPARISON_PAGES) {
      expect(resolveComparisonBySlug(page.slug)).not.toBeNull();
    }
  });

  it("carries the Diff Gate editorial assets on every page", () => {
    for (const page of COMPARISON_PAGES) {
      expect(page.lead.length).toBeGreaterThanOrEqual(2);
      expect(page.coordinateNote.length).toBeGreaterThan(20);
      expect(page.verdictA.when.length).toBeGreaterThan(0);
      expect(page.verdictB.when.length).toBeGreaterThan(0);
      expect(page.faq.length).toBeGreaterThanOrEqual(3);
      for (const slug of page.relatedSlugs) {
        expect(COMPARISON_PAGES.some((row) => row.slug === slug)).toBe(true);
        expect(slug).not.toBe(page.slug);
      }
    }
  });
});
