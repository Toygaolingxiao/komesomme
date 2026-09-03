/**
 * Resize + convert public/brand-art PNGs (brands/regions/prefectures/…) to WebP.
 * Safe to re-run. Keeps ATTRIBUTION.md untouched.
 *
 *   npx tsx scripts/optimize-brand-art.ts
 */
import { readdir, unlink, stat } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.join(process.cwd(), "public", "brand-art");
/** Heroes / prefecture atlas plates — keep detail for retina. */
const MAX_EDGE = 1600;
const WEBP_QUALITY = 82;

async function walkPngs(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { withFileTypes: true });
  const out: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...(await walkPngs(full)));
      continue;
    }
    if (entry.isFile() && entry.name.toLowerCase().endsWith(".png")) {
      out.push(full);
    }
  }
  return out;
}

async function optimizeOne(pngPath: string): Promise<void> {
  const webpPath = pngPath.replace(/\.png$/i, ".webp");
  const before = (await stat(pngPath)).size;
  const image = sharp(pngPath);
  const meta = await image.metadata();
  const width = meta.width ?? 0;
  const height = meta.height ?? 0;
  const longEdge = Math.max(width, height);
  let pipeline = image.rotate();
  if (longEdge > MAX_EDGE) {
    pipeline =
      width >= height
        ? pipeline.resize({ width: MAX_EDGE, withoutEnlargement: true })
        : pipeline.resize({ height: MAX_EDGE, withoutEnlargement: true });
  }
  await pipeline.webp({ quality: WEBP_QUALITY, effort: 5 }).toFile(webpPath);
  const after = (await stat(webpPath)).size;
  await unlink(pngPath);
  const rel = path.relative(ROOT, webpPath);
  console.log(
    `${rel}: ${(before / 1024).toFixed(0)}KB → ${(after / 1024).toFixed(0)}KB`
  );
}

async function main() {
  const pngs = await walkPngs(ROOT);
  if (pngs.length === 0) {
    console.log("No PNGs under public/brand-art — nothing to do.");
    return;
  }
  for (const file of pngs) {
    await optimizeOne(file);
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
