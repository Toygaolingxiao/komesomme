/**
 * Content-integrity checks for catalogue copy (template-splice / boilerplate
 * guard). Invoked from validate-rice-profiles, in the same style as
 * validate-pairings, and unit-tested from src/lib/rice/contentValidation.test.ts.
 *
 * The structural validator proves the catalogue is well-formed; these checks
 * guard the *wording*. The accident class they exist for: a sentence template
 * quietly reused across brands, a ranking claim printed before the ranking
 * exists, or one brand's copy pasted into another brand's entry — all of which
 * render fine and are only visible to a reader.
 */
import { EDITORIAL_COLLECTIONS } from "../src/data/editorial/collections";
import { riceProfiles } from "../src/data/rice/catalog";
import type { RiceProfileV2 } from "../src/types/rice";

export interface ContentIssues {
  errors: string[];
  warnings: string[];
}

/** Only these profile fields are scanned: the short public copy a reader sees first. */
type ProfileText = Pick<RiceProfileV2, "id" | "name" | "short_" | "description">;

/** Sentences shorter than this are phrases, not copy — reuse is expected. */
const MIN_SENTENCE_LENGTH = 12;

/** One full sentence shared verbatim by this many brands is a template, not a voice. */
const DUPLICATE_BRAND_THRESHOLD = 3;

/**
 * Cultivar names that read as common nouns, not as one brand. A bare mention
 * of these in another brand's copy is breeding-lineage talk, not a leak, so
 * they are exempt from the foreign-brand check. The distinctive catalogue
 * entries built on them carry a suffix ("コシヒカリ（魚沼産）") and those
 * full names ARE checked.
 */
const GENERIC_CULTIVAR_NAMES = ["コシヒカリ", "ヒノヒカリ"];

/** Split on Japanese sentence terminators and normalise away all whitespace. */
export function splitSentences(text: string): string[] {
  return text
    .split(/[。！？]/)
    .map((sentence) => sentence.replace(/\s+/g, ""))
    .filter((sentence) => sentence.length > 0);
}

/**
 * The same full sentence (≥ MIN_SENTENCE_LENGTH chars after normalisation) in
 * the short_/description of ≥ DUPLICATE_BRAND_THRESHOLD distinct brands is an
 * error. Repetition inside one brand's own copy does not count.
 */
export function findDuplicateSentences(profiles: ProfileText[]): string[] {
  const errors: string[] = [];
  const sentenceOwners = new Map<string, Set<string>>();
  for (const rice of profiles) {
    const own = new Set<string>();
    for (const field of [rice.short_, rice.description]) {
      for (const sentence of splitSentences(field)) {
        if (sentence.length >= MIN_SENTENCE_LENGTH) own.add(sentence);
      }
    }
    for (const sentence of own) {
      const owners = sentenceOwners.get(sentence) ?? new Set<string>();
      owners.add(rice.id);
      sentenceOwners.set(sentence, owners);
    }
  }
  for (const [sentence, owners] of sentenceOwners) {
    if (owners.size >= DUPLICATE_BRAND_THRESHOLD) {
      errors.push(
        `Duplicate sentence in ${owners.size} brands (${[...owners].join(", ")}): "${sentence}"`,
      );
    }
  }
  return errors;
}

export interface NamedText {
  source: string;
  text: string;
}

/**
 * A sentence claiming 特A for 令和8年産 cannot be true yet: the 令和8年産
 * 食味ランキング is only announced in February 2027 (令和7年産 is the latest
 * published ranking). Both terms must land in the SAME sentence — a text may
 * legitimately mention a 令和8年産 debut and, elsewhere, a 令和7年産 特A.
 * When the 令和8年産 ranking is published, advance the year below.
 */
const UNRANKED_TOKU_A_TERM = "令和8年産";

export function findPrematureTokuA(texts: NamedText[]): string[] {
  const errors: string[] = [];
  for (const { source, text } of texts) {
    for (const sentence of splitSentences(text)) {
      if (sentence.includes("特A") && sentence.includes(UNRANKED_TOKU_A_TERM)) {
        errors.push(
          `${source}: sentence claims 特A for ${UNRANKED_TOKU_A_TERM} before that ranking exists: "${sentence}"`,
        );
      }
    }
  }
  return errors;
}

/**
 * Another brand's full formal name inside a brand's short_/description is a
 * warning, not an error: most hits are legitimate lineage or comparison
 * mentions, which a human should eyeball rather than a script adjudicate.
 * Generic cultivar names (GENERIC_CULTIVAR_NAMES) and same-lineage
 * self-references (the name is part of the brand's own name, e.g.
 * 龍の瞳（いのちの壱） mentioning いのちの壱) are not reported.
 */
export function findForeignBrandMentions(profiles: ProfileText[]): string[] {
  const warnings: string[] = [];
  const names = profiles
    .map((rice) => ({ id: rice.id, name: rice.name.replace(/\s+/g, "") }))
    .filter((entry) => entry.name.length >= 3);
  for (const rice of profiles) {
    const text = `${rice.short_}${rice.description}`.replace(/\s+/g, "");
    const ownName = rice.name.replace(/\s+/g, "");
    for (const other of names) {
      if (other.id === rice.id) continue;
      if (GENERIC_CULTIVAR_NAMES.includes(other.name)) continue;
      if (ownName.includes(other.name) || other.name.includes(ownName)) continue;
      if (text.includes(other.name)) {
        warnings.push(
          `${rice.name} (${rice.id}): copy mentions another brand "${other.name}" (${other.id}) — check it is lineage/comparison, not pasted copy`,
        );
      }
    }
  }
  return warnings;
}

/** Every string anywhere in a collection counts as editorial copy. */
function collectionTexts(): NamedText[] {
  const texts: NamedText[] = [];
  const walk = (source: string, value: unknown) => {
    if (typeof value === "string") {
      texts.push({ source, text: value });
    } else if (Array.isArray(value)) {
      value.forEach((item, index) => walk(`${source}[${index}]`, item));
    } else if (value && typeof value === "object") {
      for (const [key, item] of Object.entries(value)) {
        walk(`${source}.${key}`, item);
      }
    }
  };
  for (const collection of EDITORIAL_COLLECTIONS) {
    walk(`collection:${collection.slug}`, collection);
  }
  return texts;
}

export function collectContentIssues(
  profiles: ProfileText[] = riceProfiles,
  extraTexts: NamedText[] = collectionTexts(),
): ContentIssues {
  const catalogTexts: NamedText[] = profiles.flatMap((rice) => [
    { source: `${rice.id}.short_`, text: rice.short_ },
    { source: `${rice.id}.description`, text: rice.description },
  ]);
  return {
    errors: [
      ...findDuplicateSentences(profiles),
      ...findPrematureTokuA([...catalogTexts, ...extraTexts]),
    ],
    warnings: findForeignBrandMentions(profiles),
  };
}
