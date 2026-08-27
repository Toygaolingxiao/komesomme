-- Optional cleanup: removes the V1 catalogue.
--
-- Do NOT run this together with 0001. Apply it only after `rice_profiles` has been
-- seeded and the app has been verified against it, since it drops data irreversibly.

drop function if exists match_rice_brands(vector, int, float);
drop table if exists rice_brands;
