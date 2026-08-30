/**
 * Compare encyclopedia articles with the live catalogue (sources + overlay).
 * Reports score/copy conflicts, banned wording, pairing clashes, and reused prose.
 */

import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { riceProfiles } from "@/data/rice/catalog";
import type { RiceEncyclopediaArticle } from "@/types/riceEncyclopedia";
import type { RiceProfileV2 } from "@/types/rice";

const ARTICLES_DIR = path.join(process.cwd(), "src/data/rice/encyclopedia/articles");

const BANNED = [
  "最強",
  "圧倒的",
  "究極",
  "唯一無二",
  "爆発",
  "無敵",
  "他の追随を許さない",
  "奇跡のお米",
  "日本一",
  "世界一",
];

const YEN = /\d[\d,]{2,}\s*円/;

type Finding = {
  id: string;
  name: string;
  kind: "conflict" | "banned" | "pairing" | "reuse" | "coverage";
  detail: string;
};

function articleBlob(article: RiceEncyclopediaArticle): string {
  return [
    article.headline,
    article.origin,
    ...article.features.flatMap((row) => [row.title, row.body]),
    ...article.cookingTips.flatMap((row) => [row.title, row.body]),
    ...article.servingIdeas,
    article.purchaseNotes,
    article.caveats,
  ].join("\n");
}

function longestOverlap(a: string, b: string, min = 24): string | null {
  const left = a.replace(/\s+/g, "");
  const right = b.replace(/\s+/g, "");
  if (left.length < min || right.length < min) return null;
  for (let i = 0; i <= left.length - min; i++) {
    const slice = left.slice(i, i + min);
    if (right.includes(slice)) return slice;
  }
  return null;
}

function mentionsAffirmed(text: string, pattern: RegExp, negators: RegExp): boolean {
  const global = new RegExp(pattern.source, "g");
  for (const match of text.matchAll(global)) {
    const start = Math.max(0, (match.index ?? 0) - 24);
    const window = text.slice(start, (match.index ?? 0) + match[0].length + 28);
    if (!negators.test(window)) return true;
  }
  return false;
}

function scoreConflicts(rice: RiceProfileV2, text: string): string[] {
  const hits: string[] = [];
  const deny = /控えめ|なく|ない|ではなく|向かない|分かれ/;
  if (
    rice.stickiness >= 4 &&
    mentionsAffirmed(text, /粘りが少なく|粘り少な|パラリとほどける/, deny)
  ) {
    hits.push(`stickiness=${rice.stickiness} なのに「粘り少な／パラリ」`);
  }
  if (
    rice.stickiness <= 2 &&
    mentionsAffirmed(text, /強い粘り|非常に強い粘り|餅のような|もっちりとした強い/, deny)
  ) {
    hits.push(`stickiness=${rice.stickiness} なのに強い粘り表現`);
  }
  if (rice.sweetness >= 4 && mentionsAffirmed(text, /甘みは控えめ|甘みはすっきり|甘みは淡/, deny)) {
    hits.push(`sweetness=${rice.sweetness} なのに控えめ甘み`);
  }
  if (
    rice.sweetness <= 2 &&
    mentionsAffirmed(text, /濃厚な甘み|強い甘み|甘みが強い|甘みがふくら/, deny)
  ) {
    hits.push(`sweetness=${rice.sweetness} なのに濃厚甘み`);
  }
  if (rice.grain_size >= 4 && mentionsAffirmed(text, /小粒/, deny)) {
    hits.push(`grain_size=${rice.grain_size} なのに小粒`);
  }
  if (
    rice.grain_size <= 2 &&
    mentionsAffirmed(text, /超大粒|約1\.5倍|1\.5倍の大粒/, deny)
  ) {
    hits.push(`grain_size=${rice.grain_size} なのに超大粒`);
  }
  if (
    rice.hardness >= 4 &&
    mentionsAffirmed(text, /ふんわりとした柔らか|やわらかくほどける|柔らかな口当たり/, deny)
  ) {
    hits.push(`hardness=${rice.hardness} なのにやわらか表現`);
  }
  if (
    rice.hardness <= 2 &&
    mentionsAffirmed(text, /硬めの食感|歯ごたえが強い|しっかり噛みごたえ/, deny)
  ) {
    hits.push(`hardness=${rice.hardness} なのに硬め表現`);
  }
  if (
    rice.cold_rice_quality <= 2 &&
    mentionsAffirmed(text, /冷めても美味|冷めても硬くなりにく|弁当に最適|おにぎりに最適/, deny)
  ) {
    hits.push(`cold_rice_quality=${rice.cold_rice_quality} なのに弁当向き`);
  }
  return hits;
}

function pairingConflicts(rice: RiceProfileV2, article: RiceEncyclopediaArticle): string[] {
  const blob = article.servingIdeas.join("\n");
  const hits: string[] = [];
  for (const avoid of rice.avoid_pairings) {
    if (avoid.length >= 4 && blob.includes(avoid)) {
      hits.push(`食卓提案が avoid「${avoid}」を勧めている`);
    }
  }
  return hits;
}

function main() {
  const files = readdirSync(ARTICLES_DIR).filter((name) => name.endsWith(".json"));
  const articles = new Map<string, RiceEncyclopediaArticle>();
  for (const file of files) {
    const article = JSON.parse(
      readFileSync(path.join(ARTICLES_DIR, file), "utf8"),
    ) as RiceEncyclopediaArticle;
    articles.set(article.id, article);
  }

  const findings: Finding[] = [];
  const models: Record<string, number> = {};

  for (const rice of riceProfiles) {
    const article = articles.get(rice.id);
    if (!article) {
      findings.push({
        id: rice.id,
        name: rice.name,
        kind: "coverage",
        detail: "encyclopedia 記事がない",
      });
      continue;
    }
    models[article.model] = (models[article.model] ?? 0) + 1;

    const blob = articleBlob(article);
    for (const word of BANNED) {
      if (blob.includes(word) && !(word === "神" && /神奈川|神戸|神話/.test(blob))) {
        findings.push({
          id: rice.id,
          name: rice.name,
          kind: "banned",
          detail: `encyclopedia に禁止語「${word}」`,
        });
      }
    }
    if (YEN.test(blob)) {
      findings.push({
        id: rice.id,
        name: rice.name,
        kind: "banned",
        detail: "具体的な円金額を記載している",
      });
    }

    for (const hit of scoreConflicts(rice, blob)) {
      findings.push({ id: rice.id, name: rice.name, kind: "conflict", detail: hit });
    }
    for (const hit of pairingConflicts(rice, article)) {
      findings.push({ id: rice.id, name: rice.name, kind: "pairing", detail: hit });
    }

    const overlapDesc = longestOverlap(rice.description, article.origin);
    const overlapShort = longestOverlap(rice.short_, article.headline);
    if (overlapDesc) {
      findings.push({
        id: rice.id,
        name: rice.name,
        kind: "reuse",
        detail: `origin が description を流用（${overlapDesc.slice(0, 36)}…）`,
      });
    }
    if (overlapShort) {
      findings.push({
        id: rice.id,
        name: rice.name,
        kind: "reuse",
        detail: `headline が short_ を流用（${overlapShort.slice(0, 36)}…）`,
      });
    }
  }

  for (const [id, article] of articles) {
    if (!riceProfiles.some((rice) => rice.id === id)) {
      findings.push({
        id,
        name: article.name,
        kind: "coverage",
        detail: "catalog に無い encyclopedia 記事",
      });
    }
  }

  const byKind = findings.reduce<Record<string, number>>((acc, row) => {
    acc[row.kind] = (acc[row.kind] ?? 0) + 1;
    return acc;
  }, {});

  console.log(
    JSON.stringify(
      {
        catalog: riceProfiles.length,
        articles: articles.size,
        models,
        counts: byKind,
        findings: findings.sort((a, b) => a.kind.localeCompare(b.kind) || a.id.localeCompare(b.id)),
      },
      null,
      2,
    ),
  );
}

main();
