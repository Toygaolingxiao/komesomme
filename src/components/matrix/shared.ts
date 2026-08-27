import { RICE_REGIONS, regionColor as colorForRegion } from "@/lib/rice/regions";
import type { RiceProfileV2, RiceRegion } from "@/types/rice";

/** Percent inset so 1 and 5 sit near the frame without clipping the dots. */
export const INSET = 4;
export const BAND = 100 - INSET * 2;

/**
 * Pole copy. Orientation is left=淡 / right=甘, bottom=硬 / top=軟.
 * Wording is KomeSomme's own, not a copy of other tasting maps.
 */
export const AXIS_POLES = {
  sweetLow: "さっぱり、すっきり",
  sweetHigh: "甘み、ふくよか",
  firm: "粒立ち、しっかり",
  soft: "やわらか、ほどける",
  sweetLowShort: "すっきり",
  sweetHighShort: "甘み",
  firmShort: "粒立ち",
  softShort: "ほどける",
} as const;

export const TAG_TONES = [
  { bg: "#fff5e5", border: "#e29a35", text: "#704522" },
  { bg: "#fdece8", border: "#e56b3f", text: "#7a2e18" },
  { bg: "#eef6e8", border: "#7ca83b", text: "#3f5a1c" },
  { bg: "#f8e8ee", border: "#c85a72", text: "#6b2a3a" },
  { bg: "#e8f3f5", border: "#3f8fa3", text: "#245a68" },
] as const;

export type MapDensity = "full" | "sparse" | "focus";

export const MATCH_LIMIT = 4;
export const NEIGHBOUR_LIMIT = 3;

export const ICON_WEIGHT = "bold" as const;
export const ACCENT = "#e56b3f";

export const LAYER = {
  grid: 0,
  node: 10,
  probe: 20,
  bestNode: 30,
  selected: 34,
  overlay: 40,
} as const;

export const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--km-accent)]";

export const REGION_STYLES: Array<{ region: RiceRegion; color: string }> =
  RICE_REGIONS.map(({ name, color }) => ({ region: name, color }));

export function regionColor(region: RiceRegion | string): string {
  return colorForRegion(region);
}

/** A rail entry. Coordinate and semantic paths produce different scores but render alike. */
export type RailMatch = {
  rice: RiceProfileV2;
  score: number;
  reason: string;
};

export function rakutenUrl(keyword: string): string {
  return `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(keyword)}/`;
}

export function amazonUrl(keyword: string): string {
  return `https://www.amazon.co.jp/s?k=${encodeURIComponent(keyword)}`;
}

export function furusatoUrl(keyword: string): string {
  return `https://www.satofull.jp/products/list.php?q=${encodeURIComponent(keyword)}`;
}

export function shortTasteTags(rice: RiceProfileV2): string[] {
  const tags = [rice.texture_label, rice.sweetness_label];
  if (rice.cold_rice_quality >= 4) tags.push("冷めても美味しい");
  return Array.from(new Set(tags.filter(Boolean))).slice(0, 3);
}

export function pairTasteTags(rice: RiceProfileV2): string[] {
  return [rice.texture_label, rice.sweetness_label].filter(Boolean).slice(0, 2);
}

export function dishTags(rice: RiceProfileV2): string[] {
  return [...rice.best_match_dishes, ...rice.good_with].filter(Boolean).slice(0, 4);
}

/** One tasting sentence from existing editorial fields. Does not invent facts. */
export function tastingSentence(rice: RiceProfileV2, reason?: string): string {
  const fromReason = reason?.trim();
  if (fromReason) return fromReason;
  if (rice.short_?.trim()) return rice.short_.trim();
  if (rice.pairing_reason?.trim()) return rice.pairing_reason.trim();
  return rice.description.trim();
}

export function tastingSummary(rice: RiceProfileV2): string {
  if (rice.short_?.trim()) return rice.short_.trim();
  const first = rice.description.split("。").filter(Boolean)[0];
  return first ? `${first}。` : rice.description;
}
