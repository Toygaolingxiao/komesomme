import type { RiceProfileV2, RiceRegion } from "@/types/rice";

/** Percent inset so extreme axis values never touch the frame. */
export const INSET = 10;
export const BAND = 100 - INSET * 2;

export const MATCH_LIMIT = 4;
export const NEIGHBOUR_LIMIT = 3;

export const ICON_WEIGHT = "bold" as const;
export const ACCENT = "#b98b32";

export const LAYER = {
  grid: 0,
  node: 10,
  probe: 20,
  bestNode: 30,
  overlay: 40,
} as const;

export const SURFACE =
  "rounded-[2rem] border border-[var(--km-border)] bg-[var(--km-surface)]/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_28px_70px_-46px_rgba(83,65,48,0.42)]";

export const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--km-accent)]";

/**
 * Region colours, keyed by the `region` column.
 *
 * Deliberately warm: a cool blue-grey for northern regions would read as the generic
 * dashboard look the design brief rules out, so northern regions use a warm sage instead.
 */
export const REGION_STYLES: Array<{ region: RiceRegion; color: string }> = [
  { region: "北海道・東北", color: "#8a9c7c" },
  { region: "関東・甲信越", color: "#b29350" },
  { region: "東海・北陸", color: "#aa765e" },
  { region: "近畿", color: "#bea27e" },
  { region: "中国・四国", color: "#7f9a8f" },
  { region: "九州・沖縄", color: "#b77b72" },
  { region: "全国銘柄", color: "#a89882" },
];

const REGION_COLOR_MAP = new Map(
  REGION_STYLES.map(({ region, color }) => [region, color])
);

export function regionColor(region: RiceRegion | string): string {
  return REGION_COLOR_MAP.get(region as RiceRegion) ?? "#a89882";
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
