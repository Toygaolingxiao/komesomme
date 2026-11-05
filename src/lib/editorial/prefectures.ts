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
  /** The two highest averages — the prefecture's taste signature. */
  topTraits: PrefectureTrait[];
};

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

    const traits: PrefectureTrait[] = COMPARISON_INDICATORS.map(
      ({ key, label }) => ({
        key,
        label,
        value: round1(
          brands.reduce((sum, rice) => sum + rice[key], 0) / brands.length,
        ),
      }),
    );
    const topTraits = [...traits]
      .sort((a, b) => b.value - a.value)
      .slice(0, 2);

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

export function prefecturesByRegion(): {
  region: RiceRegion;
  pages: PrefecturePage[];
}[] {
  return REGION_ORDER.map((region) => ({
    region,
    pages: PREFECTURE_PAGES.filter((page) => page.region === region),
  })).filter((group) => group.pages.length > 0);
}

/** Data-composed intro line — every claim in it comes from the catalogue. */
export function prefectureLede(page: PrefecturePage): string {
  const flagships = page.brands
    .slice(0, 3)
    .map((brand) => brand.name)
    .join("、");
  const [first, second] = page.topTraits;
  return `${page.prefecture}の銘柄を${page.brands.length}つ記録しています。${flagships}など。味わいの平均像では「${first.label}」と「${second.label}」が前に出ます。`;
}
