/**
 * Validates Wave 2A pairing landings. Invoked from validate-rice-profiles
 * and as `node --import tsx scripts/validate-pairings.ts`.
 */
import { EDITORIAL_COLLECTIONS } from "../src/data/editorial/collections";
import { PAIRING_PAGES } from "../src/data/editorial/pairings";
import { riceProfiles } from "../src/data/rice/catalog";
import { rankPairingCandidates } from "../src/lib/editorial/pairRank";

export function collectPairingErrors(): string[] {
  const errors: string[] = [];
  const fail = (message: string) => errors.push(message);

  const slugs = new Set<string>();
  const collectionSlugs = new Set(EDITORIAL_COLLECTIONS.map((row) => row.slug));
  const pairingSlugSet = new Set(PAIRING_PAGES.map((row) => row.slug));

  if (PAIRING_PAGES.length === 0) {
    fail("PAIRING_PAGES is empty");
    return errors;
  }

  for (const page of PAIRING_PAGES) {
    const label = page.slug;

    if (slugs.has(page.slug)) fail(`Duplicate pairing slug: ${page.slug}`);
    slugs.add(page.slug);

    if (!/^[a-z0-9_]+$/.test(page.slug)) {
      fail(`${label}: slug must be lowercase snake letters`);
    }
    if (!page.dishLabel.trim()) fail(`${label}: dishLabel empty`);
    if (page.dishAliases.length === 0) fail(`${label}: dishAliases empty`);
    if (!page.title.trim() || !page.dek.trim()) fail(`${label}: title/dek empty`);
    if (page.lead.length < 2) fail(`${label}: lead needs at least 2 paragraphs`);
    if (page.lead.some((p) => !p.trim())) fail(`${label}: empty lead paragraph`);
    if (!page.sortNote.trim()) fail(`${label}: sortNote empty`);
    if (page.faq.length !== 3) fail(`${label}: faq must have exactly 3 items`);
    for (const item of page.faq) {
      if (!item.q.trim() || !item.a.trim()) fail(`${label}: faq q/a empty`);
    }
    if (page.relatedSlugs.length < 2) {
      fail(`${label}: relatedSlugs needs at least 2`);
    }
    for (const related of page.relatedSlugs) {
      if (related === page.slug) fail(`${label}: relatedSlugs self-reference`);
      if (!pairingSlugSet.has(related)) {
        fail(`${label}: related slug missing: ${related}`);
      }
    }
    if (page.collectionSlug && !collectionSlugs.has(page.collectionSlug)) {
      fail(`${label}: unknown collectionSlug ${page.collectionSlug}`);
    }
    if (page.allowAxisOppositeAvoid && !page.axisAvoidNote?.trim()) {
      fail(`${label}: axisAvoidNote required when allowAxisOppositeAvoid`);
    }

    const banned = ["還元率", "最安", "ポイント還元", "だから買え"];
    const blob = [
      page.title,
      page.dek,
      ...page.lead,
      page.sortNote,
      ...page.faq.map((f) => f.a),
    ].join("\n");
    for (const word of banned) {
      if (blob.includes(word)) fail(`${label}: banned wording "${word}"`);
    }

    const ranked = rankPairingCandidates(riceProfiles, {
      aliases: page.dishAliases,
      avoidAliases: page.avoidAliases,
      bias: page.bias,
      allowAxisOppositeAvoid: page.allowAxisOppositeAvoid,
    });
    if (ranked.top.length === 0) fail(`${label}: Top brands empty`);
    if (ranked.avoid.length === 0) fail(`${label}: 向かない empty`);
    if (ranked.avoidSource === "axis" && !page.allowAxisOppositeAvoid) {
      fail(`${label}: axis avoid without allowAxisOppositeAvoid`);
    }
  }

  return errors;
}

const isMain = process.argv[1]?.replace(/\\/g, "/").endsWith("scripts/validate-pairings.ts");

if (isMain) {
  const errors = collectPairingErrors();
  if (errors.length > 0) {
    console.error(`\nPairing validation: ${errors.length} error(s):`);
    for (const error of errors) console.error(`  - ${error}`);
    process.exit(1);
  }
  console.log(`Pairing pages: ${PAIRING_PAGES.length} ok`);
}
