-- Align rice_regions.color with src/lib/rice/regions.ts (appetite palette).
-- VIEW rice_catalog.region_color follows this table.
-- Map UI still prefers RICE_REGIONS in code; this keeps DB / seed / ops in sync.

update rice_regions as r
set
  color = v.color,
  updated_at = now()
from (
  values
    ('hokkaido-tohoku', '#7BB8C6'),
    ('kanto-koshinetsu', '#9BC45E'),
    ('tokai-hokuriku', '#E8B56A'),
    ('kansai', '#D4899A'),
    ('chugoku-shikoku', '#7BB894'),
    ('kyushu-okinawa', '#E8906A'),
    ('national', '#A892C4')
) as v(id, color)
where r.id = v.id;
