/**
 * RiceProfile V2 data model.
 *
 * Taste values (1-5) are KomeSomme editorial ratings used for recommendation and
 * visualisation. They are not official laboratory measurements, which is why every
 * record carries `data_source` and `data_confidence`. Never present them as
 * scientifically measured values in the UI.
 */

export type RiceRegion =
  | "北海道・東北"
  | "関東・甲信越"
  | "東海・北陸"
  | "近畿"
  | "中国・四国"
  | "九州・沖縄"
  | "全国銘柄";

export type DataSource = "editorial" | "official" | "producer" | "user";
export type DataConfidence = "high" | "medium" | "low";

export type RiceProfileV2 = {
  id: string;
  name: string;
  prefecture: string;
  region: RiceRegion;
  region_id?: string;
  region_color?: string;

  // Core taste values: 1-5
  sweetness: number;
  hardness: number;
  stickiness: number;
  aroma: number;
  umami: number;
  aftertaste: number;
  grain_size: number;
  clarity: number;
  richness: number;
  cold_rice_quality: number;
  sauce_absorption: number;
  oil_compatibility: number;

  // Matrix metadata
  quadrant: string;
  texture_label: string;
  sweetness_label: string;

  // Food pairing
  best_match_dishes: string[];
  good_with: string[];
  avoid_pairings: string[];

  // Seasonal pairing
  spring_pairings: string[];
  summer_pairings: string[];
  autumn_pairings: string[];
  winter_pairings: string[];

  // Drink pairing
  sake_pairings: string[];
  beer_pairings: string[];
  wine_pairings: string[];
  whisky_pairings: string[];
  tea_pairings: string[];

  // Mood and lifestyle
  mood_pairings: string[];
  occasion_pairings: string[];
  lifestyle_scenes: string[];

  // Editorial
  short_: string;
  description: string;
  sommelier_note: string;
  pairing_reason: string;
  /** Why this row is kept or merged. Used in search_text, not shown as lab data. */
  curation_notes?: string;

  // Search and commerce
  semantic_tags: string[];
  search_queries: string[];
  search_text?: string;

  rakuten_search_keyword: string;
  amazon_search_keyword?: string;
  furusato_keywords?: string[];

  data_source: DataSource;
  data_confidence: DataConfidence;
};

/**
 * Hand-authored portion of a rice profile.
 *
 * Only fields that genuinely differ per brand are written by hand. Labels, seasonal
 * pairings, beer / wine / tea pairings, mood, occasion, lifestyle scenes and search
 * metadata are derived from the taste scores by `deriveRiceProfile`, with `overrides`
 * available whenever a rule does not match the real character of a brand.
 */
export type RiceSource = Pick<
  RiceProfileV2,
  | "id"
  | "name"
  | "prefecture"
  | "region"
  | "sweetness"
  | "hardness"
  | "stickiness"
  | "aroma"
  | "umami"
  | "aftertaste"
  | "grain_size"
  | "clarity"
  | "richness"
  | "cold_rice_quality"
  | "sauce_absorption"
  | "oil_compatibility"
  | "best_match_dishes"
  | "good_with"
  | "avoid_pairings"
  | "sake_pairings"
  | "whisky_pairings"
  | "short_"
  | "description"
  | "sommelier_note"
  | "pairing_reason"
  | "rakuten_search_keyword"
> & {
  amazon_search_keyword?: string;
  furusato_keywords?: string[];
  data_source?: DataSource;
  data_confidence?: DataConfidence;
  /** Manual override applied last, for brands the derivation rules do not fit. */
  overrides?: Partial<RiceProfileV2>;
};

/**
 * The slice of a profile the home map needs before any detail is opened.
 *
 * Carries identity, the twelve taste scores (map offsets and neighbour
 * ranking read them), the labels and short lines the rail renders, the dish
 * lists the cards show, and the shop keywords. Editorial long text and the
 * pairing/scene lists stay server-side and arrive per brand through
 * `/api/rice/profile/[id]` when the detail panel opens.
 */
export type MapProfile = Pick<
  RiceProfileV2,
  | "id"
  | "name"
  | "prefecture"
  | "region"
  | "region_id"
  | "region_color"
  | "sweetness"
  | "hardness"
  | "stickiness"
  | "aroma"
  | "umami"
  | "aftertaste"
  | "grain_size"
  | "clarity"
  | "richness"
  | "cold_rice_quality"
  | "sauce_absorption"
  | "oil_compatibility"
  | "texture_label"
  | "sweetness_label"
  | "short_"
  | "best_match_dishes"
  | "good_with"
  | "rakuten_search_keyword"
  | "amazon_search_keyword"
  | "furusato_keywords"
>;

export type MapDisplayPoint = MapProfile & {
  display_x: number;
  display_y: number;
};

export type RiceDisplayPoint = RiceProfileV2 & {
  display_x: number;
  display_y: number;
};

export type RiceMatchResult<T extends MapProfile = RiceProfileV2> = {
  rice: T;
  score: number;
  distance: number;
  reason: string;
};

/** Coordinate target used by the matrix and sliders. */
export type TasteCoordinate = {
  hardness: number;
  sweetness: number;
};

/** Which ranking path produced the currently displayed recommendations. */
export type RecommendationMode = "coordinate" | "semantic";

/** Row shape returned by the `match_rice_profiles` RPC, plus the generated bridge copy. */
export type SemanticMatch = {
  id: string;
  name: string;
  prefecture: string;
  similarity: number;
  reason: string;
};
