import { riceProfiles } from "@/data/rice/catalog";
import { COMPARISON_PAGES } from "@/data/editorial/comparisons";
import {
  COMPARISON_INDICATORS,
  type ComparisonIndicatorKey,
} from "@/lib/editorial/comparisons";
import { toMapProfiles } from "@/lib/rice/mapProfile";
import { calculateMatrixDisplayPoint } from "@/lib/rice/matrix";
import type { RiceProfileV2 } from "@/types/rice";

/** Serializable brand shape the free-compare tool needs (nothing more). */
export type FreeBrand = Pick<
  RiceProfileV2,
  | "id"
  | "name"
  | "prefecture"
  | "region"
  | "best_match_dishes"
  | "good_with"
  | "avoid_pairings"
  | "short_"
> &
  Record<ComparisonIndicatorKey, number>;

export type FreeCompareDataset = {
  brands: FreeBrand[];
  /**
   * Raw taste coordinates for every brand (calculateMatrixDisplayPoint,
   * WITHOUT the home map's crowd-spreading separation): on a comparison
   * page the map is evidence, so neighbours in the data stay neighbours.
   */
  points: { id: string; x: number; y: number }[];
  /** "<idA>|<idB>" (sorted) -> curated comparison slug, when one exists. */
  curated: Record<string, string>;
};

const INDICATOR_KEYS = COMPARISON_INDICATORS.map((row) => row.key);

export function curatedKey(aId: string, bId: string): string {
  return [aId, bId].sort().join("|");
}

export function freeCompareDataset(): FreeCompareDataset {
  const brands = riceProfiles.map((rice) => {
    const brand = {
      id: rice.id,
      name: rice.name,
      prefecture: rice.prefecture,
      region: rice.region,
      best_match_dishes: rice.best_match_dishes,
      good_with: rice.good_with,
      avoid_pairings: rice.avoid_pairings,
      short_: rice.short_,
    } as FreeBrand;
    for (const key of INDICATOR_KEYS) {
      brand[key] = rice[key] as number;
    }
    return brand;
  });
  const points = toMapProfiles(riceProfiles).map((profile) => {
    const point = calculateMatrixDisplayPoint(profile);
    return { id: point.id, x: point.display_x, y: point.display_y };
  });
  const curated: Record<string, string> = {};
  for (const page of COMPARISON_PAGES) {
    curated[curatedKey(page.aId, page.bId)] = page.slug;
  }
  return { brands, points, curated };
}

export type IndicatorDiff = {
  key: ComparisonIndicatorKey;
  label: string;
  va: number;
  vb: number;
  d: number;
};

export type ComparisonSummary = {
  diffs: IndicatorDiff[];
  equalCount: number;
  aLeads: string[];
  bLeads: string[];
  verdict: string;
  coordinateNote: string;
};

/**
 * Factual auto-summary for an arbitrary pair: every sentence is filled from
 * the two profiles' actual values, nothing is invented.
 */
export function summarizeComparison(
  a: FreeBrand,
  b: FreeBrand,
): ComparisonSummary {
  const diffs = COMPARISON_INDICATORS.map(({ key, label }) => {
    const va = a[key];
    const vb = b[key];
    return { key, label, va, vb, d: va - vb };
  })
    .filter((row) => row.d !== 0)
    .sort(
      (x, y) =>
        Math.abs(y.d) - Math.abs(x.d) ||
        COMPARISON_INDICATORS.findIndex((row) => row.key === x.key) -
          COMPARISON_INDICATORS.findIndex((row) => row.key === y.key),
    );
  const aLeads = diffs.filter((row) => row.d > 0).map((row) => row.label);
  const bLeads = diffs.filter((row) => row.d < 0).map((row) => row.label);
  const equalCount = COMPARISON_INDICATORS.length - diffs.length;

  let verdict: string;
  if (diffs.length === 0) {
    verdict = "12指標すべて同点です。データの上では、甲乙つけがたい2つです。";
  } else {
    const top = diffs[0];
    const topText = `いちばん差が大きいのは「${top.label}」（${top.va}対${top.vb}）です。`;
    if (aLeads.length > 0 && bLeads.length > 0) {
      verdict = `${a.name}は${aLeads.join("・")}で、${b.name}は${bLeads.join("・")}で上回ります。${topText}`;
    } else if (aLeads.length > 0) {
      verdict = `差がある指標では、すべて${a.name}が上回ります。${topText}`;
    } else {
      verdict = `差がある指標では、すべて${b.name}が上回ります。${topText}`;
    }
  }

  const distance =
    Math.abs(a.sweetness - b.sweetness) + Math.abs(a.hardness - b.hardness);
  const position =
    distance === 0
      ? "地図の位置は一致します"
      : distance <= 2
        ? "地図の位置は少し離れます"
        : "地図の位置ははっきり離れます";
  const coordinateNote = `甘みは${a.sweetness}対${b.sweetness}、粒立ちは${a.hardness}対${b.hardness}。${position}。`;

  return { diffs, equalCount, aLeads, bLeads, verdict, coordinateNote };
}
