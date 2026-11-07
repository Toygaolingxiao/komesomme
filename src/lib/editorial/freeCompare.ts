import { riceProfiles } from "@/data/rice/catalog";
import { BRAND_I18N } from "@/data/rice/brandI18n";
import { COMPARISON_PAGES } from "@/data/editorial/comparisons";
import {
  COMPARISON_INDICATORS,
  type ComparisonIndicatorKey,
} from "@/lib/editorial/comparisons";
import { toMapProfiles } from "@/lib/rice/mapProfile";
import { toDisplayPoints } from "@/lib/rice/matrix";
import { regionColor } from "@/lib/rice/regions";
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
> & {
  /** Extra spellings a deep link may carry: id, name, EN/ZH names, aliases. */
  searchTerms: string[];
} & Record<ComparisonIndicatorKey, number>;

export type FreeCompareDataset = {
  brands: FreeBrand[];
  /**
   * Display points for every brand — the same positions as the home taste
   * map (decimal taste positions plus the shared spreading layout), so a
   * brand sits in the same place on every map on the site.
   */
  points: { id: string; x: number; y: number; color: string }[];
  /** "<idA>|<idB>" (sorted) -> curated comparison slug, when one exists. */
  curated: Record<string, string>;
};

const INDICATOR_KEYS = COMPARISON_INDICATORS.map((row) => row.key);

let cachedDisplayPoints: Map<string, { x: number; y: number }> | null = null;

function displayPointById(): Map<string, { x: number; y: number }> {
  if (!cachedDisplayPoints) {
    cachedDisplayPoints = new Map(
      toDisplayPoints(toMapProfiles(riceProfiles)).map((point) => [
        point.id,
        { x: point.display_x, y: point.display_y },
      ]),
    );
  }
  return cachedDisplayPoints;
}

export function curatedKey(aId: string, bId: string): string {
  return [aId, bId].sort().join("|");
}

/**
 * Normalizes a brand spelling from a deep link: width, case, kana and
 * punctuation differences must not matter ("Tsuyahime", "つや姫",
 * "ツヤヒメ" style inputs all land on the same key where the data allows).
 */
export function normalizeBrandQuery(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[ァ-ヶ]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0x60),
    )
    .replace(/[\s\-_/・,，、.。()（）【】[\]「」『』]/g, "");
}

/**
 * Resolves a /compare?a=… / ?b=… value to a brand id. Accepts the id itself,
 * the canonical Japanese name, and every registered search term (EN/ZH
 * names and aliases). Priority is id → name → search terms; an ambiguous
 * spelling that matches several brands resolves to null rather than a guess
 * (generic コシヒカリ is unambiguous only because the plain alias is
 * registered on the BL profile alone).
 */
export function resolveCompareBrandId(
  value: string | null | undefined,
  brands: readonly Pick<FreeBrand, "id" | "name" | "searchTerms">[],
): string | null {
  if (!value) return null;
  const byId = new Map(brands.map((brand) => [brand.id, brand]));
  if (byId.has(value)) return value;

  const normalized = normalizeBrandQuery(value);
  if (!normalized) return null;
  const attempts = [normalized];
  if (normalized.endsWith("米") && normalized.length > 1) {
    attempts.push(normalized.slice(0, -1));
  }

  for (const attempt of attempts) {
    const tiers: Array<(brand: (typeof brands)[number]) => boolean> = [
      (brand) => normalizeBrandQuery(brand.id) === attempt,
      (brand) => normalizeBrandQuery(brand.name) === attempt,
      (brand) =>
        brand.searchTerms.some((term) => normalizeBrandQuery(term) === attempt),
    ];
    for (const inTier of tiers) {
      const hits = brands.filter(inTier);
      if (hits.length === 1) return hits[0].id;
      if (hits.length > 1) return null;
    }
  }
  return null;
}

export function freeCompareDataset(): FreeCompareDataset {
  const brands = riceProfiles.map((rice) => {
    const i18n = BRAND_I18N[rice.id];
    const brand = {
      id: rice.id,
      name: rice.name,
      prefecture: rice.prefecture,
      region: rice.region,
      best_match_dishes: rice.best_match_dishes,
      good_with: rice.good_with,
      avoid_pairings: rice.avoid_pairings,
      short_: rice.short_,
      searchTerms: [
        rice.id,
        rice.name,
        ...(i18n ? [i18n.en, i18n.zh, ...(i18n.aliases ?? [])] : []),
      ],
    } as FreeBrand;
    for (const key of INDICATOR_KEYS) {
      brand[key] = rice[key] as number;
    }
    return brand;
  });
  const points = toDisplayPoints(toMapProfiles(riceProfiles)).map((point) => ({
    id: point.id,
    x: point.display_x,
    y: point.display_y,
    color: regionColor(point.region),
  }));
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

  const byId = displayPointById();
  const pa = byId.get(a.id);
  const pb = byId.get(b.id);
  const displayDistance = pa && pb ? Math.hypot(pa.x - pb.x, pa.y - pb.y) : 0;
  const position =
    displayDistance <= 0.35
      ? "地図の上でも、ほぼ同じ場所に重なります"
      : displayDistance <= 1.3
        ? "地図の位置は少し離れます"
        : "地図の位置ははっきり離れます";
  const coordinateNote = `甘みは${a.sweetness}対${b.sweetness}、粒立ちは${a.hardness}対${b.hardness}。${position}。`;

  return { diffs, equalCount, aLeads, bLeads, verdict, coordinateNote };
}
