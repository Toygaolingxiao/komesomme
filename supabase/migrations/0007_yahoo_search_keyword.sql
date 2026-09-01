-- Add the Yahoo search term column for Table Editor / ops sheet.
-- Safe to run if 0006 was applied before this column existed.

alter table public.yahoo_shopping_affiliate_links
  add column if not exists search_keyword text not null default '';

comment on column public.yahoo_shopping_affiliate_links.search_keyword is
  'Yahoo 検索に貼る語。カタログの銘柄名。promo_url とは別列。';
