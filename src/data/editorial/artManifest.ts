/** Declares which files exist under public/brand-art/. Missing files must not be listed. */

export const MASTHEAD_ART = "/brand-art/masthead.webp";

export const BRAND_ART_IDS = new Set<string>([
  "akitakomachi",
  "haenuki",
  "hitomebore",
  "koshihikari-uonuma",
  "milky-queen",
  "nanatsuboshi",
  "sagabiyori",
  "sasanishiki",
  "tentakaku",
  "tsuyahime",
  "yumepirika",
]);

export const REGION_ART_IDS = new Set<string>([
  "hokkaido-tohoku",
  "kanto-koshinetsu",
  "tokai-hokuriku",
  "kansai",
  "chugoku-shikoku",
  "kyushu-okinawa",
  "national",
]);

export const COLLECTION_ART_FILES = new Set<string>([
  "bento.webp",
  "shinmai.webp",
  "nabe.webp",
  "toku-a.webp",
  "yakizakana.webp",
]);

/** Basenames under public/brand-art/pairings/. */
export const PAIRING_ART_FILES = new Set<string>([
  "pair-curry.webp",
  "pair-sashimi.webp",
  "pair-bento.webp",
  "pair-nabe.webp",
  "pair-sushi.webp",
  "pair-donburi.webp",
  "pair-onigiri.webp",
  "pair-karaage.webp",
  "pair-chahan.webp",
  "pair-tamagokake.webp",
]);

export function brandArtPath(id: string): string {
  return `/brand-art/brands/${id}.webp`;
}

export function regionArtPath(regionId: string): string {
  return `/brand-art/regions/${regionId}.webp`;
}

/** `file` is the basename declared in collections data, e.g. `shinmai.webp`. */
export function collectionArtPath(file: string): string {
  return `/brand-art/collections/${file}`;
}

/** `file` is the basename declared on pairing pages, e.g. `pair-curry.webp`. */
export function pairingArtPath(file: string): string {
  return `/brand-art/pairings/${file}`;
}
