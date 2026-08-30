import type { RiceProfileV2 } from "@/types/rice";
import { drinkStyleLabels } from "@/components/matrix/shared";

export type SeasonPairingRow = { season: string; items: string[] };
export type DrinkPairingRow = { label: string; items: string[] };

export function catalogSeasonPairings(rice: RiceProfileV2): SeasonPairingRow[] {
  const rows: SeasonPairingRow[] = [
    { season: "春", items: rice.spring_pairings },
    { season: "夏", items: rice.summer_pairings },
    { season: "秋", items: rice.autumn_pairings },
    { season: "冬", items: rice.winter_pairings },
  ];
  return rows.filter((row) => row.items.length > 0);
}

export function catalogDrinkPairings(rice: RiceProfileV2): DrinkPairingRow[] {
  const rows: DrinkPairingRow[] = [
    { label: "日本酒", items: drinkStyleLabels(rice.sake_pairings) },
    { label: "ビール", items: drinkStyleLabels(rice.beer_pairings) },
    { label: "ワイン", items: drinkStyleLabels(rice.wine_pairings) },
    { label: "ウイスキー", items: drinkStyleLabels(rice.whisky_pairings) },
    { label: "お茶", items: drinkStyleLabels(rice.tea_pairings) },
  ];
  return rows.filter((row) => row.items.length > 0);
}

export function hasCatalogPairingGuide(rice: RiceProfileV2): boolean {
  return (
    catalogSeasonPairings(rice).length > 0 ||
    catalogDrinkPairings(rice).length > 0 ||
    rice.lifestyle_scenes.length > 0
  );
}
