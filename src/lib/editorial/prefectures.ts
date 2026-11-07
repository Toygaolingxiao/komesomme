import { riceProfiles } from "@/data/rice/catalog";
import { encyclopediaManifest } from "@/data/rice/encyclopedia/load";
import { prefectureArtSlug } from "@/data/editorial/prefectureArt";
import { COMPARISON_INDICATORS } from "@/lib/editorial/comparisons";
import type { RiceRegion } from "@/types/rice";

/**
 * Prefecture pages (/prefectures/[slug]).
 *
 * One page per prefecture whose catalogue holds at least
 * PREFECTURE_MIN_BRANDS brands. Everything on the page is composed from
 * catalogue data — brand list, 12-indicator averages, flagship names — so
 * a prefecture earns a page by data, not by hand-written copy. Pages are
 * the search landing for 「{県名} 米 銘柄」 and the doorway to each brand
 * page's ふるさと納税 tab (donations go to the producing municipality).
 */
export const PREFECTURE_MIN_BRANDS = 3;

export type PrefectureBrand = {
  id: string;
  name: string;
  headline: string | null;
};

export type PrefectureTrait = {
  key: string;
  label: string;
  /** Average of the prefecture's brands, one decimal. */
  value: number;
};

export type PrefecturePage = {
  slug: string;
  prefecture: string;
  region: RiceRegion;
  brands: PrefectureBrand[];
  /** All 12 indicators, in COMPARISON_INDICATORS order. */
  traits: PrefectureTrait[];
  /** The two highest taste averages — the prefecture's taste signature.
   *  Scene indicators (sauce / oil / cold-rice) are excluded: they read
   *  as usage notes, not as the land's flavour. */
  topTraits: PrefectureTrait[];
};

/** Usage-scene indicators — kept out of the lede's taste signature. */
const SCENE_INDICATOR_KEYS = new Set([
  "cold_rice_quality",
  "oil_compatibility",
  "sauce_absorption",
]);

const REGION_ORDER: RiceRegion[] = [
  "北海道・東北",
  "関東・甲信越",
  "東海・北陸",
  "近畿",
  "中国・四国",
  "九州・沖縄",
  "全国銘柄",
];

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function summarizeTraits(brands: typeof riceProfiles): {
  traits: PrefectureTrait[];
  topTraits: PrefectureTrait[];
} {
  const traits: PrefectureTrait[] = COMPARISON_INDICATORS.map(
    ({ key, label }) => ({
      key,
      label,
      value: round1(
        brands.reduce((sum, rice) => sum + rice[key], 0) / brands.length,
      ),
    }),
  );
  const topTraits = traits
    .filter((trait) => !SCENE_INDICATOR_KEYS.has(trait.key))
    .sort((a, b) => b.value - a.value)
    .slice(0, 2);
  return { traits, topTraits };
}

function buildPrefecturePages(): PrefecturePage[] {
  const headlines = new Map(
    encyclopediaManifest().map((entry) => [entry.id, entry.headline ?? null]),
  );

  const byPrefecture = new Map<string, typeof riceProfiles>();
  for (const rice of riceProfiles) {
    if (!rice.prefecture || rice.prefecture === "全国") continue;
    const list = byPrefecture.get(rice.prefecture) ?? [];
    list.push(rice);
    byPrefecture.set(rice.prefecture, list);
  }

  const pages: PrefecturePage[] = [];
  for (const [prefecture, brands] of byPrefecture) {
    if (brands.length < PREFECTURE_MIN_BRANDS) continue;
    const slug = prefectureArtSlug(prefecture);
    if (!slug) continue;

    const { traits, topTraits } = summarizeTraits(brands);

    pages.push({
      slug,
      prefecture,
      region: brands[0].region,
      brands: brands.map((rice) => ({
        id: rice.id,
        name: rice.name,
        headline: headlines.get(rice.id) ?? null,
      })),
      traits,
      topTraits,
    });
  }

  return pages.sort((a, b) => {
    const regionDelta =
      REGION_ORDER.indexOf(a.region) - REGION_ORDER.indexOf(b.region);
    if (regionDelta !== 0) return regionDelta;
    return b.brands.length - a.brands.length;
  });
}

export const PREFECTURE_PAGES: PrefecturePage[] = buildPrefecturePages();

export function prefectureBySlug(slug: string): PrefecturePage | null {
  return PREFECTURE_PAGES.find((page) => page.slug === slug) ?? null;
}

/** The page for a catalogue prefecture label （山形県 → yamagata), if one exists. */
export function prefecturePageByLabel(prefecture: string): PrefecturePage | null {
  return PREFECTURE_PAGES.find((page) => page.prefecture === prefecture) ?? null;
}

export function prefecturesByRegion(): {
  region: RiceRegion;
  pages: PrefecturePage[];
}[] {
  return REGION_ORDER.map((region) => ({
    region,
    pages: PREFECTURE_PAGES.filter((page) => page.region === region),
  })).filter((group) => group.pages.length > 0);
}

export type PrefectureMiniBrand = {
  id: string;
  name: string;
};

export type PrefectureMini = {
  prefecture: string;
  region: RiceRegion;
  brands: PrefectureMiniBrand[];
};

/**
 * Prefectures whose catalogue holds brands but fewer than
 * PREFECTURE_MIN_BRANDS — no full page, but they still belong on the
 * index so every producing prefecture in the catalogue shows up.
 * Grouped by region, same order as prefecturesByRegion.
 */
export function prefecturesWithFewBrands(): {
  region: RiceRegion;
  prefectures: PrefectureMini[];
}[] {
  const byPrefecture = new Map<string, PrefectureMini>();
  for (const rice of riceProfiles) {
    if (rice.prefecture === "全国") continue;
    if (
      PREFECTURE_PAGES.some((page) => page.prefecture === rice.prefecture)
    ) {
      continue;
    }
    const entry = byPrefecture.get(rice.prefecture) ?? {
      prefecture: rice.prefecture,
      region: rice.region,
      brands: [],
    };
    entry.brands.push({ id: rice.id, name: rice.name });
    byPrefecture.set(rice.prefecture, entry);
  }

  return REGION_ORDER.map((region) => ({
    region,
    prefectures: [...byPrefecture.values()]
      .filter((mini) => mini.region === region)
      .sort((a, b) => {
        const countDelta = b.brands.length - a.brands.length;
        if (countDelta !== 0) return countDelta;
        return a.prefecture.localeCompare(b.prefecture, "ja");
      }),
  })).filter((group) => group.prefectures.length > 0);
}

/** 県内 / 道内 / 都内 / 府内 — the word for "inside this prefecture". */
export function prefectureAreaWord(prefecture: string): string {
  if (prefecture.endsWith("道")) return "道内";
  if (prefecture.endsWith("都")) return "都内";
  if (prefecture.endsWith("府")) return "府内";
  return "県内";
}

/** Data-composed intro line — every claim in it comes from the catalogue. */
export function prefectureLede(page: PrefecturePage): string {
  const flagships = page.brands
    .slice(0, 3)
    .map((brand) => brand.name)
    .join("、");
  // 「など」 only when the list is actually partial.
  const more = page.brands.length > 3 ? "など" : "";
  const [first, second] = page.topTraits;
  return `${page.prefecture}の銘柄を${page.brands.length}つ記録しています。${flagships}${more}。味わいの平均像で高めなのは「${first.label}」と「${second.label}」です。`;
}

export type PrefectureMapSummary = {
  prefecture: string;
  region: RiceRegion;
  brands: PrefectureBrand[];
  /** Taste-signature labels, same rule as the prefecture pages. */
  topTraitLabels: string[];
  /** The prefecture page's slug, when the prefecture has one (≥3 brands). */
  pageSlug: string | null;
};

/**
 * Every prefecture the catalogue knows (≥1 brand), for the clickable map
 * on /prefectures. Prefectures below the page threshold still open the
 * map popup — the visitor reaches their brands without a full page.
 */
export function prefectureMapSummaries(): PrefectureMapSummary[] {
  const headlines = new Map(
    encyclopediaManifest().map((entry) => [entry.id, entry.headline ?? null]),
  );
  const pageByLabel = new Map(
    PREFECTURE_PAGES.map((page) => [page.prefecture, page]),
  );

  const byPrefecture = new Map<string, typeof riceProfiles>();
  for (const rice of riceProfiles) {
    if (!rice.prefecture || rice.prefecture === "全国") continue;
    const list = byPrefecture.get(rice.prefecture) ?? [];
    list.push(rice);
    byPrefecture.set(rice.prefecture, list);
  }

  const summaries: PrefectureMapSummary[] = [];
  for (const [prefecture, brands] of byPrefecture) {
    const page = pageByLabel.get(prefecture);
    const topTraits = page
      ? page.topTraits
      : summarizeTraits(brands).topTraits;
    summaries.push({
      prefecture,
      region: brands[0].region,
      brands: brands.map((rice) => ({
        id: rice.id,
        name: rice.name,
        headline: headlines.get(rice.id) ?? null,
      })),
      topTraitLabels: topTraits.map((trait) => trait.label),
      pageSlug: page?.slug ?? null,
    });
  }
  return summaries;
}
