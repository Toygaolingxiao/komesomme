-- Allow hyphens in official Yahoo short codes (e.g. https://yahoo.jp/t5-DJZ).

alter table public.yahoo_shopping_affiliate_links
  drop constraint if exists yahoo_shopping_affiliate_links_promo_url_format;

alter table public.yahoo_shopping_affiliate_links
  add constraint yahoo_shopping_affiliate_links_promo_url_format
  check (
    promo_url is null
    or promo_url ~ '^https://yahoo\.jp/[A-Za-z0-9-]+$'
  );
