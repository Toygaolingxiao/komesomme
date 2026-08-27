-- Optional V1 cleanup.
--
-- The V2 catalogue (0003) also uses a table named `rice_brands` as the name master.
-- If that schema is already in place, this script must not drop it.

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'rice_brands'
      and column_name = 'region_id'
  ) then
    raise notice 'Skipping 0002: rice_brands is the V2 name master.';
  else
    execute 'drop function if exists match_rice_brands(vector, int, float)';
    execute 'drop table if exists rice_brands';
  end if;
end $$;
