import type { RiceProfileV2 } from "@/types/rice";

/** Preferred taste targets (1–5) for ranking matched brands. */
export type PairTasteBias = {
  sweetness?: number;
  hardness?: number;
  stickiness?: number;
  /** Prefer higher cold_rice_quality when set (弁当). */
  coldRice?: number;
  /** Prefer higher oil_compatibility when set (唐揚げなど). */
  oilCompatibility?: number;
};

export type PairRankOptions = {
  aliases: string[];
  /** Extra strings only used when scanning avoid_pairings. */
  avoidAliases?: string[];
  bias: PairTasteBias;
  topN?: number;
  avoidN?: number;
  /**
   * When no avoid_pairings text hits, take brands farthest from the bias
   * (and not in the top list). Labelled as coordinate opposites on the page.
   */
  allowAxisOppositeAvoid?: boolean;
  /**
   * When catalogue dish matches are fewer than topN, fill the rest from
   * brands nearest the bias. Disclose this in the page sortNote.
   */
  allowBiasFillTop?: boolean;
};

export type PairRankResult = {
  top: RiceProfileV2[];
  avoid: RiceProfileV2[];
  avoidSource: "catalog" | "axis";
};

function normalize(text: string): string {
  return text.normalize("NFKC").toLowerCase();
}

/** True when `text` contains any alias as a substring. */
export function textMatchesAliases(text: string, aliases: string[]): boolean {
  const hay = normalize(text);
  return aliases.some((alias) => {
    const needle = normalize(alias).trim();
    return needle.length > 0 && hay.includes(needle);
  });
}

export function listMatchesAliases(list: string[], aliases: string[]): boolean {
  return list.some((item) => textMatchesAliases(item, aliases));
}

function distanceToBias(rice: RiceProfileV2, bias: PairTasteBias): number {
  let sum = 0;
  let weight = 0;
  const add = (value: number, target: number | undefined, w = 1) => {
    if (target == null) return;
    sum += Math.abs(value - target) * w;
    weight += w;
  };
  add(rice.sweetness, bias.sweetness, 1.2);
  add(rice.hardness, bias.hardness, 1.2);
  add(rice.stickiness, bias.stickiness, 1);
  add(rice.cold_rice_quality, bias.coldRice, 1.4);
  add(rice.oil_compatibility, bias.oilCompatibility, 1.3);
  return weight === 0 ? 0 : sum / weight;
}

/** Lower is better (closer to the dish bias). */
export function pairFitScore(rice: RiceProfileV2, bias: PairTasteBias): number {
  return distanceToBias(rice, bias);
}

export function rankPairingCandidates(
  profiles: RiceProfileV2[],
  options: PairRankOptions
): PairRankResult {
  const topN = options.topN ?? 5;
  const avoidN = options.avoidN ?? 5;
  const avoidAliases = options.avoidAliases?.length
    ? options.avoidAliases
    : options.aliases;

  const matched = profiles.filter((rice) =>
    listMatchesAliases(rice.best_match_dishes, options.aliases)
  );
  const byBiasAsc = (a: RiceProfileV2, b: RiceProfileV2) => {
    const da = pairFitScore(a, options.bias);
    const db = pairFitScore(b, options.bias);
    if (da !== db) return da - db;
    return a.id.localeCompare(b.id);
  };
  let top = [...matched].sort(byBiasAsc).slice(0, topN);

  if (options.allowBiasFillTop && top.length < topN) {
    const taken = new Set(top.map((rice) => rice.id));
    const fillers = profiles
      .filter((rice) => !taken.has(rice.id))
      .sort(byBiasAsc)
      .slice(0, topN - top.length);
    top = [...top, ...fillers];
  }

  const topIds = new Set(top.map((rice) => rice.id));

  const catalogAvoid = profiles.filter(
    (rice) =>
      !topIds.has(rice.id) &&
      listMatchesAliases(rice.avoid_pairings, avoidAliases)
  );
  if (catalogAvoid.length > 0) {
    return {
      top,
      avoid: catalogAvoid
        .sort((a, b) => a.name.localeCompare(b.name, "ja"))
        .slice(0, avoidN),
      avoidSource: "catalog",
    };
  }

  if (!options.allowAxisOppositeAvoid) {
    return { top, avoid: [], avoidSource: "catalog" };
  }

  const opposites = profiles
    .filter((rice) => !topIds.has(rice.id))
    .sort((a, b) => {
      const da = pairFitScore(a, options.bias);
      const db = pairFitScore(b, options.bias);
      if (da !== db) return db - da;
      return a.id.localeCompare(b.id);
    })
    .slice(0, avoidN);

  return { top, avoid: opposites, avoidSource: "axis" };
}

export function pairingBySlug<T extends { slug: string }>(
  pages: T[],
  slug: string
): T | null {
  return pages.find((page) => page.slug === slug) ?? null;
}
