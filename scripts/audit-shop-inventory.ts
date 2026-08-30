/**
 * Inventory audit for purchase deep-links (official APIs only).
 *
 * - Rakuten: Ichiba Item Search → item | search
 * - Yahoo: Shopping ItemSearch → item | search
 * - Amazon / さとふる: search URLs only (no PA-API / product API in this repo yet)
 *
 * Writes a private JSON report (gitignored) plus a public-safe gaps markdown
 * (ids + resolution class only — no API item name/price/url payloads).
 *
 * Compliance: docs/13-affiliate-compliance.md — do not scrape mall HTML;
 * do not commit API product payloads into src/data or public catalog.
 *
 * Usage:
 *   npm run inventory:audit
 *   npm run inventory:audit -- --limit=10
 *   npm run inventory:audit -- --id=koshihikari
 */

import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { findRiceProfile, riceProfiles } from "@/data/rice/catalog";
import {
  amazonSearchUrl,
  furusatoQuery,
  shopQuery,
  satofullSearchUrl,
} from "@/lib/affiliate";
import { recommendYahooItem } from "@/lib/affiliate/yahoo";
import { isRakutenIchibaConfigured, recommendRakutenItem } from "@/lib/rakuten/ichiba";
import { riceRakutenKeyword } from "@/lib/rakuten/keyword";
import type { RiceProfileV2 } from "@/types/rice";

loadEnv({ path: ".env.local" });

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

type MallClass = "item" | "search" | "search_only_platform" | "error";

type BrandAudit = {
  id: string;
  name: string;
  prefecture: string;
  keyword: string;
  furusatoKeyword: string;
  rakuten: {
    class: MallClass;
    /** Present only in private JSON. */
    url?: string;
    itemName?: string;
    itemCode?: string;
    itemPrice?: number;
    error?: string;
  };
  yahoo: {
    class: MallClass;
    url?: string;
    error?: string;
  };
  amazon: { class: "search_only_platform"; searchUrl: string };
  satofull: { class: "search_only_platform"; searchUrl: string };
};

function keywordFor(rice: RiceProfileV2): string {
  return (
    riceRakutenKeyword(rice) ||
    shopQuery({ prefecture: rice.prefecture, brand: rice.name })
  );
}

function furusatoFor(rice: RiceProfileV2): string {
  return (
    rice.furusato_keywords?.[0]?.trim() ||
    furusatoQuery({ prefecture: rice.prefecture, brand: rice.name })
  );
}

async function auditOne(rice: RiceProfileV2): Promise<BrandAudit> {
  const keyword = keywordFor(rice);
  const furusatoKeyword = furusatoFor(rice);

  const row: BrandAudit = {
    id: rice.id,
    name: rice.name,
    prefecture: rice.prefecture,
    keyword,
    furusatoKeyword,
    rakuten: { class: "search" },
    yahoo: { class: "search" },
    amazon: {
      class: "search_only_platform",
      searchUrl: amazonSearchUrl(keyword),
    },
    satofull: {
      class: "search_only_platform",
      searchUrl: satofullSearchUrl(furusatoKeyword),
    },
  };

  try {
    const rakuten = await recommendRakutenItem({
      keyword,
      brandName: rice.name,
    });
    row.rakuten = {
      class: rakuten.source,
      url: rakuten.url,
      itemName: rakuten.itemName,
      itemCode: rakuten.itemCode,
      itemPrice: rakuten.itemPrice,
    };
  } catch (cause) {
    row.rakuten = {
      class: "error",
      error: cause instanceof Error ? cause.message : String(cause),
    };
  }

  try {
    const yahoo = await recommendYahooItem(keyword);
    row.yahoo = { class: yahoo.source, url: yahoo.url };
  } catch (cause) {
    row.yahoo = {
      class: "error",
      error: cause instanceof Error ? cause.message : String(cause),
    };
  }

  return row;
}

function summarize(rows: BrandAudit[]) {
  const rakutenItem = rows.filter((r) => r.rakuten.class === "item").length;
  const rakutenSearch = rows.filter((r) => r.rakuten.class === "search").length;
  const rakutenError = rows.filter((r) => r.rakuten.class === "error").length;
  const yahooItem = rows.filter((r) => r.yahoo.class === "item").length;
  const yahooSearch = rows.filter((r) => r.yahoo.class === "search").length;
  const yahooError = rows.filter((r) => r.yahoo.class === "error").length;
  const bothWeak = rows.filter(
    (r) => r.rakuten.class !== "item" && r.yahoo.class !== "item",
  );

  return {
    total: rows.length,
    rakutenConfigured: isRakutenIchibaConfigured(),
    rakuten: { item: rakutenItem, search: rakutenSearch, error: rakutenError },
    yahoo: { item: yahooItem, search: yahooSearch, error: yahooError },
    neitherItemHit: bothWeak.length,
    gapIds: bothWeak.map((r) => r.id),
  };
}

function gapsMarkdown(rows: BrandAudit[], generatedAt: string): string {
  const weak = rows.filter(
    (r) => r.rakuten.class !== "item" && r.yahoo.class !== "item",
  );
  const rakutenOnlySearch = rows.filter((r) => r.rakuten.class === "search");

  const lines = [
    "# 購入導線ギャップ（API 監査・公開セーフ）",
    "",
    `生成: ${generatedAt}`,
    "",
    "このファイルは **銘柄 id / 解決クラス / 検索キーワード** のみ。",
    "楽天・Yahoo API の商品名・価格・商品 URL は載せない（[13-affiliate-compliance.md](../../docs/13-affiliate-compliance.md)）。",
    "",
    "詳細（URL・item ペイロード）は gitignore の `scripts/data/shop-inventory/latest.json`。",
    "",
    "## サマリ",
    "",
    `| 指標 | 件数 |`,
    `| --- | ---: |`,
    `| 監査銘柄 | ${rows.length} |`,
    `| 楽天 item ヒット | ${rows.filter((r) => r.rakuten.class === "item").length} |`,
    `| 楽天 search のみ | ${rakutenOnlySearch.length} |`,
    `| Yahoo item ヒット | ${rows.filter((r) => r.yahoo.class === "item").length} |`,
    `| 楽天も Yahoo も item なし | ${weak.length} |`,
    `| Amazon / さとふる | 検索 URL のみ（PA-API 未接続） |`,
    "",
    "## 両モールとも item なし（優先してキーワード見直し）",
    "",
  ];

  if (weak.length === 0) {
    lines.push("_なし_", "");
  } else {
    lines.push("| id | 銘柄 | 県 | keyword | rakuten | yahoo |", "| --- | --- | --- | --- | --- | --- |");
    for (const r of weak) {
      lines.push(
        `| \`${r.id}\` | ${r.name} | ${r.prefecture} | ${r.keyword} | ${r.rakuten.class} | ${r.yahoo.class} |`,
      );
    }
    lines.push("");
  }

  lines.push(
    "## 運用",
    "",
    "```bash",
    "npm run inventory:audit",
    "```",
    "",
    "- 楽天・Yahoo は公式 API。Amazon / さとふる HTML のスクレイピングはしない。",
    "- ギャップ銘柄は `rakuten_search_keyword` / `amazon_search_keyword` / `furusato_keywords` を source で調整して再監査。",
    "- モール側に在庫が無い銘柄は、UI で検索フォールバックのままにするか、購入 CTA を弱める判断をする。",
    "",
  );

  return lines.join("\n");
}

async function main() {
  const args = process.argv.slice(2);
  const idFlag = args.find((arg) => arg.startsWith("--id="))?.slice(5);
  const limitFlag = args.find((arg) => arg.startsWith("--limit="))?.slice(8);
  const limit = limitFlag ? Number(limitFlag) : undefined;

  let targets = idFlag
    ? [findRiceProfile(idFlag)].filter((rice): rice is RiceProfileV2 => Boolean(rice))
    : [...riceProfiles];

  if (typeof limit === "number" && Number.isFinite(limit) && limit > 0) {
    targets = targets.slice(0, limit);
  }

  if (targets.length === 0) {
    console.error("No matching rice profiles.");
    process.exit(1);
  }

  console.error(
    `Auditing ${targets.length} brands (Rakuten configured: ${isRakutenIchibaConfigured()})…`,
  );

  const rows: BrandAudit[] = [];
  for (const [index, rice] of targets.entries()) {
    process.stderr.write(`  [${index + 1}/${targets.length}] ${rice.id}\n`);
    rows.push(await auditOne(rice));
    if (index < targets.length - 1) await sleep(1100);
  }

  const generatedAt = new Date().toISOString();
  const summary = summarize(rows);

  const privateDir = path.join(process.cwd(), "scripts/data/shop-inventory");
  mkdirSync(privateDir, { recursive: true });
  const privatePath = path.join(privateDir, "latest.json");
  writeFileSync(
    privatePath,
    JSON.stringify({ generatedAt, summary, brands: rows }, null, 2),
    "utf8",
  );

  const gapsPath = path.join(process.cwd(), "scripts/data/shop-inventory-gaps.md");
  writeFileSync(gapsPath, gapsMarkdown(rows, generatedAt), "utf8");

  console.error(`Wrote private report: ${privatePath}`);
  console.error(`Wrote public-safe gaps: ${gapsPath}`);
  console.log(JSON.stringify(summary, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
