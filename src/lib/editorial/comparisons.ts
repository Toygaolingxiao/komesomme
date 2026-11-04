import { riceProfiles } from "@/data/rice/catalog";
import {
  COMPARISON_PAGES,
  type ComparisonPage,
} from "@/data/editorial/comparisons";
import type { RiceProfileV2 } from "@/types/rice";

export type ResolvedComparison = {
  page: ComparisonPage;
  a: RiceProfileV2;
  b: RiceProfileV2;
  related: ComparisonPage[];
};

function profileById(id: string): RiceProfileV2 | null {
  return riceProfiles.find((rice) => rice.id === id) ?? null;
}

export function resolveComparison(
  page: ComparisonPage,
): ResolvedComparison | null {
  const a = profileById(page.aId);
  const b = profileById(page.bId);
  if (!a || !b) return null;
  const related = page.relatedSlugs
    .map((slug) => COMPARISON_PAGES.find((row) => row.slug === slug))
    .filter((row): row is ComparisonPage => Boolean(row));
  return { page, a, b, related };
}

export function resolveComparisonBySlug(
  slug: string,
): ResolvedComparison | null {
  const page = COMPARISON_PAGES.find((row) => row.slug === slug);
  if (!page) return null;
  return resolveComparison(page);
}

export function allResolvedComparisons(): ResolvedComparison[] {
  return COMPARISON_PAGES.map(resolveComparison).filter(
    (row): row is ResolvedComparison => row !== null,
  );
}

/** Indicator order and labels for the side-by-side table (catalog field order). */
export const COMPARISON_INDICATORS = [
  { key: "sweetness", label: "甘み" },
  { key: "stickiness", label: "粘り" },
  { key: "hardness", label: "粒立ち（かたさ）" },
  { key: "richness", label: "コク" },
  { key: "aroma", label: "香り" },
  { key: "umami", label: "旨み" },
  { key: "cold_rice_quality", label: "冷めてからの持ち" },
  { key: "oil_compatibility", label: "油との相性" },
  { key: "aftertaste", label: "余韻" },
  { key: "sauce_absorption", label: "タレの絡み" },
  { key: "grain_size", label: "粒の大きさ" },
  { key: "clarity", label: "すっきり感" },
] as const satisfies readonly { key: keyof RiceProfileV2; label: string }[];

export type ComparisonIndicatorKey =
  (typeof COMPARISON_INDICATORS)[number]["key"];
