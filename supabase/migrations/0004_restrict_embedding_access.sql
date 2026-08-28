-- 0004_restrict_embedding_access.sql
--
-- Goal: anon / authenticated must not read embedding or search_text.
-- Public catalogue stays on VIEW rice_catalog (no vector / search_text columns).
-- Semantic search RPC is service_role only (Next.js admin client).
--
-- Apply in Supabase SQL Editor after 0003. Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1. Catalogue VIEW runs as owner so anon need not SELECT rice_profile_details
-- ---------------------------------------------------------------------------
alter view rice_catalog set (security_invoker = false);

-- ---------------------------------------------------------------------------
-- 2. Revoke direct table access to taste vectors / search corpus
-- ---------------------------------------------------------------------------
revoke select on table rice_profile_details from anon, authenticated;

drop policy if exists "rice_profile_details_public_read" on rice_profile_details;

-- Service role bypasses RLS; no public SELECT policy on details.

-- ---------------------------------------------------------------------------
-- 3. Keep public read on regions, brands, and catalogue VIEW
-- ---------------------------------------------------------------------------
grant select on table rice_regions to anon, authenticated;
grant select on table rice_brands to anon, authenticated;
grant select on rice_catalog to anon, authenticated;

-- ---------------------------------------------------------------------------
-- 4. match_rice_profiles: server-only (embedding + service role)
-- ---------------------------------------------------------------------------
revoke execute on function match_rice_profiles(vector, text, int, float)
  from anon, authenticated, public;

grant execute on function match_rice_profiles(vector, text, int, float)
  to service_role;

-- ---------------------------------------------------------------------------
-- 5. Smoke checks (raise notices; inspect manually in SQL Editor)
-- ---------------------------------------------------------------------------
do $$
begin
  raise notice '0004 applied: rice_catalog security_invoker=false; details SELECT revoked from anon; match_rice_profiles = service_role only';
  raise notice 'Verify as anon: select embedding from rice_profile_details limit 1  → must FAIL';
  raise notice 'Verify as anon: select id, name from rice_catalog limit 1         → must SUCCEED';
end $$;
