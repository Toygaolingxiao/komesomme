/**
 * Rewrites PREFECTURE_ART_IDS in prefectureArt.ts from files on disk.
 *   npx tsx scripts/sync-prefecture-art-ids.ts
 */
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const DIR = path.join(process.cwd(), "public", "brand-art", "prefectures");
const TARGET = path.join(process.cwd(), "src", "data", "editorial", "prefectureArt.ts");

async function main() {
  const files = await readdir(DIR);
  const ids = files
    .filter((f) => f.endsWith(".webp"))
    .map((f) => f.replace(/\.webp$/i, ""))
    .sort();
  const body = await readFile(TARGET, "utf8");
  const block = `export const PREFECTURE_ART_IDS = new Set<string>([\n${ids
    .map((id) => `  "${id}",`)
    .join("\n")}${ids.length ? "\n" : ""}]);`;
  const next = body.replace(
    /export const PREFECTURE_ART_IDS = new Set<string>\(\[[\s\S]*?\]\);/,
    block
  );
  if (next === body) {
    if (body.includes(block)) {
      console.log(`Already synced (${ids.length} ids).`);
      return;
    }
    console.error("Could not find PREFECTURE_ART_IDS block to replace.");
    process.exit(1);
  }
  await writeFile(TARGET, next, "utf8");
  console.log(`Synced ${ids.length} prefecture art ids: ${ids.join(", ") || "(none)"}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
