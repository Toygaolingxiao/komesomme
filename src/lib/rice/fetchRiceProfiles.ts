import { createBrowserClient } from "@/lib/supabase/client";
import { RICE_REGIONS, type RiceRegionRecord } from "@/lib/rice/regions";
import type { RiceProfileV2 } from "@/types/rice";
import {
  RICE_PROFILE_COLUMNS,
  RICE_PROFILE_COLUMNS_LEGACY,
  mapRowToRiceProfile,
} from "./mapRiceRow";

export type RiceCatalog = {
  profiles: RiceProfileV2[];
  regions: RiceRegionRecord[];
};

function mapRegions(rows: Array<Record<string, unknown>> | null): RiceRegionRecord[] {
  if (!rows || rows.length === 0) return RICE_REGIONS;

  return rows
    .map((row) => ({
      id: String(row.id),
      name: String(row.name) as RiceRegionRecord["name"],
      color: String(row.color),
      sort_order: Number(row.sort_order ?? 0),
    }))
    .sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * Loads the catalogue and region colours from the normalized tables.
 *
 * Falls back to the legacy wide `rice_profiles` table if `rice_catalog` is not
 * available yet (0003 not applied).
 */
export async function fetchRiceCatalog(): Promise<RiceCatalog> {
  const supabase = createBrowserClient();

  const [catalogResult, regionResult] = await Promise.all([
    supabase.from("rice_catalog").select(RICE_PROFILE_COLUMNS).order("name", { ascending: true }),
    supabase.from("rice_regions").select("id,name,color,sort_order").order("sort_order"),
  ]);

  let rows = catalogResult.data as Array<Record<string, unknown>> | null;
  let catalogError = catalogResult.error;

  if (catalogError) {
    const legacy = await supabase
      .from("rice_profiles")
      .select(RICE_PROFILE_COLUMNS_LEGACY)
      .order("name", { ascending: true });

    if (legacy.error) {
      throw new Error(catalogError.message);
    }
    rows = (legacy.data ?? []) as Array<Record<string, unknown>>;
    catalogError = null;
  }

  return {
    profiles: (rows ?? []).map(mapRowToRiceProfile),
    regions: mapRegions(
      (regionResult.data as Array<Record<string, unknown>> | null) ?? null
    ),
  };
}

export async function fetchRiceProfiles(): Promise<RiceProfileV2[]> {
  const { profiles } = await fetchRiceCatalog();
  return profiles;
}

export { mapRowToRiceProfile } from "./mapRiceRow";
