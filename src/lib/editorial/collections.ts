import { EDITORIAL_COLLECTIONS, type EditorialCollection } from "@/data/editorial/collections";
import { jstMonth } from "@/lib/editorial/jst";

function withKnownRice(collection: EditorialCollection, knownIds: Set<string>): EditorialCollection {
  return {
    ...collection,
    riceIds: collection.riceIds.filter((id) => knownIds.has(id)),
  };
}

export function collectionBySlug(
  slug: string,
  knownIds: Set<string>
): EditorialCollection | null {
  const found = EDITORIAL_COLLECTIONS.find((row) => row.slug === slug);
  if (!found) return null;
  const next = withKnownRice(found, knownIds);
  return next.riceIds.length > 0 ? next : null;
}

export function allCollections(knownIds: Set<string>): EditorialCollection[] {
  return EDITORIAL_COLLECTIONS.map((row) => withKnownRice(row, knownIds)).filter(
    (row) => row.riceIds.length > 0
  );
}

/** Collections whose months include the Tokyo calendar month. */
export function featuredCollections(
  knownIds: Set<string>,
  now: Date | number = Date.now(),
  cap = 2
): EditorialCollection[] {
  const month = jstMonth(now);
  return allCollections(knownIds)
    .filter((row) => row.months.includes(month))
    .slice(0, cap);
}

/**
 * `dateLabel` is Tokyo display copy ("2026年9月2日 0時02分"). Article JSON-LD needs
 * ISO 8601, so parse that one shape and give up rather than guess.
 */
export function collectionPublishedIso(dateLabel: string): string | undefined {
  const match = /^(\d{4})年(\d{1,2})月(\d{1,2})日(?:\s*(\d{1,2})時(\d{1,2})分)?$/.exec(
    dateLabel.trim()
  );
  if (!match) return undefined;
  const [, year, month, day, hour = "0", minute = "0"] = match;
  const pad = (value: string) => value.padStart(2, "0");
  return `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:00+09:00`;
}

/** Index order: this month's features first, then the rest. */
export function collectionsForIndex(
  knownIds: Set<string>,
  now: Date | number = Date.now()
): EditorialCollection[] {
  const month = jstMonth(now);
  const all = allCollections(knownIds);
  const featured = all.filter((row) => row.months.includes(month));
  const rest = all.filter((row) => !row.months.includes(month));
  return [...featured, ...rest];
}
