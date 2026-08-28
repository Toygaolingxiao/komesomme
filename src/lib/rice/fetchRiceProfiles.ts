import { riceSources } from "@/data/rice";
import { createBrowserClient } from "@/lib/supabase/client";
import { RICE_REGIONS, type RiceRegionRecord } from "@/lib/rice/regions";
import type { RiceProfileV2 } from "@/types/rice";
import { dedupeRiceCatalogue, identityKey, identityOf } from "./cultivarDedup";
import {
  getQuadrant,
  getSweetnessLabel,
  getTextureLabel,
} from "./matrix";
import {
  RICE_PROFILE_COLUMNS,
  RICE_PROFILE_COLUMNS_LEGACY,
  mapRowToRiceProfile,
} from "./mapRiceRow";

export type RiceCatalog = {
  profiles: RiceProfileV2[];
  regions: RiceRegionRecord[];
};

function hasSupabaseBrowserEnv(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim()
  );
}

function mapRegions(rows: Array<Record<string, unknown>> | null): RiceRegionRecord[] {
  if (!rows || rows.length === 0) return RICE_REGIONS;

  return rows
    .map((row) => {
      const id = String(row.id);
      const canonical = RICE_REGIONS.find((region) => region.id === id);
      return {
        id,
        name: String(row.name) as RiceRegionRecord["name"],
        color: canonical?.color ?? String(row.color),
        sort_order: Number(row.sort_order ?? 0),
      };
    })
    .sort((a, b) => a.sort_order - b.sort_order);
}

/**
 * Live map scores come from `src/data/rice/*`. Seed only upserts, so a stale
 * overlay row (e.g. 新之助（しんのすけ）) can linger in the catalog with
 * all-5 drafts. Matching local identity lets the UI show one calibrated point
 * without waiting on a prune-and-reseed.
 */
function hydrateFromLocal(row: RiceProfileV2): RiceProfileV2 {
  const key = identityKey(identityOf(row));
  const local =
    riceSources.find((rice) => rice.id === row.id) ??
    riceSources.find(
      (rice) => identityKey(identityOf({ id: rice.id, name: rice.name })) === key
    );

  if (!local) return row;

  return {
    ...row,
    id: local.id,
    name: local.name,
    prefecture: local.prefecture,
    region: local.region,
    sweetness: local.sweetness,
    hardness: local.hardness,
    stickiness: local.stickiness,
    aroma: local.aroma,
    umami: local.umami,
    aftertaste: local.aftertaste,
    grain_size: local.grain_size,
    clarity: local.clarity,
    richness: local.richness,
    cold_rice_quality: local.cold_rice_quality,
    sauce_absorption: local.sauce_absorption,
    oil_compatibility: local.oil_compatibility,
    quadrant: getQuadrant(local.hardness, local.sweetness),
    texture_label: getTextureLabel(local.hardness),
    sweetness_label: getSweetnessLabel(local.sweetness),
    short_: local.short_,
    description: local.description,
    sommelier_note: local.sommelier_note,
    pairing_reason: local.pairing_reason,
  };
}

/**
 * Loads the catalogue and region colours from the normalized tables.
 *
 * Falls back to the legacy wide `rice_profiles` table if `rice_catalog` is not
 * available yet (0003 not applied). Without browser Supabase env, uses the
 * local derived catalogue so layout work can run offline.
 */
export async function fetchRiceCatalog(): Promise<RiceCatalog> {
  if (!hasSupabaseBrowserEnv()) {
    const { riceProfiles } = await import("@/data/riceProfilesV2");
    return {
      profiles: dedupeRiceCatalogue(riceProfiles),
      regions: RICE_REGIONS,
    };
  }

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
    profiles: dedupeRiceCatalogue(
      (rows ?? []).map(mapRowToRiceProfile).map(hydrateFromLocal)
    ),
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
