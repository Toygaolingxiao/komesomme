/**
 * Merge Gemini (git HEAD snapshot) + GPT batch revisions into organic encyclopedia copy.
 *
 * Usage: node --import tsx scripts/merge-encyclopedia-revisions.ts
 *
 * Inputs:
 *   .tmp/encyclopedia-gemini-head/articles/*.json
 *   docs/pj/reviews/encyclopedia-gpt-batches/batch-0N-result.json
 *   src/data/rice/catalog (prefecture / taste alignment)
 *
 * Writes articles + .tmp/encyclopedia-merge-report.md
 */

import { createHash } from "node:crypto";
import {
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  writeFileSync,
} from "node:fs";
import path from "node:path";
import { riceProfiles } from "../src/data/rice/catalog";
import { isTokuA } from "../src/data/rice/tokuA";
import type { RiceEncyclopediaArticle } from "../src/types/riceEncyclopedia";

const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, "src/data/rice/encyclopedia/articles");
const GEMINI_DIR = path.join(ROOT, ".tmp/encyclopedia-gemini-head/articles");
const BATCH_DIR = path.join(ROOT, "docs/pj/reviews/encyclopedia-gpt-batches");
const REPORT_PATH = path.join(ROOT, ".tmp/encyclopedia-merge-report.md");
const REVISION_TAG = "merged-gemini-gpt-20260910";
const MERGED_AT = new Date().toISOString();

const DEFAULT_CAVEAT =
  "掲載している味わい等の評価はKomeSomme編集部による独自の分析であり、公的な測定結果ではありません。品種の産地・育成・受賞に関する記述は公式情報を優先し、年次で変わる評価は断定しすぎないよう書いています。";

type GptRevised = Pick<
  RiceEncyclopediaArticle,
  | "headline"
  | "origin"
  | "features"
  | "cookingTips"
  | "servingIdeas"
  | "purchaseNotes"
  | "caveats"
>;

type MergeNote = {
  id: string;
  name: string;
  actions: string[];
};

function contentHash(article: RiceEncyclopediaArticle): string {
  const payload = {
    headline: article.headline,
    origin: article.origin,
    features: article.features,
    cookingTips: article.cookingTips,
    servingIdeas: article.servingIdeas,
    purchaseNotes: article.purchaseNotes,
    caveats: article.caveats,
  };
  return createHash("sha256").update(JSON.stringify(payload)).digest("hex").slice(0, 16);
}

function loadGptMap(): Map<string, GptRevised> {
  const map = new Map<string, GptRevised>();
  for (let n = 1; n <= 5; n += 1) {
    const file = path.join(BATCH_DIR, `batch-0${n}-result.json`);
    if (!existsSync(file)) throw new Error(`missing ${file}`);
    const batch = JSON.parse(readFileSync(file, "utf8")) as {
      articles: { id: string; revised: GptRevised }[];
    };
    for (const row of batch.articles) {
      if (row.id && row.revised) map.set(row.id, row.revised);
    }
  }
  return map;
}

function loadJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

/** Prefer noun-phrase feature titles; strip polite sentence endings when short. */
function normalizeFeatureTitle(title: string): string {
  let t = title.trim();
  t = t.replace(/です。?$/, "");
  t = t.replace(/ます。?$/, "");
  t = t.replace(/しています$/, "していること");
  t = t.replace(/あります$/, "あること");
  if (t.length > 28 && /。/.test(t)) {
    t = t.split("。")[0] ?? t;
  }
  return t;
}

function softenAwardClaims(text: string, brandId: string): { text: string; changed: boolean } {
  let next = text;
  const before = next;

  next = next.replace(
    /皇室への献上米としても歴史と実績を持つ銘柄として知られています/g,
    "産地では献上米として語られることもある銘柄です（時期や用途は公式発表に依ります）",
  );
  next = next.replace(
    /皇室の行事における献上米にも選ばれた実績を持つとされています/g,
    "産地では献上米に選ばれたと紹介されることがあります（公式の時期・用途は都度確認が必要です）",
  );
  next = next.replace(
    /献上米としても(?:歴史と実績を持つ|知られる|有名です)/g,
    "産地では献上米として紹介されることがあります",
  );
  next = next.replace(/日本一の|世界一の|最強の/g, "");

  if (!isTokuA(brandId)) {
    next = next.replace(
      /特A(?:評価|ランク)?(?:を(?:獲得|取得|連続取得)(?:した|しています|しています。)|の(?:お米|銘柄))?/g,
      "食味ランキングで高い評価を受けたことがある場合もある",
    );
    next = next.replace(/特A/g, "食味ランキング上位");
  } else {
    next = next.replace(
      /特A(?:を(?:連続)?(?:獲得|取得)(?:した|しています))?/g,
      "食味ランキングで特A評価を受けた年がある（産地・年次で変わる）",
    );
  }

  next = next.replace(
    /金賞を受賞(?:した|しています)/g,
    "品評会などで高い評価を受けたことがあると紹介される",
  );
  next = next.replace(/\s{2,}/g, " ").replace(/。。+/g, "。").trim();

  return { text: next, changed: next !== before };
}

function ensurePrefectureMention(origin: string, prefecture: string, name: string): string {
  if (!prefecture || prefecture === "全国") return origin;
  if (origin.includes(prefecture)) return origin;
  return `${prefecture}を主産地とする「${name}」について。${origin}`;
}

function mergeOne(
  current: RiceEncyclopediaArticle,
  gemini: RiceEncyclopediaArticle | null,
  gpt: GptRevised | null,
  prefecture: string,
): { article: RiceEncyclopediaArticle; actions: string[] } {
  const actions: string[] = [];
  const base: GptRevised = gpt ?? {
    headline: current.headline,
    origin: current.origin,
    features: current.features,
    cookingTips: current.cookingTips,
    servingIdeas: current.servingIdeas,
    purchaseNotes: current.purchaseNotes,
    caveats: current.caveats,
  };
  if (gpt) actions.push("文体はGPT改稿を採用");
  else actions.push("GPT結果なし・現行を維持");

  if (gemini?.model) {
    actions.push(`Gemini原稿保持（model=${gemini.model}）`);
  }

  let origin = ensurePrefectureMention(base.origin, prefecture, current.name);
  if (origin !== base.origin) actions.push(`origin に catalog 産地「${prefecture}」を補記`);

  let headline = base.headline;
  let purchaseNotes = base.purchaseNotes;
  let caveats = DEFAULT_CAVEAT;

  {
    const soft = softenAwardClaims(headline, current.id);
    headline = soft.text;
    if (soft.changed) actions.push("headline の受賞・献上断定を弱化");
  }
  {
    const soft = softenAwardClaims(origin, current.id);
    origin = soft.text;
    if (soft.changed) actions.push("origin の受賞・献上断定を弱化");
  }
  {
    const soft = softenAwardClaims(purchaseNotes, current.id);
    purchaseNotes = soft.text;
    if (soft.changed) actions.push("purchaseNotes の受賞断定を弱化");
  }

  const features = base.features.map((row) => {
    const title = normalizeFeatureTitle(row.title);
    const bodySoft = softenAwardClaims(row.body, current.id);
    if (title !== row.title) actions.push(`feature title 正規化: ${row.title} → ${title}`);
    return { title, body: bodySoft.text };
  });

  const cookingTips = base.cookingTips.map((row) => ({
    title: normalizeFeatureTitle(row.title),
    body: softenAwardClaims(row.body, current.id).text,
  }));

  const servingIdeas = base.servingIdeas.map((s) => softenAwardClaims(s, current.id).text);

  if (base.caveats && !/KomeSomme|編集/.test(base.caveats)) {
    caveats = `${DEFAULT_CAVEAT}${base.caveats.includes("。") ? "" : "。"}${base.caveats}`;
    actions.push("caveats に編集免責を統合");
  } else {
    actions.push("caveats を統一免責に更新");
  }

  const article: RiceEncyclopediaArticle = {
    id: current.id,
    name: current.name,
    reading: current.reading || gemini?.reading || "",
    headline,
    origin,
    features,
    cookingTips,
    servingIdeas,
    purchaseNotes,
    caveats,
    confidence: current.confidence || gemini?.confidence || "medium",
    generatedAt: gemini?.generatedAt || current.generatedAt,
    model: gemini?.model || current.model,
    revisedAt: MERGED_AT,
    revisionSource: REVISION_TAG,
    factStatus: "unverified",
    contentHash: "",
    sourceIds: [],
  };
  article.contentHash = contentHash(article);
  return { article, actions };
}

function main() {
  if (!existsSync(GEMINI_DIR)) {
    throw new Error(`Gemini snapshot missing: ${GEMINI_DIR}`);
  }
  const gptMap = loadGptMap();
  const catalogById = new Map(riceProfiles.map((r) => [r.id, r]));
  const files = readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".json"));
  const notes: MergeNote[] = [];
  let written = 0;

  for (const file of files) {
    const id = file.replace(/\.json$/, "");
    const current = loadJson<RiceEncyclopediaArticle>(path.join(ARTICLES_DIR, file));
    const geminiPath = path.join(GEMINI_DIR, file);
    const gemini = existsSync(geminiPath)
      ? loadJson<RiceEncyclopediaArticle>(geminiPath)
      : null;
    const rice = catalogById.get(id);
    const { article, actions } = mergeOne(
      current,
      gemini,
      gptMap.get(id) ?? null,
      rice?.prefecture ?? "",
    );
    writeFileSync(path.join(ARTICLES_DIR, file), `${JSON.stringify(article, null, 2)}\n`, "utf8");
    written += 1;
    notes.push({ id, name: article.name, actions });
  }

  mkdirSync(path.dirname(REPORT_PATH), { recursive: true });
  const lines = [
    `# Encyclopedia merge report`,
    ``,
    `- at: ${MERGED_AT}`,
    `- revisionSource: ${REVISION_TAG}`,
    `- articles: ${written}`,
    `- gpt map: ${gptMap.size}`,
    ``,
    `## Per article`,
    ``,
  ];
  for (const note of notes.sort((a, b) => a.id.localeCompare(b.id))) {
    lines.push(`### ${note.id}（${note.name}）`);
    for (const a of note.actions) lines.push(`- ${a}`);
    lines.push("");
  }
  writeFileSync(REPORT_PATH, lines.join("\n"), "utf8");
  console.log(
    JSON.stringify({ written, gpt: gptMap.size, report: REPORT_PATH, revision: REVISION_TAG }, null, 2),
  );
}

main();
