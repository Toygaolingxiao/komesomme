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
  furusato_keywords: string[];
}

interface RiceProfileText {
  quadrant: string;
  texture_label: string;
  sweetness_label: string;
  short_: string;
  description: string;
  sommelier_note: string;
  pairing_reason: string;
  search_text: string | null;
  rakuten_search_keyword: string;
  amazon_search_keyword: string | null;
  data_source: string;
  data_confidence: string;
}

type RiceProfileRow = RiceProfileScores &
  RiceProfileLists &
  RiceProfileText & {
    id: string;
    name: string;
    prefecture: string;
    region: string;
    /** 1536 dims from gemini-embedding-001 (truncated, re-normalized) or text-embedding-3-small. */
    embedding: number[] | null;
    /** Model that produced `embedding`; vectors from different models are not comparable. */
    embedding_model: string | null;
    created_at?: string;
    updated_at?: string;
  };

export interface Database {
  public: {
    Tables: {
      rice_profiles: {
        Row: RiceProfileRow;
        Insert: Partial<RiceProfileRow> &
          Pick<RiceProfileRow, "id" | "name" | "prefecture" | "region">;
        Update: Partial<RiceProfileRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_rice_profiles: {
        Args: {
          query_embedding: number[];
          p_embedding_model: string;
          match_count: number;
          match_threshold: number;
        };
        Returns: Array<
          Omit<RiceProfileRow, "embedding" | "embedding_model" | "search_text"> & {
            similarity: number;
          }
        >;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

export type RiceProfileDbRow = RiceProfileRow;
