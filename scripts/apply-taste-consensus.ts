import { readFileSync, writeFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

/**
 * Apply curated taste consensus (maps + official traits) into RiceSource files.
 * Does not change recommendation formulas — only stored 1–5 scores and short_.
 */

type Scores = {
  sweetness: number;
  hardness: number;
  stickiness: number;
  short_?: string;
  reason?: string;
};

const root = process.cwd();
const overridesPath = join(root, "scripts/data/taste-consensus-overrides.json");
const payload = JSON.parse(readFileSync(overridesPath, "utf8")) as {
  overrides: Record<string, Scores>;
};

const sourceDir = join(root, "src/data/rice/sources");
const files = readdirSync(sourceDir).filter((name) => name.endsWith(".ts"));

function patchBlock(
  source: string,
  id: string,
  scores: Scores
): { source: string; found: boolean } {
  const marker = `id: "${id}"`;
  const start = source.indexOf(marker);
  if (start < 0) return { source, found: false };

  const nextObject = source.indexOf("\n  {\n", start + marker.length);
  const end = nextObject === -1 ? source.length : nextObject;
  let block = source.slice(start, end);

  block = block.replace(/sweetness:\s*\d+/, `sweetness: ${scores.sweetness}`);
  block = block.replace(/hardness:\s*\d+/, `hardness: ${scores.hardness}`);
  block = block.replace(/stickiness:\s*\d+/, `stickiness: ${scores.stickiness}`);
  if (scores.short_) {
    block = block.replace(/short_:\s*"(?:\\.|[^"\\])*"/, `short_: ${JSON.stringify(scores.short_)}`);
  }

  return {
    source: source.slice(0, start) + block + source.slice(end),
    found: true,
  };
}

const report: Array<{ id: string; file: string | null; ok: boolean }> = [];

for (const [id, scores] of Object.entries(payload.overrides)) {
  let applied = false;
  let fileHit: string | null = null;

  for (const file of files) {
    const path = join(sourceDir, file);
    const before = readFileSync(path, "utf8");
    const { source, found } = patchBlock(before, id, scores);
    if (!found) continue;
    writeFileSync(path, source);
    applied = true;
    fileHit = file;
    break;
  }

  report.push({ id, file: fileHit, ok: applied });
}

const missing = report.filter((row) => !row.ok);
const done = report.filter((row) => row.ok);

console.log(`Applied ${done.length} / ${report.length} overrides into sources/`);
if (missing.length > 0) {
  console.log("Not found in sources (may be overlay-only):");
  for (const row of missing) console.log(`  - ${row.id}`);
}

writeFileSync(
  join(root, "scripts/data/taste-consensus-apply-report.json"),
  JSON.stringify({ applied: done, missing }, null, 2)
);
