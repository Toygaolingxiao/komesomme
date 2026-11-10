import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { AXIS_POLES } from "@/components/matrix/shared";
import { riceProfiles } from "@/data/rice/catalog";
import { EDITORIAL_COLLECTIONS } from "@/data/editorial/collections";
import { PAIRING_PAGES } from "@/data/editorial/pairings";
import {
  encyclopediaManifest,
  loadEncyclopediaArticle,
} from "@/data/rice/encyclopedia/load";
import { GUIDE_ROLE } from "@/lib/brand/guideRole";
import {
  BUYING_TIPS_LINES,
  BUYING_TIPS_LINK_LABEL,
  BUYING_TIPS_TITLE,
  DIAGNOSIS_CONFLICTS,
  DIAGNOSIS_COPY,
  DISH_OPTIONS,
  OG_COPY,
  SLOT_DEFS,
  TEXTURE_OPTIONS,
} from "@/lib/diagnosis/questions";
import {
  SHARE_CARD_SLOGAN,
  shareCaption,
  shareCardBlurb,
  shareCardScores,
  shareCardTags,
} from "@/lib/brand/shareCard";
import { getSweetnessLabel, getTextureLabel } from "@/lib/rice/matrix";
import { RICE_REGIONS } from "@/lib/rice/regions";

/**
 * The OG/share-card fonts are subsets (scripts/subset-og-fonts.py). This
 * test collects the strings the four image surfaces can actually render —
 * by running the same helpers over the real catalogue — and asserts every
 * character exists in both subset fonts. When it fails, re-run:
 *   python3 scripts/subset-og-fonts.py
 * and commit the regenerated files under public/share/fonts/subset/.
 */

/** Minimal TTF cmap reader (formats 12 and 4) — enough for coverage checks. */
function fontCodePoints(buf: Buffer): Set<number> {
  const u16 = (off: number) => buf.readUInt16BE(off);
  const u32 = (off: number) => buf.readUInt32BE(off);
  const numTables = u16(4);
  let cmapOff = -1;
  for (let i = 0; i < numTables; i += 1) {
    const rec = 12 + i * 16;
    if (buf.toString("ascii", rec, rec + 4) === "cmap") {
      cmapOff = u32(rec + 8);
      break;
    }
  }
  if (cmapOff < 0) throw new Error("no cmap table");
  const numSub = u16(cmapOff + 2);
  let fmt12 = -1;
  let fmt4 = -1;
  for (let i = 0; i < numSub; i += 1) {
    const sub = cmapOff + u32(cmapOff + 8 + i * 8);
    const fmt = u16(sub);
    if (fmt === 12 && fmt12 < 0) fmt12 = sub;
    if (fmt === 4 && fmt4 < 0) fmt4 = sub;
  }
  const points = new Set<number>();
  if (fmt12 >= 0) {
    const groups = u32(fmt12 + 12);
    for (let g = 0; g < groups; g += 1) {
      const start = u32(fmt12 + 16 + g * 12);
      const end = u32(fmt12 + 20 + g * 12);
      for (let cp = start; cp <= end; cp += 1) points.add(cp);
    }
    return points;
  }
  if (fmt4 >= 0) {
    const segCount = u16(fmt4 + 6) / 2;
    const endOff = fmt4 + 14;
    const startOff = endOff + 2 * segCount + 2;
    for (let s = 0; s < segCount; s += 1) {
      const end = u16(endOff + s * 2);
      const start = u16(startOff + s * 2);
      if (start === 0xffff && end === 0xffff) continue;
      for (let cp = start; cp <= end; cp += 1) points.add(cp);
    }
    return points;
  }
  throw new Error("no format 12/4 cmap subtable");
}

function collectRenderedStrings(): string[] {
  const strings: string[] = [
    SHARE_CARD_SLOGAN,
    GUIDE_ROLE,
    "komesomme.jp/library/",
    "KomeSomme",
    JSON.stringify(AXIS_POLES),
    JSON.stringify(RICE_REGIONS),
  ];
  for (const level of [1, 1.5, 2, 2.5, 3, 3.5, 4, 4.5, 5]) {
    strings.push(getSweetnessLabel(level), getTextureLabel(level));
  }
  for (const rice of riceProfiles) {
    strings.push(
      rice.name,
      rice.prefecture,
      rice.short_ ?? "",
      rice.description ?? "",
      shareCardBlurb(rice),
      shareCaption(rice, `https://komesomme.jp/library/${rice.id}`),
      ...shareCardTags(rice),
      ...shareCardScores(rice).map((s) => s.label)
    );
  }
  for (const entry of encyclopediaManifest()) {
    const article = loadEncyclopediaArticle(entry.id);
    if (article) strings.push(JSON.stringify(article));
  }
  for (const collection of EDITORIAL_COLLECTIONS) {
    strings.push(JSON.stringify(collection));
  }
  for (const page of PAIRING_PAGES) {
    strings.push(JSON.stringify(page));
  }
  // The diagnosis result OG image renders this fixed copy plus catalogue
  // names (already collected above), so guard the copy here too.
  strings.push(
    JSON.stringify(DIAGNOSIS_COPY),
    JSON.stringify(OG_COPY),
    JSON.stringify(SLOT_DEFS),
    JSON.stringify(DIAGNOSIS_CONFLICTS),
    JSON.stringify(DISH_OPTIONS.map((option) => [option.label, option.note, option.sceneLine])),
    JSON.stringify(TEXTURE_OPTIONS.map((option) => [option.label, option.note, option.tag])),
    BUYING_TIPS_TITLE,
    BUYING_TIPS_LINK_LABEL,
    ...BUYING_TIPS_LINES,
  );
  return strings;
}

describe("OG font subsets cover every rendered character", () => {
  const fontFiles = ["NotoSansJP-500.ttf", "NotoSerifJP-700.ttf"];
  const rendered = collectRenderedStrings().join("");
  const needed = new Set<number>();
  for (const ch of rendered) {
    const cp = ch.codePointAt(0)!;
    // Control characters (e.g. the \n in share captions) are layout, not
    // glyphs — no font carries them, including the full Noto faces.
    if (cp < 0x20 || cp === 0x7f) continue;
    needed.add(cp);
  }

  for (const file of fontFiles) {
    it(`${file} covers all ${needed.size} rendered characters`, () => {
      const buf = readFileSync(
        path.join(process.cwd(), "public", "share", "fonts", "subset", file)
      );
      const covered = fontCodePoints(buf);
      const missing = [...needed]
        .filter((cp) => !covered.has(cp))
        .map((cp) => String.fromCodePoint(cp));
      expect(
        missing,
        `missing ${missing.length} characters (e.g. ${missing.slice(0, 30).join("")}). ` +
          "Re-run: python3 scripts/subset-og-fonts.py"
      ).toEqual([]);
    });
  }
});
