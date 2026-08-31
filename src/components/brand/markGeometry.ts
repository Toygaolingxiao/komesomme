export const BRAND = {
  charcoal: "#302820",
  riceWhite: "#FFF5E5",
  cream: "#F6EBDD",
  gold: "#D49A2A",
  coral: "#E56B3F",
  brown: "#704522",
} as const;

/**
 * Rice grain with a shallow germ notch at the top — that bite is what stops
 * it reading as a leaf or a plain almond. Used in the brand mark.
 */
export const GRAIN_PATH =
  "M27 12.2C29.6 14.7 34.4 14.7 37 12.2C45.4 15.4 51 23.2 51 33.6C51 45.4 43.2 54.8 32 57.6C20.8 54.8 13 45.4 13 33.6C13 23.2 18.6 15.4 27 12.2Z";

/**
 * Cleaner short-grain silhouette for map / score dots (viewBox 0 0 64 64).
 * Pointed tips, soft belly — reads as 米粒, not a blob or leaf.
 */
export const MATRIX_GRAIN_PATH =
  "M32 5.5C35.2 9.2 39.8 15.5 41.6 24.2C43.4 33.2 41.2 43.6 36.4 51.2C34.4 54.4 32.8 57.2 32 58.5C31.2 57.2 29.6 54.4 27.6 51.2C22.8 43.6 20.6 33.2 22.4 24.2C24.2 15.5 28.8 9.2 32 5.5Z";

/** Soft highlight crease along the belly of MATRIX_GRAIN_PATH. */
export const MATRIX_GRAIN_CREASE =
  "M32 14C33.2 22 33.4 34 32 48";

/** Partial compass orbit around the grain. */
export const ORBIT_PATH = "M20.6 13.8A23.4 24.2 0 1 1 48.8 51.6";

/** Flavor-map contours: lower-right interior only. */
export const CONTOUR_PATHS = [
  "M36.8 39.2C40.4 42.8 41.2 47.6 38.2 52.4",
  "M34.6 37.4C40 41.8 41.4 48 37.2 53.6",
  "M32.6 36.2C39.6 41.2 41.6 48.6 36.2 54.6",
] as const;

export const PROBE = {
  x1: 14.6,
  y1: 41.8,
  x2: 26.8,
  y2: 36.2,
  coralR: 1.65,
  goldR: 3.45,
} as const;

export const GOLD_POINT = { cx: 27.4, cy: 35.6 } as const;
export const FAVICON_POINT = { cx: 32, cy: 34.2, r: 4 } as const;
