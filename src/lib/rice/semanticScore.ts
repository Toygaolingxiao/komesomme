/**
 * Consumer-facing scores for semantic consultation.
 *
 * Raw cosine similarity for a short name against a long search_text embedding
 * typically lands around 0.55–0.75 — showing that as "相性 69" makes an exact
 * brand lookup look like a lukewarm match. Display scores follow the same 45–100
 * band as coordinate ranking, with an exact name hit pinned at 100.
 */

const SIMILARITY_FLOOR = 0.12;
const SIMILARITY_CEILING = 0.82;

export type NameMatch = "exact" | "contains" | null;

function toKatakana(value: string) {
  return value.replace(/[\u3041-\u3096]/g, (char) =>
    String.fromCharCode(char.charCodeAt(0) + 0x60)
  );
}

/** NFKC, whitespace stripped, hiragana folded to katakana. */
export function normalizeBrandQuery(value: string) {
  return toKatakana(value.normalize("NFKC").replace(/[\s　]+/g, "").toLowerCase());
}

const NAME_QUERY_SUFFIX = /(について|とは|を知りたい|のお米|のお米を知りたい|米)$/;

function coreQuery(value: string) {
  return normalizeBrandQuery(value).replace(NAME_QUERY_SUFFIX, "");
}

export function nameMatch(query: string, riceName: string): NameMatch {
  const q = coreQuery(query);
  const n = normalizeBrandQuery(riceName);
  if (!q || !n) return null;
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
