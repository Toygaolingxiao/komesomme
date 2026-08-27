import type { RiceProfileV2, RiceRegion } from "@/types/rice";
import { RICE_REGIONS } from "./regions";
import { normalizeTasteValue } from "./matrix";

/**
 * Row-to-profile mapping, kept free of any Supabase client import.
 *
 * Both the browser fetch and the server-side semantic route need it, and the route must
 * not pull in the browser client.
 *
 * `embedding` and `search_text` are deliberately excluded: nothing in the UI ranks by
 * vector, so shipping ~90 embeddings of 1536 floats to the browser would be wasted.
 */
const RICE_PROFILE_COLUMN_LIST = [
  "id",
  "name",
  "prefecture",
  "region",
  "region_id",
  "region_color",
  "sweetness",
  "hardness",
  "stickiness",
  "aroma",
  "umami",
  "aftertaste",
  "grain_size",
  "clarity",
  "richness",
  "cold_rice_quality",
  "sauce_absorption",
  "oil_compatibility",
  "quadrant",
  "texture_label",
  "sweetness_label",
  "best_match_dishes",
  "good_with",
  "avoid_pairings",
  "spring_pairings",
  "summer_pairings",
  "autumn_pairings",
  "winter_pairings",
  "sake_pairings",
  "beer_pairings",
  "wine_pairings",
  "whisky_pairings",
  "tea_pairings",
  "mood_pairings",
  "occasion_pairings",
  "lifestyle_scenes",
  "short_",
  "description",
  "sommelier_note",
  "pairing_reason",
  "semantic_tags",
  "search_queries",
  "rakuten_search_keyword",
  "amazon_search_keyword",
  "furusato_keywords",
  "data_source",
  "data_confidence",
] as const;

export const RICE_PROFILE_COLUMNS = RICE_PROFILE_COLUMN_LIST.join(",");

/** Wide `rice_profiles` (0001) has no region_id / region_color columns. */
export const RICE_PROFILE_COLUMNS_LEGACY = RICE_PROFILE_COLUMN_LIST.filter(
  (column) => column !== "region_id" && column !== "region_color"
).join(",");

const REGIONS: RiceRegion[] = RICE_REGIONS.map((region) => region.name);

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) {
    return value.filter((item): item is string => typeof item === "string");
  }
  // jsonb can arrive as a JSON string depending on the client transport.
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      return Array.isArray(parsed)
        ? parsed.filter((item): item is string => typeof item === "string")
        : [];
    } catch {
      return [];
    }
  }
  return [];
}

function asRegion(value: unknown): RiceRegion {
  return REGIONS.includes(value as RiceRegion) ? (value as RiceRegion) : "全国銘柄";
}

function asText(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export function mapRowToRiceProfile(row: Record<string, unknown>): RiceProfileV2 {
  return {
    id: String(row.id),
    name: asText(row.name),
    prefecture: asText(row.prefecture),
    region: asRegion(row.region),
    region_id: asText(row.region_id) || undefined,
    region_color: asText(row.region_color) || undefined,

    sweetness: normalizeTasteValue(Number(row.sweetness)),
    hardness: normalizeTasteValue(Number(row.hardness)),
    stickiness: normalizeTasteValue(Number(row.stickiness)),
    aroma: normalizeTasteValue(Number(row.aroma)),
    umami: normalizeTasteValue(Number(row.umami)),
    aftertaste: normalizeTasteValue(Number(row.aftertaste)),
    grain_size: normalizeTasteValue(Number(row.grain_size)),
    clarity: normalizeTasteValue(Number(row.clarity)),
    richness: normalizeTasteValue(Number(row.richness)),
    cold_rice_quality: normalizeTasteValue(Number(row.cold_rice_quality)),
    sauce_absorption: normalizeTasteValue(Number(row.sauce_absorption)),
    oil_compatibility: normalizeTasteValue(Number(row.oil_compatibility)),

    quadrant: asText(row.quadrant),
    texture_label: asText(row.texture_label),
    sweetness_label: asText(row.sweetness_label),

    best_match_dishes: asStringArray(row.best_match_dishes),
    good_with: asStringArray(row.good_with),
    avoid_pairings: asStringArray(row.avoid_pairings),

    spring_pairings: asStringArray(row.spring_pairings),
    summer_pairings: asStringArray(row.summer_pairings),
    autumn_pairings: asStringArray(row.autumn_pairings),
    winter_pairings: asStringArray(row.winter_pairings),

    sake_pairings: asStringArray(row.sake_pairings),
    beer_pairings: asStringArray(row.beer_pairings),
    wine_pairings: asStringArray(row.wine_pairings),
    whisky_pairings: asStringArray(row.whisky_pairings),
    tea_pairings: asStringArray(row.tea_pairings),

    mood_pairings: asStringArray(row.mood_pairings),
    occasion_pairings: asStringArray(row.occasion_pairings),
    lifestyle_scenes: asStringArray(row.lifestyle_scenes),

    short_: asText(row.short_),
    description: asText(row.description),
    sommelier_note: asText(row.sommelier_note),
    pairing_reason: asText(row.pairing_reason),

    semantic_tags: asStringArray(row.semantic_tags),
    search_queries: asStringArray(row.search_queries),

    rakuten_search_keyword: asText(row.rakuten_search_keyword),
    amazon_search_keyword: asText(row.amazon_search_keyword),
    furusato_keywords: asStringArray(row.furusato_keywords),

    data_source: (row.data_source as RiceProfileV2["data_source"]) ?? "editorial",
    data_confidence:
      (row.data_confidence as RiceProfileV2["data_confidence"]) ?? "medium",
  };
}
