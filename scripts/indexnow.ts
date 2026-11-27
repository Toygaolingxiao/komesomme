/**
 * Submit komesomme.jp URLs to IndexNow (Bing and other participants).
 *
 * Not part of `next build`. Run after the key file is live on production:
 *
 *   npm run indexnow
 *   npm run indexnow -- --dry-run
 *   npm run indexnow -- https://komesomme.jp/library/yumepirika
 *
 * With no URL arguments, URLs come from https://komesomme.jp/sitemap.xml.
 * The key is the committed `public/<key>.txt` (served at `/<key>.txt`).
 */
import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import {
  INDEXNOW_ENDPOINT,
  INDEXNOW_HOST,
  defaultSitemapUrl,
  filterHostUrls,
  indexNowBody,
  keyFromPublicFiles,
  parseSitemapLocs,
} from "../src/lib/seo/indexnow";

const URL_LIMIT = 10_000;

function readKey(): string {
  const dir = path.join(process.cwd(), "public");
  const files = readdirSync(dir)
    .filter((name) => name.endsWith(".txt"))
    .map((name) => ({
      name,
      body: readFileSync(path.join(dir, name), "utf8"),
    }));
  return keyFromPublicFiles(files);
}

async function loadUrls(explicit: string[]): Promise<string[]> {
  if (explicit.length > 0) return explicit;
  const sitemapUrl = defaultSitemapUrl();
  const response = await fetch(sitemapUrl, {
    signal: AbortSignal.timeout(20_000),
    headers: { "user-agent": "KomeSomme-IndexNow/1" },
  });
  if (!response.ok) {
    throw new Error(`Sitemap ${sitemapUrl} returned ${response.status}.`);
  }
  return parseSitemapLocs(await response.text());
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  if (args.includes("--help") || args.includes("-h")) {
    console.log(
      "Usage: npm run indexnow -- [--dry-run] [https://komesomme.jp/…]",
    );
    return;
  }

  const dryRun = args.includes("--dry-run");
  const unknown = args.filter((arg) => arg.startsWith("--") && arg !== "--dry-run");
  if (unknown.length > 0) {
    throw new Error(`Unknown option: ${unknown.join(", ")}`);
  }

  const explicit = args.filter((arg) => !arg.startsWith("--"));
  const key = readKey();
  const { ok, rejected } = filterHostUrls(await loadUrls(explicit));
  if (rejected.length > 0) {
    throw new Error(
      `Refusing URLs that are not https://${INDEXNOW_HOST}/…\n${rejected.join("\n")}`,
    );
  }
  if (ok.length > URL_LIMIT) {
    throw new Error(`IndexNow accepts at most ${URL_LIMIT} URLs per request (${ok.length}).`);
  }

  const body = indexNowBody(key, ok);
  console.log(
    `${dryRun ? "Dry run" : "Submitting"} ${body.urlList.length} URL(s) to ${INDEXNOW_ENDPOINT}`,
  );
  console.log(`keyLocation: ${body.keyLocation}`);

  if (dryRun) return;

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(20_000),
  });
  const text = (await response.text()).trim();
  console.log(`HTTP ${response.status}${text ? ` ${text}` : ""}`);
  if (response.status !== 200 && response.status !== 202) {
    throw new Error(
      `IndexNow rejected the request (${response.status}). The key file must already be live at ${body.keyLocation}.`,
    );
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(message);
  process.exitCode = 1;
});
