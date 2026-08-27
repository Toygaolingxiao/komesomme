import { createBrowserClient } from "@/lib/supabase/client";
import type { RiceProfileV2 } from "@/types/rice";
import { RICE_PROFILE_COLUMNS, mapRowToRiceProfile } from "./mapRiceRow";

/**
 * Loads every rice profile once.
 *
 * The catalogue is small (~90 rows), so the map, sliders and coordinate ranking all work
 * off this single snapshot without any further requests.
 */
export async function fetchRiceProfiles(): Promise<RiceProfileV2[]> {
  const supabase = createBrowserClient();

  const { data, error } = await supabase
    .from("rice_profiles")
    .select(RICE_PROFILE_COLUMNS)
    .order("name", { ascending: true });

  if (error) {
    throw new Error(error.message);
  }

  return ((data ?? []) as unknown as Array<Record<string, unknown>>).map(
    mapRowToRiceProfile
  );
}

export { mapRowToRiceProfile } from "./mapRiceRow";
