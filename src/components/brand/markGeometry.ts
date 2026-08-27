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
 * it reading as a leaf or a plain almond.
 */
export const GRAIN_PATH =
  "M27 12.2C29.6 14.7 34.4 14.7 37 12.2C45.4 15.4 51 23.2 51 33.6C51 45.4 43.2 54.8 32 57.6C20.8 54.8 13 45.4 13 33.6C13 23.2 18.6 15.4 27 12.2Z";

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
