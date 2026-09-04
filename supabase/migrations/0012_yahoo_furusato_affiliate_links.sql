-- Official LINE Yahoo Shopping Affiliate short links for ふるさと納税 searches.
-- Separate from yahoo_shopping_affiliate_links: same brand, different query / short code.
-- Fill `promo_url` by hand (/ops/yahoo-furusato). Empty → public ふるさと search CTA.

create table if not exists public.yahoo_furusato_affiliate_links (
  brand_id text primary key,
  name text not null,
  prefecture text not null default '',
  region text not null default '',
  promo_url text,
  search_keyword text not null default '',
  no_products boolean not null default false,
  recorded_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint yahoo_furusato_affiliate_links_promo_url_format
    check (
      promo_url is null
      or promo_url ~ '^https://yahoo\.jp/[A-Za-z0-9_-]+$'
    )
);

comment on table public.yahoo_furusato_affiliate_links is
  'Yahoo ふるさと納税 official affiliate short links. promo_url empty → site uses plain search.';
comment on column public.yahoo_furusato_affiliate_links.brand_id is 'Catalogue id (kebab-case).';
comment on column public.yahoo_furusato_affiliate_links.name is 'Display name for Table Editor.';
comment on column public.yahoo_furusato_affiliate_links.search_keyword is
  'Yahoo に貼るふるさと検索語（産地・銘柄。ふるさと納税は URL 側で足す）。';
comment on column public.yahoo_furusato_affiliate_links.promo_url is
  '推广链接. https://yahoo.jp/xxxx search-result short link only.';
comment on column public.yahoo_furusato_affiliate_links.no_products is
  'true = Yahoo 上暂时没有合适的ふるさと返礼。CTA 仍走普通搜索；观测台可筛掉待办。';
comment on column public.yahoo_furusato_affiliate_links.recorded_at is
  'When a valid promo_url was last saved. Null while empty.';

create index if not exists yahoo_furusato_affiliate_links_recorded_at_idx
  on public.yahoo_furusato_affiliate_links (recorded_at desc)
  where promo_url is not null;

create or replace function public.yahoo_furusato_affiliate_links_before_write()
returns trigger
language plpgsql
as $$
begin
  if new.promo_url is not null and btrim(new.promo_url) = '' then
    new.promo_url := null;
  end if;

  if new.promo_url is null then
    new.recorded_at := null;
  elsif tg_op = 'INSERT' then
    new.recorded_at := coalesce(new.recorded_at, now());
  elsif old.promo_url is distinct from new.promo_url then
    new.recorded_at := now();
  end if;

  new.updated_at := now();
  return new;
end;
$$;

drop trigger if exists yahoo_furusato_affiliate_links_before_write
  on public.yahoo_furusato_affiliate_links;

create trigger yahoo_furusato_affiliate_links_before_write
before insert or update on public.yahoo_furusato_affiliate_links
for each row
execute function public.yahoo_furusato_affiliate_links_before_write();

alter table public.yahoo_furusato_affiliate_links enable row level security;

revoke all on table public.yahoo_furusato_affiliate_links from anon, authenticated;
grant all on table public.yahoo_furusato_affiliate_links to service_role;
