import {
  BRAND_ART_IDS,
  COLLECTION_ART_FILES,
  MASTHEAD_ART,
  PAIRING_ART_FILES,
  REGION_ART_IDS,
  brandArtPath,
  collectionArtPath,
  pairingArtPath,
  regionArtPath,
} from "@/data/editorial/artManifest";
import {
  PREFECTURE_ART_IDS,
  prefectureArtPath,
  prefectureArtSlug,
} from "@/data/editorial/prefectureArt";
import { regionByName } from "@/lib/rice/regions";

export function mastheadArtSrc(): string | null {
  return MASTHEAD_ART;
}

export type ResolvedBrandArt =
  | { kind: "brand"; src: string }
  | { kind: "prefecture"; src: string; prefectureId: string }
  | { kind: "region"; src: string; regionId: string };

/**
 * brand → prefecture (when file exists) → macro region (neutral fallback).
 * Prefecture emphasis belongs only on prefecture / brand art — never on shared region art.
 */
export function resolveBrandArt(
  id: string,
  region: string,
  prefecture?: string | null
): ResolvedBrandArt | null {
  if (BRAND_ART_IDS.has(id)) return { kind: "brand", src: brandArtPath(id) };

  const prefSlug = prefecture ? prefectureArtSlug(prefecture) : null;
  if (prefSlug && PREFECTURE_ART_IDS.has(prefSlug)) {
    return {
      kind: "prefecture",
      src: prefectureArtPath(prefSlug),
      prefectureId: prefSlug,
    };
  }

  const regionId = regionByName(region).id;
  if (REGION_ART_IDS.has(regionId)) {
    return { kind: "region", src: regionArtPath(regionId), regionId };
  }
  return null;
}

export function brandArtSrc(
  id: string,
  region: string,
  prefecture?: string | null
): string | null {
  return resolveBrandArt(id, region, prefecture)?.src ?? null;
}

export function collectionArtSrc(artFile: string | null): string | null {
  if (!artFile) return null;
  if (!COLLECTION_ART_FILES.has(artFile)) return null;
  return collectionArtPath(artFile);
}

export function pairingArtSrc(artFile: string | null | undefined): string | null {
  if (!artFile) return null;
  if (!PAIRING_ART_FILES.has(artFile)) return null;
  return pairingArtPath(artFile);
}

/** Show furigana only when it matches the name. */
export function distinctReading(name: string, reading: string | null | undefined): string | null {
  if (!reading) return null;
  const n = name.replace(/\s/g, "");
  const r = reading.replace(/\s/g, "");
  if (!r || n === r) return null;
  return reading;
}

/** Extra taste chips that are not already the texture/sweetness labels. */
export function dossierExtraTags(rice: {
  texture_label: string;
  sweetness_label: string;
  cold_rice_quality: number;
}): string[] {
  const tags: string[] = [];
  if (rice.cold_rice_quality >= 4) tags.push("冷めても美味しい");
  return tags;
}
