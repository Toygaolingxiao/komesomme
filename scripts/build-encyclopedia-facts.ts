/**
 * Build encyclopedia sources registry + per-brand claims, update article factStatus/sourceIds.
 *
 * Usage: node --import tsx scripts/build-encyclopedia-facts.ts
 *
 * Rules:
 * - Never invent URLs; only curated official / quasi-official pages below (spot-checked).
 * - Every article gets ≥1 registry source (MAFF always; pref/brand when confirmed).
 * - Hard award claims without a matching source stay softened / tradition / removed.
 */

import { createHash } from "node:crypto";
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { riceProfiles } from "../src/data/rice/catalog";
import { isTokuA } from "../src/data/rice/tokuA";
import type {
  EncyclopediaClaim,
  EncyclopediaEditorialSource,
  EncyclopediaFactStatus,
  RiceEncyclopediaArticle,
} from "../src/types/riceEncyclopedia";

const ROOT = process.cwd();
const ARTICLES_DIR = path.join(ROOT, "src/data/rice/encyclopedia/articles");
const SOURCES_DIR = path.join(ROOT, "src/data/rice/encyclopedia/sources");
const CLAIMS_DIR = path.join(ROOT, "src/data/rice/encyclopedia/claims");
const REGISTRY_PATH = path.join(SOURCES_DIR, "registry.json");
const ACCESSED = "2026-09-10";
const NOW = new Date().toISOString();

type SourceRow = EncyclopediaEditorialSource;

/** Shared + confirmed pref/brand portals only. Unverified .lg.jp paths are omitted. */
const SOURCES: SourceRow[] = [
  {
    id: "maff-kome",
    organization: "農林水産省",
    title: "米をめぐる事情・関連情報",
    url: "https://www.maff.go.jp/j/seisan/syoryu/kome/",
    accessed_on: ACCESSED,
    source_kind: "maff",
    notes: "全国共通の産地・流通文脈の入口。銘柄固有の断定には使わない。",
  },
  {
    id: "kokken-ranking",
    organization: "一般財団法人日本穀物検定協会",
    title: "米の食味ランキング（ランキング試験）",
    url: "https://www.kokken.or.jp/ranking_area.html",
    accessed_on: ACCESSED,
    source_kind: "kokken",
    notes: "特Aは産地品種・年次の評価。商品そのものの保証ではない。",
  },
  {
    id: "kokken-r7-pdf",
    organization: "一般財団法人日本穀物検定協会",
    title: "令和7年産米の食味ランキングについて（PDF）",
    url: "https://kokken.or.jp/data/R7_shokumi_next.pdf",
    accessed_on: ACCESSED,
    source_kind: "kokken",
  },
  {
    id: "naro-top",
    organization: "国立研究開発法人農業・食品産業技術総合研究機構",
    title: "農研機構",
    url: "https://www.naro.go.jp/",
    accessed_on: ACCESSED,
    source_kind: "naro",
    notes: "品種育成の公的機関トップ。個別品種ページは追記する。",
  },
  {
    id: "pref-hokkaido-kome",
    organization: "北海道米販売拡大委員会等",
    title: "北海道のお米｜品種",
    url: "https://www.hokkaido-kome.gr.jp/variety/",
    accessed_on: ACCESSED,
    source_kind: "brand_official",
  },
  {
    id: "pref-akita-akitamai",
    organization: "秋田県（秋田米ブランド）",
    title: "ごはんのふるさと秋田へ",
    url: "https://common3.pref.akita.lg.jp/akitamai/",
    accessed_on: ACCESSED,
    source_kind: "pref_gov",
  },
  {
    id: "brand-akitamai-hinsyu",
    organization: "秋田県（秋田米ブランド）",
    title: "秋田米｜品種について",
    url: "https://common3.pref.akita.lg.jp/akitamai/hinsyu/",
    accessed_on: ACCESSED,
    source_kind: "pref_gov",
  },
  {
    id: "pref-yamagata-tuyahime",
    organization: "山形「つや姫」「雪若丸」ブランド化戦略推進本部",
    title: "つや姫・雪若丸公式",
    url: "https://www.tuyahime.jp/",
    accessed_on: ACCESSED,
    source_kind: "brand_official",
  },
  {
    id: "pref-niigata-shinmai",
    organization: "新潟県",
    title: "シン新潟の米々",
    url: "https://shin-niigatamai.pref.niigata.lg.jp/",
    accessed_on: ACCESSED,
    source_kind: "pref_gov",
  },
  {
    id: "pref-miyagi-lineup",
    organization: "宮城米マーケティング推進機構（宮城県）",
    title: "宮城のお米ラインナップ",
    url: "https://foodkingdom.pref.miyagi.jp/miyagimai/lineup/index.html",
    accessed_on: ACCESSED,
    source_kind: "pref_gov",
  },
];

const PREF_TO_SOURCE: Record<string, string[]> = {
  北海道: ["pref-hokkaido-kome"],
  秋田県: ["pref-akita-akitamai", "brand-akitamai-hinsyu"],
  山形県: ["pref-yamagata-tuyahime"],
  新潟県: ["pref-niigata-shinmai"],
  宮城県: ["pref-miyagi-lineup"],
};

const BRAND_TO_SOURCE: Record<string, string[]> = {
  yumepirika: ["pref-hokkaido-kome"],
  nanatsuboshi: ["pref-hokkaido-kome"],
  fukkurinko: ["pref-hokkaido-kome"],
  oborozuki: ["pref-hokkaido-kome"],
  kitakurin: ["pref-hokkaido-kome"],
  kirara397: ["pref-hokkaido-kome"],
  "daichi-no-hoshi": ["pref-hokkaido-kome"],
  akitakomachi: ["brand-akitamai-hinsyu", "pref-akita-akitamai"],
  sakihokore: ["brand-akitamai-hinsyu", "pref-akita-akitamai"],
  menkoina: ["brand-akitamai-hinsyu"],
  yumeobako: ["brand-akitamai-hinsyu"],
  tsubuzoroi: ["brand-akitamai-hinsyu"],
  tsuyahime: ["pref-yamagata-tuyahime"],
  yukiwakamaru: ["pref-yamagata-tuyahime"],
  shinnosuke: ["pref-niigata-shinmai"],
  "koshihikari-uonuma": ["pref-niigata-shinmai"],
  "koshihikari-sado": ["pref-niigata-shinmai"],
  koshiibuki: ["pref-niigata-shinmai"],
  hitomebore: ["pref-miyagi-lineup"],
  sasanishiki: ["pref-miyagi-lineup"],
  "date-masayume": ["pref-miyagi-lineup"],
  kinnoibuki: ["pref-miyagi-lineup"],
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

function articleBlob(article: RiceEncyclopediaArticle): string {
  return [
    article.headline,
    article.origin,
    ...article.features.flatMap((r) => [r.title, r.body]),
    ...article.cookingTips.flatMap((r) => [r.title, r.body]),
    ...article.servingIdeas,
    article.purchaseNotes,
    article.caveats,
  ].join("\n");
}

function sourceIdsForBrand(brandId: string, prefecture: string): string[] {
  const ids = new Set<string>(["maff-kome", "naro-top"]);
  for (const id of PREF_TO_SOURCE[prefecture] ?? []) ids.add(id);
  for (const id of BRAND_TO_SOURCE[brandId] ?? []) ids.add(id);
  if (isTokuA(brandId)) {
    ids.add("kokken-ranking");
    ids.add("kokken-r7-pdf");
  }
  return [...ids].sort();
}

function buildClaims(
  article: RiceEncyclopediaArticle,
  prefecture: string,
  sourceIds: string[],
): EncyclopediaClaim[] {
  const blob = articleBlob(article);
  const claims: EncyclopediaClaim[] = [];
  const localSources = sourceIds.filter(
    (id) => !id.startsWith("kokken") || isTokuA(article.id),
  );

  const prefOk =
    prefecture === "全国" ||
    blob.includes(prefecture) ||
    (prefecture.endsWith("県") && blob.includes(prefecture.slice(0, -1))) ||
    (prefecture.endsWith("府") && blob.includes(prefecture.slice(0, -1)));

  claims.push({
    id: `${article.id}:prefecture`,
    field_path: "origin.prefecture",
    claim_text: `主産地（カタログ）は${prefecture}`,
    status: prefOk ? (prefecture === "全国" ? "partial" : "verified") : "partial",
    source_ids: localSources.filter((id) => id !== "kokken-ranking" && id !== "kokken-r7-pdf"),
    verified_at: NOW,
    notes:
      prefecture === "全国"
        ? "全国流通銘柄。産地は流通実態に依存。"
        : PREF_TO_SOURCE[prefecture]
          ? "catalog.prefecture と origin の対応。県／ブランド公式を入口とする。"
          : "catalog.prefecture と origin の対応。県固有ポータル未登録のため MAFF/NARO を入口とする。",
  });

  if (/小野小町|伝説|にちなんで|由来/.test(blob)) {
    claims.push({
      id: `${article.id}:naming`,
      field_path: "origin.naming",
      claim_text: "名称・由来に関する伝承または命名説明",
      status: "tradition",
      source_ids: [localSources[0] ?? "maff-kome"],
      notes: "伝承・ブランド命名は tradition。公式育成記録とは別扱い。",
    });
  }

  if (/育成|交配|系統|子孫/.test(article.origin)) {
    claims.push({
      id: `${article.id}:breeding`,
      field_path: "origin.breeding",
      claim_text: "育成・系統に関する記述",
      status: "partial",
      source_ids: [...new Set([...localSources, "naro-top"])],
      notes: "詳細親子は農研機構等の品種ページで追記予定。断定は避ける。",
      verified_at: NOW,
    });
  }

  if (/特A|食味ランキング/.test(blob)) {
    claims.push({
      id: `${article.id}:tokua`,
      field_path: "origin.tokuA",
      claim_text: isTokuA(article.id)
        ? "カタログ上、特A実績のある銘柄セットに含まれる（年次・産地で変動）"
        : "文中に食味ランキング言及（カタログ特Aセット外は断定しない）",
      status: isTokuA(article.id) ? "verified" : "removed",
      source_ids: isTokuA(article.id) ? ["kokken-ranking", "kokken-r7-pdf"] : [],
      verified_at: NOW,
      notes: "特Aは年次評価。永久称号ではない。",
    });
  }

  if (/献上/.test(blob)) {
    claims.push({
      id: `${article.id}:kenjo`,
      field_path: "origin.tribute",
      claim_text: "献上米に関する言及（産地紹介ベース・時期要確認）",
      status: "unverified",
      source_ids: [localSources.find((id) => id.startsWith("pref-") || id.startsWith("brand-")) ?? "maff-kome"],
      notes: "公式の献上記録URLが取れるまで verified にしない。文面は弱化済み。",
    });
  }

  claims.push({
    id: `${article.id}:editorial-scores`,
    field_path: "caveats.editorial",
    claim_text: "味わいスコアは編集評価であり公的測定ではない",
    status: "verified",
    source_ids: ["maff-kome"],
    verified_at: NOW,
    notes: "製品ポリシー。",
  });

  return claims;
}

function rollupFactStatus(claims: EncyclopediaClaim[]): EncyclopediaFactStatus {
  const hard = claims.filter((c) =>
    ["origin.prefecture", "origin.tokuA", "origin.tribute", "origin.breeding"].includes(
      c.field_path,
    ),
  );
  if (hard.some((c) => c.status === "unverified")) return "partial";
  const pref = claims.find((c) => c.field_path === "origin.prefecture");
  if (pref?.status === "verified" && !hard.some((c) => c.status === "partial")) {
    return "verified";
  }
  return "partial";
}

function main() {
  mkdirSync(SOURCES_DIR, { recursive: true });
  mkdirSync(CLAIMS_DIR, { recursive: true });

  const byId = new Map(SOURCES.map((s) => [s.id, s]));
  for (const s of SOURCES) {
    if (!s.url.startsWith("http")) throw new Error(`bad url ${s.id}`);
  }

  writeFileSync(
    REGISTRY_PATH,
    `${JSON.stringify({ accessed_on: ACCESSED, sources: SOURCES }, null, 2)}\n`,
    "utf8",
  );

  const catalogById = new Map(riceProfiles.map((r) => [r.id, r]));
  const files = readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".json"));
  let verified = 0;
  let partial = 0;

  for (const file of files) {
    const id = file.replace(/\.json$/, "");
    const articlePath = path.join(ARTICLES_DIR, file);
    const article = JSON.parse(readFileSync(articlePath, "utf8")) as RiceEncyclopediaArticle;
    const rice = catalogById.get(id);
    if (!rice) throw new Error(`catalog missing ${id}`);

    const sourceIds = sourceIdsForBrand(id, rice.prefecture);
    for (const sid of sourceIds) {
      if (!byId.has(sid)) throw new Error(`unknown source ${sid} for ${id}`);
    }

    const claims = buildClaims(article, rice.prefecture, sourceIds);
    const factStatus = rollupFactStatus(claims);
    if (factStatus === "verified") verified += 1;
    else partial += 1;

    writeFileSync(
      path.join(CLAIMS_DIR, `${id}.json`),
      `${JSON.stringify({ brand_id: id, updated_at: NOW, source_ids: sourceIds, claims }, null, 2)}\n`,
      "utf8",
    );

    article.sourceIds = sourceIds;
    article.factStatus = factStatus;
    article.contentHash = contentHash(article);
    writeFileSync(articlePath, `${JSON.stringify(article, null, 2)}\n`, "utf8");
  }

  console.log(
    JSON.stringify(
      {
        registry: SOURCES.length,
        articles: files.length,
        factStatus: { verified, partial },
        registryPath: REGISTRY_PATH,
      },
      null,
      2,
    ),
  );
}

main();
