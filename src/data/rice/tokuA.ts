/**
 * 特A is the top band of the Japan Grain Inspection Association rice-taste
 * ranking. It is awarded per production area and year — not a lifetime title.
 *
 * Flagships that have taken 特A in a published ranking year (not only the
 * latest harvest). Latest published as of 2026-09 is 令和7年産 (2026-02-27).
 * はれわたり is 特A this year but not in the catalogue yet. Not scraped live.
 * Do not treat absence as "not tasty".
 */
export const TOKU_A_IDS = new Set<string>([
  "yumepirika",
  "nanatsuboshi",
  "seiten-no-hekireki",
  "ginga-no-shizuku",
  "hitomebore",
  "akitakomachi",
  "sakihokore",
  "tsuyahime",
  "yukiwakamaru",
  "haenuki",
  "koshihikari-uonuma",
  "koshihikari-sado",
  "shinnosuke",
  "tentakaku",
  "tenkomori",
  "fufufu",
  "ichihomare",
  "sagabiyori",
  "mori-no-kumasan",
  "genki-tsukushi",
  "harumi",
  "koi-no-yokan",
  "oidemai",
  "hinohikari",
  "nikomaru",
  "fukumaru",
  "tsubusuke",
  "hoshizoramai",
  "mizukagami",
  "mineasahi",
  "yume-shizuku",
  "akihonami",
  "kinumusume",
]);

export const TOKU_A_LABEL = "特A";

export const TOKU_A_HINT =
  "日本穀物検定協会の食味ランキング。産地と年で変わります。";

export function isTokuA(id: string): boolean {
  return TOKU_A_IDS.has(id);
}
