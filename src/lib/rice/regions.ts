import type { RiceRegion } from "@/types/rice";

/** Canonical region master. Kept in sync with `rice_regions` seed rows. */
export type RiceRegionRecord = {
  id: string;
  name: RiceRegion;
  color: string;
  sort_order: number;
};

export const RICE_REGIONS: RiceRegionRecord[] = [
  { id: "hokkaido-tohoku", name: "北海道・東北", color: "#8a9c7c", sort_order: 10 },
  { id: "kanto-koshinetsu", name: "関東・甲信越", color: "#b29350", sort_order: 20 },
  { id: "tokai-hokuriku", name: "東海・北陸", color: "#aa765e", sort_order: 30 },
  { id: "kansai", name: "近畿", color: "#bea27e", sort_order: 40 },
  { id: "chugoku-shikoku", name: "中国・四国", color: "#7f9a8f", sort_order: 50 },
  { id: "kyushu-okinawa", name: "九州・沖縄", color: "#b77b72", sort_order: 60 },
  { id: "national", name: "全国銘柄", color: "#a89882", sort_order: 70 },
];

const BY_NAME = new Map(RICE_REGIONS.map((region) => [region.name, region]));
const BY_ID = new Map(RICE_REGIONS.map((region) => [region.id, region]));

export function regionByName(name: string): RiceRegionRecord {
  return BY_NAME.get(name as RiceRegion) ?? BY_ID.get("national")!;
}

export function regionById(id: string): RiceRegionRecord {
  return BY_ID.get(id) ?? BY_ID.get("national")!;
}

export function regionColor(nameOrId: string): string {
  return BY_NAME.get(nameOrId as RiceRegion)?.color ?? BY_ID.get(nameOrId)?.color ?? "#a89882";
}
