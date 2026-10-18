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
    allowBiasFillTop: page.allowBiasFillTop,
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

export type PairingConsultation = {
  href: string;
  label: string;
  top: RiceProfileV2[];
};

/** Longest dish alias contained in the query. Ties keep the first page in PAIRING_PAGES. */
export function pairingForConsultation(query: string): PairingConsultation | null {
  const text = query.normalize("NFKC").trim();
  if (!text) return null;

  let bestLength = 0;
  let bestPage: PairingPage | null = null;

  for (const page of PAIRING_PAGES) {
    const aliases = [page.dishLabel, ...page.dishAliases];
    for (const alias of aliases) {
      const needle = alias.normalize("NFKC").trim();
      if (needle.length <= bestLength) continue;
      if (!text.includes(needle)) continue;
      bestLength = needle.length;
      bestPage = page;
    }
  }

  if (!bestPage) return null;
  const resolved = resolvePairing(bestPage);
  if (resolved.top.length === 0) return null;

  return {
    href: `/pair/${bestPage.slug}`,
    label: bestPage.dishLabel,
    top: resolved.top.slice(0, 4),
  };
}
