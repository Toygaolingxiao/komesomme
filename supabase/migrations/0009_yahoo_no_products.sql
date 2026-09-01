-- Flag brands with no usable Yahoo Shopping rice listings right now.

alter table public.yahoo_shopping_affiliate_links
  add column if not exists no_products boolean not null default false;

comment on column public.yahoo_shopping_affiliate_links.no_products is
  'true = Yahoo 上暂时没有合适的米商品。CTA 仍走普通搜索；观测台可筛掉待办。';
