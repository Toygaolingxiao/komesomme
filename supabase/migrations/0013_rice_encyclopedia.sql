-- KomeSomme rice encyclopedia + editorial sources (publish mirror + provenance).
-- Git JSON under src/data/rice/encyclopedia/ remains source of truth.
-- Seed with: npm run seed:encyclopedia

create extension if not exists pgcrypto;

-- ---------------------------------------------------------------------------
-- 1. Official / quasi-official source registry (URL required)
-- ---------------------------------------------------------------------------
create table if not exists public.rice_editorial_sources (
  id text primary key,
  organization text not null,
  title text not null,
  url text not null,
  source_kind text not null
    check (source_kind in (
      'naro', 'pref_gov', 'kokken', 'brand_official', 'maff', 'other_official'
    )),
  accessed_on date,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint rice_editorial_sources_url_unique unique (url)
);

create index if not exists rice_editorial_sources_kind_idx
  on public.rice_editorial_sources (source_kind);

comment on table public.rice_editorial_sources is
  'Official / quasi-official URLs for encyclopedia provenance. Never invent URLs.';

-- ---------------------------------------------------------------------------
-- 2. Published encyclopedia articles (1:1 with rice_brands)
-- ---------------------------------------------------------------------------
create table if not exists public.rice_encyclopedia_articles (
  brand_id text primary key references public.rice_brands(id) on delete cascade,
  name text not null,
  reading text not null default '',
  headline text not null,
  origin text not null,
  features jsonb not null default '[]'::jsonb,
  cooking_tips jsonb not null default '[]'::jsonb,
  serving_ideas jsonb not null default '[]'::jsonb,
  purchase_notes text not null default '',
  caveats text not null default '',
  confidence text not null default 'medium'
    check (confidence in ('high', 'medium', 'low')),
  fact_status text not null default 'unverified'
    check (fact_status in ('unverified', 'partial', 'verified')),
  content_hash text,
  source_ids text[] not null default '{}',
  generated_at timestamptz,
  generator_model text,
  revised_at timestamptz,
  revision_source text,
  published_revision_id uuid,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rice_encyclopedia_articles_fact_status_idx
  on public.rice_encyclopedia_articles (fact_status);

create index if not exists rice_encyclopedia_articles_source_ids_gin
  on public.rice_encyclopedia_articles using gin (source_ids);

comment on table public.rice_encyclopedia_articles is
  'Published encyclopedia mirror. Edit in Git then seed.';

-- ---------------------------------------------------------------------------
-- 3. Immutable revision snapshots
-- ---------------------------------------------------------------------------
create table if not exists public.rice_encyclopedia_revisions (
  id uuid primary key default gen_random_uuid(),
  brand_id text not null references public.rice_brands(id) on delete cascade,
  revision_no integer not null,
  content_hash text not null,
  snapshot jsonb not null,
  created_by text not null default 'seed:encyclopedia',
  created_at timestamptz not null default now(),
  constraint rice_encyclopedia_revisions_brand_rev unique (brand_id, revision_no)
);

create index if not exists rice_encyclopedia_revisions_brand_idx
  on public.rice_encyclopedia_revisions (brand_id, revision_no desc);

comment on table public.rice_encyclopedia_revisions is
  'Append-only encyclopedia snapshots when content_hash changes.';

alter table public.rice_encyclopedia_articles
  drop constraint if exists rice_encyclopedia_articles_published_revision_fk;

alter table public.rice_encyclopedia_articles
  add constraint rice_encyclopedia_articles_published_revision_fk
  foreign key (published_revision_id)
  references public.rice_encyclopedia_revisions(id)
  on delete set null;

-- ---------------------------------------------------------------------------
-- 4. Claims with source_ids
-- ---------------------------------------------------------------------------
create table if not exists public.rice_encyclopedia_claims (
  id text primary key,
  brand_id text not null references public.rice_brands(id) on delete cascade,
  field_path text not null,
  claim_text text not null,
  status text not null
    check (status in ('verified', 'partial', 'unverified', 'removed', 'tradition')),
  source_ids text[] not null default '{}',
  notes text,
  verified_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists rice_encyclopedia_claims_brand_idx
  on public.rice_encyclopedia_claims (brand_id);

create index if not exists rice_encyclopedia_claims_status_idx
  on public.rice_encyclopedia_claims (status);

create index if not exists rice_encyclopedia_claims_source_ids_gin
  on public.rice_encyclopedia_claims using gin (source_ids);

comment on table public.rice_encyclopedia_claims is
  'Fact claims for encyclopedia articles; verified/partial require source_ids.';

-- ---------------------------------------------------------------------------
-- RLS: public read for published articles / sources / non-secret claims;
-- revisions writable only via service_role.
-- ---------------------------------------------------------------------------
alter table public.rice_editorial_sources enable row level security;
alter table public.rice_encyclopedia_articles enable row level security;
alter table public.rice_encyclopedia_revisions enable row level security;
alter table public.rice_encyclopedia_claims enable row level security;

drop policy if exists rice_editorial_sources_select_public on public.rice_editorial_sources;
create policy rice_editorial_sources_select_public
  on public.rice_editorial_sources for select
  to anon, authenticated
  using (true);

drop policy if exists rice_encyclopedia_articles_select_public on public.rice_encyclopedia_articles;
create policy rice_encyclopedia_articles_select_public
  on public.rice_encyclopedia_articles for select
  to anon, authenticated
  using (true);

drop policy if exists rice_encyclopedia_claims_select_public on public.rice_encyclopedia_claims;
create policy rice_encyclopedia_claims_select_public
  on public.rice_encyclopedia_claims for select
  to anon, authenticated
  using (status in ('verified', 'partial', 'tradition', 'removed'));

-- No anon/authenticated policies on revisions → deny by default under RLS.
revoke all on table public.rice_encyclopedia_revisions from anon, authenticated;
grant select on table public.rice_editorial_sources to anon, authenticated;
grant select on table public.rice_encyclopedia_articles to anon, authenticated;
grant select on table public.rice_encyclopedia_claims to anon, authenticated;

grant all on table public.rice_editorial_sources to service_role;
grant all on table public.rice_encyclopedia_articles to service_role;
grant all on table public.rice_encyclopedia_revisions to service_role;
grant all on table public.rice_encyclopedia_claims to service_role;
