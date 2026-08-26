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

export interface Database {
  public: {
    Tables: {
      rice_brands: {
        Row: {
          id: string;
          name: string;
          prefecture: string;
          sweetness: number;
          hardness: number;
          stickiness: number;
          best_match_dishes: string[] | null;
          description: string;
          /** Gemini gemini-embedding-001 truncated to 1536 dims and re-normalized. */
          embedding: number[] | null;
          rakuten_search_keyword: string | null;
          affiliate_amazon: string | null;
          affiliate_furusato: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Insert: {
          id?: string;
          name: string;
          prefecture: string;
          sweetness: number;
          hardness: number;
          stickiness: number;
          best_match_dishes?: string[] | null;
          description: string;
          embedding?: number[] | null;
          rakuten_search_keyword?: string | null;
          affiliate_amazon?: string | null;
          affiliate_furusato?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          prefecture?: string;
          sweetness?: number;
          hardness?: number;
          stickiness?: number;
          best_match_dishes?: string[] | null;
          description?: string;
          embedding?: number[] | null;
          rakuten_search_keyword?: string | null;
          affiliate_amazon?: string | null;
          affiliate_furusato?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      match_rice_brands: {
        Args: {
          query_embedding: number[];
          match_count: number;
          match_threshold: number;
        };
        Returns: {
          id: string;
          name: string;
          prefecture: string;
          description: string;
          rakuten_search_keyword: string | null;
          similarity: number;
        }[];
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}

/** App-level rice brand model (aligned with `rice_brands` + docs/database_schema.md). */
export interface RiceBrand {
  id: string;
  name: string;
  prefecture: string;
  sweetness: number;
  hardness: number;
  stickiness: number;
  best_match_dishes: string[];
  description: string;
  /** 1536-dim vector (gemini-embedding-001, normalized). */
  embedding?: number[];
  rakuten_search_keyword?: string | null;
  affiliate_amazon?: string | null;
  affiliate_furusato?: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface UserSelection {
  id: string;
  user_id: string;
  rice_brand_id: string;
  reason: string;
  created_at?: string;
}

export interface RecipeRecommendation {
  recipe_name: string;
  rice_recommendations: RiceBrand[];
  reasons: string;
  confidence: number;
}

export interface MatrixFilterQuery {
  hardness_min?: number;
  hardness_max?: number;
  stickiness_min?: number;
  stickiness_max?: number;
  sweetness_min?: number;
  sweetness_max?: number;
  limit?: number;
}
