import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";

/**
 * After `next build`, scan client assets so SUPABASE_SERVICE_ROLE_KEY never
 * lands in the browser bundle (P0-2d).
 */

const STATIC_DIR = join(process.cwd(), ".next", "static");
const SCAN_EXT = new Set([".js", ".css", ".json", ".html", ".txt"]);

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      out.push(...walk(full));
      continue;
    }
    const ext = name.slice(name.lastIndexOf(".")).toLowerCase();
    if (SCAN_EXT.has(ext)) out.push(full);
  }
  return out;
}

function main() {
  try {
    statSync(STATIC_DIR);
  } catch {
    console.error("assert-client-bundle: .next/static not found. Run `npm run build` first.");
    process.exit(1);
  }

  const needles: string[] = ["ci-service-placeholder"];
  const secret = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();
  if (secret && secret.length >= 8) needles.push(secret);

  const files = walk(STATIC_DIR);
  const hits: Array<{ file: string; needle: string }> = [];

  for (const file of files) {
    const body = readFileSync(file, "utf8");
    for (const needle of needles) {
      if (body.includes(needle)) {
        hits.push({ file, needle: needle.slice(0, 12) });
      }
    }
  }

  if (hits.length > 0) {
    console.error("assert-client-bundle: service role material found in client assets:");
    for (const hit of hits) {
      console.error(`  ${hit.file} (matched ${hit.needle}…)`);
    }
    process.exit(1);
  }

  console.log(`assert-client-bundle: ok (${files.length} files, ${needles.length} needles)`);
}

main();
