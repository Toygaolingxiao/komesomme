import type { ShareCardStar } from "@/lib/brand/shareCard";
import { riceProfiles } from "@/data/rice/catalog";
import { toDisplayPoints } from "@/lib/rice/matrix";
import { regionColor } from "@/lib/rice/regions";
import type { MapDisplayPoint, RiceProfileV2 } from "@/types/rice";

/**
 * Full-catalog positions for the share-card image only.
 *
 * Kept off the home detail panel: that UI used to import these helpers from
 * the same module as the path/caption strings, so opening a grain pulled every
 * full profile into the browser.
 */
let cachedMapPoints: MapDisplayPoint[] | null = null;

function shareCardMapPoints(): MapDisplayPoint[] {
  if (!cachedMapPoints) {
    cachedMapPoints = toDisplayPoints(riceProfiles);
  }
  return cachedMapPoints;
}

/** Same separated layout as the home TasteMap (sunflower + repulsion). */
export function shareCardConstellation(rice: RiceProfileV2): ShareCardStar[] {
  return shareCardMapPoints()
    .filter((point) => point.id !== rice.id)
    .map((point) => ({
      id: point.id,
      display_x: point.display_x,
      display_y: point.display_y,
      region: point.region,
      region_color: point.region_color || regionColor(point.region),
    }));
}

/** @deprecated use shareCardConstellation */
export function shareCardGhosts(rice: RiceProfileV2): ShareCardStar[] {
  return shareCardConstellation(rice);
}

export function shareCardHeroPoint(rice: RiceProfileV2) {
  const point = shareCardMapPoints().find((p) => p.id === rice.id);
  if (point) {
    return { display_x: point.display_x, display_y: point.display_y };
  }
  return { display_x: 3, display_y: 3 };
}
