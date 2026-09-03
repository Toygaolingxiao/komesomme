import { brandArtSrc } from "@/lib/editorial/art";

const warmed = new Set<string>();

/** Warm a single editorial art URL (browser cache). Safe to call often. */
export function prefetchArtUrl(src: string | null | undefined): void {
  if (!src || typeof window === "undefined") return;
  if (warmed.has(src)) return;
  warmed.add(src);
  const img = new window.Image();
  img.decoding = "async";
  img.src = src;
}

export function prefetchBrandArt(
  id: string,
  region: string,
  prefecture?: string | null
): void {
  prefetchArtUrl(brandArtSrc(id, region, prefecture));
}
