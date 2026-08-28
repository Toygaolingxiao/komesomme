-- Anonymous product analytics (page views + UI events).
-- Writes only via service_role from the Next.js API. No anon SELECT.

create table if not exists public.access_events (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  event text not null,
  path text,
  session_id text,
  meta jsonb not null default '{}'::jsonb
);

create index if not exists access_events_created_at_idx
  on public.access_events (created_at desc);

create index if not exists access_events_event_created_at_idx
  on public.access_events (event, created_at desc);

alter table public.access_events enable row level security;

revoke all on table public.access_events from anon, authenticated;
grant all on table public.access_events to service_role;

comment on table public.access_events is
  'KomeSomme access / UI events. No SELECT for anon. Insert via server API only.';
