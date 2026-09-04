/**
 * Consumer-facing scores for semantic consultation.
 *
 * Raw cosine similarity for a short name against a long search_text embedding
 * typically lands around 0.55–0.75 — showing that as "相性 69" makes an exact
 * brand lookup look like a lukewarm match. Display scores follow the same 45–100
 * band as coordinate ranking, with an exact name hit pinned at 100.
 */

import { riceProfiles } from "@/data/rice/catalog";
import { BRAND_I18N } from "@/data/rice/brandI18n";

const SIMILARITY_FLOOR = 0.12;
const SIMILARITY_CEILING = 0.82;

export type NameMatch = "exact" | "contains" | null;

function toKatakana(value: string) {
  return value.replace(/[\u3041-\u3096]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) + 0x60)
  );
}

/** NFKC, whitespace stripped, hiragana folded to katakana. 雳 → 靂 so simplified hits the catalog. */
export function normalizeBrandQuery(value: string) {
  return toKatakana(
    value.split("雳").join("靂").normalize("NFKC").replace(/[\s　]+/g, "").toLowerCase()
  );
}

const NAME_QUERY_SUFFIX = /(について|とは|を知りたい|のお米を知りたい|のお米|米)$/;

function coreQuery(value: string) {
  return normalizeBrandQuery(value)
    .replace(/[？?。！!]+$/g, "")
    .replace(/は(どの|どんな|どういう|何の|なにの?).+$/g, "")
    .replace(/(の特徴|を教えて|ってなに|って何).*$/g, "")
    .replace(NAME_QUERY_SUFFIX, "");
}

type AliasRow = { canonical: string; aliases: string[] };

let aliasIndex: AliasRow[] | null = null;

function brandAliasIndex(): AliasRow[] {
  if (aliasIndex) return aliasIndex;
  aliasIndex = riceProfiles.map((rice) => {
    const i18n = BRAND_I18N[rice.id];
    const aliases = [rice.name, i18n?.zh, i18n?.en, ...(i18n?.aliases ?? [])].filter(
      (value): value is string => Boolean(value)
    );
    return { canonical: rice.name, aliases };
  });
  return aliasIndex;
}

/** Stripped brand token, for catalog lookup when the guest names a rice in a longer question. */
export function brandCoreQuery(query: string) {
  return coreQuery(query);
}

/** Catalog 銘柄名 when the guest used an alias, zh/en name, or the Japanese name. */
export function canonicalBrandName(query: string): string | null {
  const q = coreQuery(query);
  if (!q) return null;
  for (const row of brandAliasIndex()) {
    for (const alias of row.aliases) {
      const a = normalizeBrandQuery(alias);
      if (!a) continue;
      if (q === a || (a.length >= 4 && q.includes(a))) return row.canonical;
    }
  }
  return null;
}

export function nameMatch(query: string, riceName: string): NameMatch {
  const n = normalizeBrandQuery(riceName);
  if (!n) return null;
  const aliased = canonicalBrandName(query);
  if (aliased && normalizeBrandQuery(aliased) === n) return "exact";
  const q = coreQuery(query);
  if (!q) return null;
  if (q === n) return "exact";
  if (q.includes(n) && n.length >= 3) return "contains";
  if (n.includes(q) && q.length >= 3) return "contains";
  return null;
}

/** Map cosine similarity onto the 45–100 band used by coordinate ranking. */
export function similarityToDisplayScore(similarity: number) {
  const t = (similarity - SIMILARITY_FLOOR) / (SIMILARITY_CEILING - SIMILARITY_FLOOR);
  const clamped = Math.max(0, Math.min(1, t));
  return Math.round(45 + clamped * 55);
}

export function semanticDisplayScore(similarity: number, match: NameMatch) {
  if (match === "exact") return 100;
  if (match === "contains") return Math.max(96, similarityToDisplayScore(similarity));
  return similarityToDisplayScore(similarity);
}
