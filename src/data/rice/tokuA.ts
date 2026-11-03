/**
 * 特A is the top band of the Japan Grain Inspection Association rice-taste
 * ranking. It is awarded per production area and year — not a lifetime
 * title. This set therefore holds ONLY the latest published year
 * (令和7年産, announced 2026-02-27) and must be rebuilt every February
 * when the new ranking lands: drop ids that fell off, add new ones, and
 * re-check the region notes. Source: 日本穀物検定協会「令和7年産米の
 * 食味ランキング」(43 産地品種が特A).
 *
 * Entries are keyed by the catalogue id; the value names the evaluated
 * district when it is narrower than the page's home prefecture
 * (e.g. つや姫 counts only for 山形県村山・置賜産). Ids whose catalogue
 * page is a generic multi-region entry (きぬむすめ, ヒノヒカリ,
 * 宮城県産ひとめぼれ …) are NOT listed even if some district of the
 * variety took 特A — the badge would overclaim for the page as written.
 * 新之助 has never been submitted to the ranking at all.
 * Do not treat absence as "not tasty".
 */
export const TOKU_A_REGIONS = {
  yumepirika: null,
  nanatsuboshi: null,
  "seiten-no-hekireki": "津軽産",
  "ginga-no-shizuku": "岩手県県中産",
  akitakomachi: "秋田県県南産",
  sakihokore: null,
  tsuyahime: "山形県村山・置賜産",
  yukiwakamaru: "山形県庄内・置賜産",
  haenuki: "山形県最上産",
  "koshihikari-uonuma": null,
  tenkomori: null,
  ichihomare: null,
  sagabiyori: null,
  "genki-tsukushi": null,
  fukumaru: null,
  tsubusuke: "千葉県県南産",
  hoshizoramai: null,
  mizukagami: null,
  mineasahi: "愛知県三河中山間産",
  "yume-shizuku": null,
  akihonami: "鹿児島県県北産",
  nikomaru: null,
} as const satisfies Record<string, string | null>;

export type TokuAId = keyof typeof TOKU_A_REGIONS;

export const TOKU_A_IDS = new Set<string>(Object.keys(TOKU_A_REGIONS));

export const TOKU_A_LABEL = "特A";

export const TOKU_A_YEAR_LABEL = "令和7年産";

export const TOKU_A_HINT =
  "日本穀物検定協会「令和7年産米の食味ランキング」での特Aです。産地と年で変わります。";

export function isTokuA(id: string): boolean {
  return TOKU_A_IDS.has(id);
}

/** Evaluated district for region-limited entries, else null. */
export function tokuARegion(id: string): string | null {
  return (TOKU_A_REGIONS as Record<string, string | null>)[id] ?? null;
}
