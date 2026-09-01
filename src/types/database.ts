/**
 * Minimal Supabase Database typing.
 * Replace with `supabase gen types` output when the remote schema is stable.
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

/** Taste score columns, all rated 1-5. */
interface RiceProfileScores {
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
}

/** jsonb string-array columns. */
interface RiceProfileLists {
  best_match_dishes: string[];
  good_with: string[];
  avoid_pairings: string[];
  spring_pairings: string[];
  summer_pairings: string[];
  autumn_pairings: string[];
  winter_pairings: string[];
  sake_pairings: string[];
  beer_pairings: string[];
  wine_pairings: string[];
  whisky_pairings: string[];
  tea_pairings: string[];
  mood_pairings: string[];
  occasion_pairings: string[];
  lifestyle_scenes: string[];
  semantic_tags: string[];
  search_queries: string[];
}

interface RiceEditorialText {
  quadrant: string | null;
  texture_label: string | null;
  sweetness_label: string | null;
  short_: string | null;
  description: string | null;
  sommelier_note: string | null;
  pairing_reason: string | null;
  data_source: string | null;
  data_confidence: string | null;
}

type RiceRegionRow = {
  id: string;
  name: string;
  color: string;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
};

type RiceBrandRow = {
  id: string;
  name: string;
  prefecture: string;
  region_id: string;
  rakuten_search_keyword: string | null;
  amazon_search_keyword: string | null;
  furusato_keywords: string[];
  created_at?: string;
  updated_at?: string;
};

type RiceProfileDetailsRow = RiceProfileScores &
  RiceProfileLists &
  RiceEditorialText & {
    brand_id: string;
    search_text: string | null;
    embedding: number[] | null;
    embedding_model: string | null;
    created_at?: string;
    updated_at?: string;
  };

/** Joined catalogue (view) plus the match RPC payload. No embedding / search_text. */
type RiceCatalogRow = RiceProfileScores &
  RiceProfileLists &
  RiceEditorialText & {
    id: string;
    name: string;
    prefecture: string;
    region: string;
    region_id: string;
    region_color: string;
    rakuten_search_keyword: string | null;
    amazon_search_keyword: string | null;
    furusato_keywords: string[];
  };

/** Legacy wide table kept only so the client can fall back before 0003 is applied. */
type LegacyRiceProfileRow = RiceCatalogRow & {
  search_text: string | null;
  embedding: number[] | null;
  embedding_model: string | null;
};

export type AccessEventRow = {
  id: string;
  created_at: string;
  event: string;
  path: string | null;
  session_id: string | null;
  meta: Json;
};

export type YahooShoppingAffiliateLinkRow = {
  brand_id: string;
  name: string;
  prefecture: string;
  region: string;
  search_keyword: string;
  promo_url: string | null;
  no_products: boolean;
  recorded_at: string | null;
  created_at: string;
  updated_at: string;
};

export interface Database {
  public: {
    Tables: {
      access_events: {
        Row: AccessEventRow;
        Insert: {
          id?: string;
          created_at?: string;
          event: string;
          path?: string | null;
          session_id?: string | null;
          meta?: Json;
        };
        Update: Partial<AccessEventRow>;
        Relationships: [];
      };
      yahoo_shopping_affiliate_links: {
        Row: YahooShoppingAffiliateLinkRow;
        Insert: {
          brand_id: string;
          name: string;
          prefecture?: string;
          region?: string;
          search_keyword?: string;
          promo_url?: string | null;
          no_products?: boolean;
          recorded_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Omit<YahooShoppingAffiliateLinkRow, "brand_id">>;
        Relationships: [];
      };
      rice_regions: {
        Row: RiceRegionRow;
        Insert: Partial<RiceRegionRow> & Pick<RiceRegionRow, "id" | "name" | "color">;
        Update: Partial<RiceRegionRow>;
        Relationships: [];
      };
      rice_brands: {
        Row: RiceBrandRow;
        Insert: Partial<RiceBrandRow> &
          Pick<RiceBrandRow, "id" | "name" | "prefecture" | "region_id">;
        Update: Partial<RiceBrandRow>;
        Relationships: [
          {
            foreignKeyName: "rice_brands_region_id_fkey";
            columns: ["region_id"];
            isOneToOne: false;
            referencedRelation: "rice_regions";
            referencedColumns: ["id"];
          },
        ];
      };
      rice_profile_details: {
        Row: RiceProfileDetailsRow;
        Insert: Partial<RiceProfileDetailsRow> &
          Pick<RiceProfileDetailsRow, "brand_id" | "sweetness" | "hardness" | "stickiness">;
        Update: Partial<RiceProfileDetailsRow>;
        Relationships: [
          {
            foreignKeyName: "rice_profile_details_brand_id_fkey";
            columns: ["brand_id"];
            isOneToOne: true;
            referencedRelation: "rice_brands";
            referencedColumns: ["id"];
          },
        ];
      };
      rice_profiles: {
        Row: LegacyRiceProfileRow;
        Insert: Partial<LegacyRiceProfileRow> &
          Pick<LegacyRiceProfileRow, "id" | "name" | "prefecture" | "region">;
        Update: Partial<LegacyRiceProfileRow>;
        Relationships: [];
      };
    };
    Views: {
      rice_catalog: {
        Row: RiceCatalogRow;
        Relationships: [];
      };
    };
    Functions: {
      match_rice_profiles: {
        Args: {
          query_embedding: number[];
          p_embedding_model: string;
          match_count: number;
          match_threshold: number;
        };
        Returns: Array<RiceCatalogRow & { similarity: number }>;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type RiceProfileDbRow = RiceCatalogRow;
export type RiceRegionDbRow = RiceRegionRow;
export type RiceBrandDbRow = RiceBrandRow;
export type RiceProfileDetailsDbRow = RiceProfileDetailsRow;
