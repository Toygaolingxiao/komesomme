import { getQuadrant } from "@/lib/rice/matrix";
import type { MapProfile, RiceProfileV2 } from "@/types/rice";

/**
 * Home-map projection.
 *
 * The homepage used to serialise all 106 full profiles into its HTML. Only
 * the fields in `MapProfile` are read by the map, the recommendation rail
 * and the shop strip before a brand is opened, so the page now ships just
 * those. Full profiles are fetched per brand from `/api/rice/profile/[id]`.
 */

export function toMapProfile(rice: RiceProfileV2): MapProfile {
  return {
    id: rice.id,
    name: rice.name,
    prefecture: rice.prefecture,
    region: rice.region,
    region_id: rice.region_id,
    region_color: rice.region_color,
    sweetness: rice.sweetness,
    hardness: rice.hardness,
    stickiness: rice.stickiness,
    aroma: rice.aroma,
    umami: rice.umami,
    aftertaste: rice.aftertaste,
    grain_size: rice.grain_size,
    clarity: rice.clarity,
    richness: rice.richness,
    cold_rice_quality: rice.cold_rice_quality,
    sauce_absorption: rice.sauce_absorption,
    oil_compatibility: rice.oil_compatibility,
    texture_label: rice.texture_label,
    sweetness_label: rice.sweetness_label,
    short_: rice.short_,
    best_match_dishes: rice.best_match_dishes,
    good_with: rice.good_with,
    rakuten_search_keyword: rice.rakuten_search_keyword,
    amazon_search_keyword: rice.amazon_search_keyword,
    furusato_keywords: rice.furusato_keywords,
  };
}

export function toMapProfiles(riceList: RiceProfileV2[]): MapProfile[] {
  return riceList.map(toMapProfile);
}

const EMPTY_LIST: string[] = [];

/**
 * Fills the fields a MapProfile does not carry with inert defaults so the
 * detail panel can render from the projection alone while the full profile
 * is in flight — or when its fetch failed. Every field the panel reads for
 * its main content (name, place, taste scores, labels, short line, dishes,
 * shop keywords) is a real projection field; only the long editorial text
 * and the secondary pairing lists wait for the full profile.
 */
export function expandMapProfile(map: MapProfile): RiceProfileV2 {
  return {
    quadrant: getQuadrant(map.hardness, map.sweetness),
    avoid_pairings: EMPTY_LIST,
    spring_pairings: EMPTY_LIST,
    summer_pairings: EMPTY_LIST,
    autumn_pairings: EMPTY_LIST,
    winter_pairings: EMPTY_LIST,
    sake_pairings: EMPTY_LIST,
    beer_pairings: EMPTY_LIST,
    wine_pairings: EMPTY_LIST,
    whisky_pairings: EMPTY_LIST,
    tea_pairings: EMPTY_LIST,
    mood_pairings: EMPTY_LIST,
    occasion_pairings: EMPTY_LIST,
    lifestyle_scenes: EMPTY_LIST,
    description: "",
    sommelier_note: "",
    pairing_reason: "",
    semantic_tags: EMPTY_LIST,
    search_queries: EMPTY_LIST,
    data_source: "editorial",
    data_confidence: "medium",
    ...map,
  };
}
