-- KomeSomme: split the wide rice_profiles table into linked masters.
--
-- Run this in the Supabase SQL Editor.
-- If 0001 already created rice_profiles, this migrates then drops that wide table.
-- A new project can run 0003 only (0001 / 0002 are not required).
-- Region colours here match src/lib/rice/regions.ts (food-chart chroma).
--
-- Tables:
--   rice_regions          地域マスタ（表示名 + 地図色）
--   rice_brands           名称マスタ（銘柄名・産地・購買キーワード）
--   rice_profile_details  詳細（味わい・解説・embedding）
-- View:
--   rice_catalog          3テーブルを結合した読み取り専用カタログ

create extension if not exists vector;

-- ---------------------------------------------------------------------------
-- 1. 地域マスタ
-- ---------------------------------------------------------------------------
create table if not exists rice_regions (
  id text primary key,
  name text not null unique,
  color text not null,
  sort_order integer not null default 0,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into rice_regions (id, name, color, sort_order) values
  ('hokkaido-tohoku', '北海道・東北', '#2E86DE', 10),
  ('kanto-koshinetsu', '関東・甲信越', '#D946A6', 20),
  ('tokai-hokuriku', '東海・北陸', '#22A34A', 30),
  ('kansai', '近畿', '#F97316', 40),
  ('chugoku-shikoku', '中国・四国', '#14B8A6', 50),
  ('kyushu-okinawa', '九州・沖縄', '#F43F6E', 60),
  ('national', '全国銘柄', '#F59E0B', 70)
on conflict (id) do update
set name = excluded.name,
    color = excluded.color,
    sort_order = excluded.sort_order,
    updated_at = now();

-- ---------------------------------------------------------------------------
-- 2. 名称マスタ
-- ---------------------------------------------------------------------------
-- V1 の rice_brands（embedding 付きワイドテーブル）が残っていると、
-- create table if not exists が何もしないため、region_id 挿入が失敗する。
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'rice_brands'
  ) and not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'rice_brands'
      and column_name = 'region_id'
  ) then
    drop function if exists match_rice_brands(vector, int, float);
    drop table rice_brands cascade;
  end if;
end $$;

create table if not exists rice_brands (
  id text primary key,
  name text not null,
  prefecture text not null,
  region_id text not null references rice_regions(id),
  rakuten_search_keyword text,
  amazon_search_keyword text,
  furusato_keywords jsonb default '[]'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists rice_brands_region_idx on rice_brands(region_id);
create index if not exists rice_brands_name_idx on rice_brands(name);

-- ---------------------------------------------------------------------------
-- 3. 詳細（味わい・文章・ベクトル）
-- ---------------------------------------------------------------------------
create table if not exists rice_profile_details (
  brand_id text primary key references rice_brands(id) on delete cascade,

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

  embedding vector(1536),
  embedding_model text,

  data_source text default 'editorial',
  data_confidence text default 'medium',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists rice_profile_details_taste_idx
on rice_profile_details(sweetness, hardness, stickiness);

create index if not exists rice_profile_details_embedding_model_idx
on rice_profile_details(embedding_model);

-- Embedding ANN index is created after the RPC (HNSW works on empty tables;
-- ivfflat with lists=100 fails until there are more rows than lists).

-- ---------------------------------------------------------------------------
-- 4. 旧 rice_profiles（単一ワイドテーブル）からの移行
-- ---------------------------------------------------------------------------
do $$
begin
  if exists (
    select 1
    from information_schema.tables
    where table_schema = 'public'
      and table_name = 'rice_profiles'
      and table_type = 'BASE TABLE'
  ) then
    insert into rice_brands (
      id, name, prefecture, region_id,
      rakuten_search_keyword, amazon_search_keyword, furusato_keywords
    )
    select
      p.id,
      p.name,
      p.prefecture,
      coalesce(
        (select r.id from rice_regions r where r.name = p.region),
        'national'
      ),
      p.rakuten_search_keyword,
      p.amazon_search_keyword,
      coalesce(p.furusato_keywords, '[]'::jsonb)
    from rice_profiles p
    on conflict (id) do update
    set name = excluded.name,
        prefecture = excluded.prefecture,
        region_id = excluded.region_id,
        rakuten_search_keyword = excluded.rakuten_search_keyword,
        amazon_search_keyword = excluded.amazon_search_keyword,
        furusato_keywords = excluded.furusato_keywords,
        updated_at = now();

    insert into rice_profile_details (
      brand_id,
      sweetness, hardness, stickiness, aroma, umami, aftertaste,
      grain_size, clarity, richness, cold_rice_quality, sauce_absorption, oil_compatibility,
      quadrant, texture_label, sweetness_label,
      best_match_dishes, good_with, avoid_pairings,
      spring_pairings, summer_pairings, autumn_pairings, winter_pairings,
      sake_pairings, beer_pairings, wine_pairings, whisky_pairings, tea_pairings,
      mood_pairings, occasion_pairings, lifestyle_scenes,
      short_, description, sommelier_note, pairing_reason,
      semantic_tags, search_queries, search_text,
      embedding, embedding_model, data_source, data_confidence
    )
    select
      p.id,
      p.sweetness, p.hardness, p.stickiness, p.aroma, p.umami, p.aftertaste,
      p.grain_size, p.clarity, p.richness, p.cold_rice_quality, p.sauce_absorption, p.oil_compatibility,
      p.quadrant, p.texture_label, p.sweetness_label,
      coalesce(p.best_match_dishes, '[]'::jsonb),
      coalesce(p.good_with, '[]'::jsonb),
      coalesce(p.avoid_pairings, '[]'::jsonb),
      coalesce(p.spring_pairings, '[]'::jsonb),
      coalesce(p.summer_pairings, '[]'::jsonb),
      coalesce(p.autumn_pairings, '[]'::jsonb),
      coalesce(p.winter_pairings, '[]'::jsonb),
      coalesce(p.sake_pairings, '[]'::jsonb),
      coalesce(p.beer_pairings, '[]'::jsonb),
      coalesce(p.wine_pairings, '[]'::jsonb),
      coalesce(p.whisky_pairings, '[]'::jsonb),
      coalesce(p.tea_pairings, '[]'::jsonb),
      coalesce(p.mood_pairings, '[]'::jsonb),
      coalesce(p.occasion_pairings, '[]'::jsonb),
      coalesce(p.lifestyle_scenes, '[]'::jsonb),
      p.short_, p.description, p.sommelier_note, p.pairing_reason,
      coalesce(p.semantic_tags, '[]'::jsonb),
      coalesce(p.search_queries, '[]'::jsonb),
      p.search_text,
      p.embedding, p.embedding_model, p.data_source, p.data_confidence
    from rice_profiles p
    on conflict (brand_id) do nothing;

    drop table rice_profiles cascade;
  end if;
end $$;

-- ---------------------------------------------------------------------------
-- 5. 読み取り用カタログ VIEW
-- ---------------------------------------------------------------------------
create or replace view rice_catalog as
select
  b.id,
  b.name,
  b.prefecture,
  r.name as region,
  r.id as region_id,
  r.color as region_color,
  d.sweetness,
  d.hardness,
  d.stickiness,
  d.aroma,
  d.umami,
  d.aftertaste,
  d.grain_size,
  d.clarity,
  d.richness,
  d.cold_rice_quality,
  d.sauce_absorption,
  d.oil_compatibility,
  d.quadrant,
  d.texture_label,
  d.sweetness_label,
  d.best_match_dishes,
  d.good_with,
  d.avoid_pairings,
  d.spring_pairings,
  d.summer_pairings,
  d.autumn_pairings,
  d.winter_pairings,
  d.sake_pairings,
  d.beer_pairings,
  d.wine_pairings,
  d.whisky_pairings,
  d.tea_pairings,
  d.mood_pairings,
  d.occasion_pairings,
  d.lifestyle_scenes,
  d.short_,
  d.description,
  d.sommelier_note,
  d.pairing_reason,
  d.semantic_tags,
  d.search_queries,
  b.rakuten_search_keyword,
  b.amazon_search_keyword,
  b.furusato_keywords,
  d.data_source,
  d.data_confidence
from rice_brands b
join rice_regions r on r.id = b.region_id
join rice_profile_details d on d.brand_id = b.id;

alter view rice_catalog set (security_invoker = true);

-- ---------------------------------------------------------------------------
-- 6. RLS
-- ---------------------------------------------------------------------------
alter table rice_regions enable row level security;
alter table rice_brands enable row level security;
alter table rice_profile_details enable row level security;

drop policy if exists "rice_regions_public_read" on rice_regions;
create policy "rice_regions_public_read"
on rice_regions for select to anon, authenticated using (true);

drop policy if exists "rice_brands_public_read" on rice_brands;
create policy "rice_brands_public_read"
on rice_brands for select to anon, authenticated using (true);

drop policy if exists "rice_profile_details_public_read" on rice_profile_details;
create policy "rice_profile_details_public_read"
on rice_profile_details for select to anon, authenticated using (true);

-- ---------------------------------------------------------------------------
-- 7. updated_at triggers
-- ---------------------------------------------------------------------------
create or replace function set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists rice_regions_set_updated_at on rice_regions;
create trigger rice_regions_set_updated_at
before update on rice_regions
for each row execute function set_updated_at();

drop trigger if exists rice_brands_set_updated_at on rice_brands;
create trigger rice_brands_set_updated_at
before update on rice_brands
for each row execute function set_updated_at();

drop trigger if exists rice_profile_details_set_updated_at on rice_profile_details;
create trigger rice_profile_details_set_updated_at
before update on rice_profile_details
for each row execute function set_updated_at();

-- ---------------------------------------------------------------------------
-- 8. 意味検索 RPC（詳細テーブルの embedding を、名称・地域と結合して返す）
-- ---------------------------------------------------------------------------
drop function if exists match_rice_profiles(vector, text, int, float);

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
  region_id text,
  region_color text,
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
    b.id,
    b.name,
    b.prefecture,
    r.name as region,
    r.id as region_id,
    r.color as region_color,
    d.sweetness,
    d.hardness,
    d.stickiness,
    d.aroma,
    d.umami,
    d.aftertaste,
    d.grain_size,
    d.clarity,
    d.richness,
    d.cold_rice_quality,
    d.sauce_absorption,
    d.oil_compatibility,
    d.quadrant,
    d.texture_label,
    d.sweetness_label,
    d.best_match_dishes,
    d.good_with,
    d.avoid_pairings,
    d.spring_pairings,
    d.summer_pairings,
    d.autumn_pairings,
    d.winter_pairings,
    d.sake_pairings,
    d.beer_pairings,
    d.wine_pairings,
    d.whisky_pairings,
    d.tea_pairings,
    d.mood_pairings,
    d.occasion_pairings,
    d.lifestyle_scenes,
    d.short_,
    d.description,
    d.sommelier_note,
    d.pairing_reason,
    d.semantic_tags,
    d.search_queries,
    b.rakuten_search_keyword,
    b.amazon_search_keyword,
    b.furusato_keywords,
    d.data_source,
    d.data_confidence,
    1 - (d.embedding <=> query_embedding) as similarity
  from rice_profile_details d
  join rice_brands b on b.id = d.brand_id
  join rice_regions r on r.id = b.region_id
  where d.embedding is not null
    and d.embedding_model = p_embedding_model
    and 1 - (d.embedding <=> query_embedding) > match_threshold
  order by d.embedding <=> query_embedding
  limit match_count;
$$;

grant usage on schema public to anon, authenticated;
grant select on table rice_regions to anon, authenticated;
grant select on table rice_brands to anon, authenticated;
grant select on table rice_profile_details to anon, authenticated;
grant select on rice_catalog to anon, authenticated;
grant execute on function match_rice_profiles(vector, text, int, float) to anon, authenticated;

-- Approximate nearest neighbour. Sequential scan is fine for ~100 rows if this fails.
do $$
begin
  execute $idx$
    create index if not exists rice_profile_details_embedding_idx
    on rice_profile_details
    using hnsw (embedding vector_cosine_ops)
  $idx$;
exception
  when others then
    raise notice 'Skipping embedding HNSW index: %', sqlerrm;
end $$;
