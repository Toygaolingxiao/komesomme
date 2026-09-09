import { riceProfiles } from "@/data/rice/catalog";
import { PAIRING_PAGES, type PairingPage } from "@/data/editorial/pairings";
import { rankPairingCandidates } from "@/lib/editorial/pairRank";
import type { RiceProfileV2 } from "@/types/rice";

export type ResolvedPairing = {
  page: PairingPage;
  top: RiceProfileV2[];
  avoid: RiceProfileV2[];
  avoidSource: "catalog" | "axis";
};

export function resolvePairing(page: PairingPage): ResolvedPairing {
  const ranked = rankPairingCandidates(riceProfiles, {
    aliases: page.dishAliases,
    avoidAliases: page.avoidAliases,
    bias: page.bias,
    allowAxisOppositeAvoid: page.allowAxisOppositeAvoid,
  });
  return {
    page,
    top: ranked.top,
    avoid: ranked.avoid,
    avoidSource: ranked.avoidSource,
  };
}

export function resolvePairingBySlug(slug: string): ResolvedPairing | null {
  const page = PAIRING_PAGES.find((row) => row.slug === slug);
  if (!page) return null;
  const resolved = resolvePairing(page);
  if (resolved.top.length === 0 || resolved.avoid.length === 0) return null;
  return resolved;
}

export function allResolvedPairings(): ResolvedPairing[] {
  return PAIRING_PAGES.map(resolvePairing).filter(
    (row) => row.top.length > 0 && row.avoid.length > 0
  );
}
