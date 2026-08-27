-- KomeSomme RiceProfile V2
--
-- Run this in the Supabase SQL Editor before `npm run seed:rice`.
--
-- The table stores pure taste data only. Matrix display coordinates are computed on the
-- client by `calculateMatrixDisplayPoint`, so no matrix_x / matrix_y is persisted here.

create extension if not exists vector;

create table if not exists rice_profiles (
  id text primary key,
  name text not null,
  prefecture text not null,
  region text not null,

  sweetness numeric not null check (sweetness between 1 and 5),
  hardness numeric not null check (hardness between 1 and 5),
  stickiness numeric not null check (stickiness between 1 and 5),

  aroma numeric check (aroma between 1 and 5),
  umami numeric check (umami between 1 and 5),
  aftertaste numeric check (aftertaste between 1 and 5),
  grain_size numeric check (grain_size between 1 and 5),
  clarity numeric check (clarity between 1 and 5),
  richness numeric check (richness between 1 and 5),
  cold_rice_quality numeric check (cold_rice_quality between 1 and 5),
  sauce_absorption numeric check (sauce_absorption between 1 and 5),
  oil_compatibility numeric check (oil_compatibility between 1 and 5),

  quadrant text,
  texture_label text,
  sweetness_label text,

  best_match_dishes jsonb default '[]'::jsonb,
  good_with jsonb default '[]'::jsonb,
  avoid_pairings jsonb default '[]'::jsonb,

  spring_pairings jsonb default '[]'::jsonb,
  summer_pairings jsonb default '[]'::jsonb,
  autumn_pairings jsonb default '[]'::jsonb,
  winter_pairings jsonb default '[]'::jsonb,

  sake_pairings jsonb default '[]'::jsonb,
  beer_pairings jsonb default '[]'::jsonb,
  wine_pairings jsonb default '[]'::jsonb,
  whisky_pairings jsonb default '[]'::jsonb,
  tea_pairings jsonb default '[]'::jsonb,

  mood_pairings jsonb default '[]'::jsonb,
  occasion_pairings jsonb default '[]'::jsonb,
  lifestyle_scenes jsonb default '[]'::jsonb,

  short_ text,
  description text,
  sommelier_note text,
  pairing_reason text,

  semantic_tags jsonb default '[]'::jsonb,
  search_queries jsonb default '[]'::jsonb,
  search_text text,

  rakuten_search_keyword text,
  amazon_search_keyword text,
  furusato_keywords jsonb default '[]'::jsonb,

  -- gemini-embedding-001 (truncated to 1536 and re-normalized) and
  -- text-embedding-3-small both fit this column.
  embedding vector(1536),

  -- Vectors from different models are not comparable. Recording the producing model
  -- lets the search filter them apart instead of silently returning nonsense after a
  -- provider switch.
  embedding_model text,

  -- Taste values are KomeSomme editorial ratings, not official measurements.
  data_source text default 'editorial',
  data_confidence text default 'medium',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists rice_profiles_region_idx
on rice_profiles(region);

create index if not exists rice_profiles_prefecture_idx
on rice_profiles(prefecture);

create index if not exists rice_profiles_taste_idx
on rice_profiles(sweetness, hardness, stickiness);

create index if not exists rice_profiles_embedding_model_idx
on rice_profiles(embedding_model);

create index if not exists rice_profiles_embedding_idx
on rice_profiles
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);

-- Anonymous clients may read the catalogue; writes stay with the service role.
alter table rice_profiles enable row level security;

drop policy if exists "rice_profiles_public_read" on rice_profiles;
create policy "rice_profiles_public_read"
on rice_profiles
for select
to anon, authenticated
using (true);

create or replace function set_rice_profiles_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists rice_profiles_set_updated_at on rice_profiles;
create trigger rice_profiles_set_updated_at
before update on rice_profiles
for each row
execute function set_rice_profiles_updated_at();

-- Semantic search over search_text embeddings.
--
-- `p_embedding_model` is required so a query vector is only ever compared against rows
-- produced by the same model.
create or replace function match_rice_profiles (
  query_embedding vector(1536),
  p_embedding_model text,
  match_count int default 4,
  match_threshold float default 0.2
)
returns table (
  id text,
  name text,
  prefecture text,
  region text,
  sweetness numeric,
  hardness numeric,
  stickiness numeric,
  aroma numeric,
  umami numeric,
  aftertaste numeric,
  grain_size numeric,
  clarity numeric,
  richness numeric,
  cold_rice_quality numeric,
  sauce_absorption numeric,
  oil_compatibility numeric,
  quadrant text,
  texture_label text,
  sweetness_label text,
  best_match_dishes jsonb,
  good_with jsonb,
  avoid_pairings jsonb,
  spring_pairings jsonb,
  summer_pairings jsonb,
  autumn_pairings jsonb,
  winter_pairings jsonb,
  sake_pairings jsonb,
  beer_pairings jsonb,
  wine_pairings jsonb,
  whisky_pairings jsonb,
  tea_pairings jsonb,
  mood_pairings jsonb,
  occasion_pairings jsonb,
  lifestyle_scenes jsonb,
  short_ text,
  description text,
  sommelier_note text,
  pairing_reason text,
  semantic_tags jsonb,
  search_queries jsonb,
  rakuten_search_keyword text,
  amazon_search_keyword text,
  furusato_keywords jsonb,
  data_source text,
  data_confidence text,
  similarity float
)
language sql stable
as $$
  select
    rp.id,
    rp.name,
    rp.prefecture,
    rp.region,
    rp.sweetness,
    rp.hardness,
    rp.stickiness,
    rp.aroma,
    rp.umami,
    rp.aftertaste,
    rp.grain_size,
    rp.clarity,
    rp.richness,
    rp.cold_rice_quality,
    rp.sauce_absorption,
    rp.oil_compatibility,
    rp.quadrant,
    rp.texture_label,
    rp.sweetness_label,
    rp.best_match_dishes,
    rp.good_with,
    rp.avoid_pairings,
    rp.spring_pairings,
    rp.summer_pairings,
    rp.autumn_pairings,
    rp.winter_pairings,
    rp.sake_pairings,
    rp.beer_pairings,
    rp.wine_pairings,
    rp.whisky_pairings,
    rp.tea_pairings,
    rp.mood_pairings,
    rp.occasion_pairings,
    rp.lifestyle_scenes,
    rp.short_,
    rp.description,
    rp.sommelier_note,
    rp.pairing_reason,
    rp.semantic_tags,
    rp.search_queries,
    rp.rakuten_search_keyword,
    rp.amazon_search_keyword,
    rp.furusato_keywords,
    rp.data_source,
    rp.data_confidence,
    1 - (rp.embedding <=> query_embedding) as similarity
  from rice_profiles rp
  where rp.embedding is not null
    and rp.embedding_model = p_embedding_model
    and 1 - (rp.embedding <=> query_embedding) > match_threshold
  order by rp.embedding <=> query_embedding
  limit match_count;
$$;
