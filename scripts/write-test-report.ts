/**
 * Merge Vitest + Playwright JSON into docs/test-results.md
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

type UnitFile = {
  numTotalTests?: number;
  numPassedTests?: number;
  numFailedTests?: number;
  success?: boolean;
  testResults?: Array<{
    name: string;
    status: string;
    assertionResults?: Array<{ fullName: string; status: string; title: string }>;
  }>;
};

type E2EFile = {
  suites?: unknown[];
  errors?: unknown[];
  stats?: {
    expected?: number;
    unexpected?: number;
    flaky?: number;
    skipped?: number;
    duration?: number;
  };
};

const root = process.cwd();
const unitPath = join(root, "test-results", "unit-results.json");
const e2ePath = join(root, "test-results", "e2e-results.json");
const outPath = join(root, "docs", "test-results.md");

function readJson<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function collectE2E(file: E2EFile | null) {
  if (!file) return { passed: 0, failed: 0, skipped: 0, rows: [] as string[] };
  const stats = file.stats ?? {};
  const passed = stats.expected ?? 0;
  const failed = stats.unexpected ?? 0;
  const skipped = stats.skipped ?? 0;
  return {
    passed,
    failed,
    skipped,
    rows: [
      `| Playwright E2E | ${passed} passed / ${failed} failed / ${skipped} skipped | ${(stats.duration ?? 0).toFixed(0)} ms |`,
    ],
  };
}

function collectUnit(file: UnitFile | null) {
  if (!file) return { passed: 0, failed: 0, rows: [] as string[] };
  const passed = file.numPassedTests ?? 0;
  const failed = file.numFailedTests ?? 0;
  const total = file.numTotalTests ?? passed + failed;
  return {
    passed,
    failed,
    rows: [`| Vitest unit | ${passed}/${total} passed | — |`],
  };
}

const unit = collectUnit(readJson<UnitFile>(unitPath));
const e2e = collectE2E(readJson<E2EFile>(e2ePath));
const ok = unit.failed === 0 && e2e.failed === 0 && (unit.passed > 0 || e2e.passed > 0);
const when = new Date().toISOString();

const md = `# 試験結果レポート

生成: **${when}** · 式样: [test-specification.md](./test-specification.md) · 製品: [\`VERSION\`](../VERSION)

## 総合判定

**${ok ? "PASS" : "FAIL / INCOMPLETE"}**

| スイート | 結果 | 備考 |
| --- | --- | --- |
${unit.rows.join("\n") || "| Vitest unit | (未実行) | \`test-results/unit-results.json\` なし |"}
${e2e.rows.join("\n") || "| Playwright E2E | (未実行) | \`test-results/e2e-results.json\` なし |"}

## メモ

- CI 既定: \`SEMANTIC_RECOMMEND_ENABLED=false\`（TS-CONSULT-01 劣化モード）
- Live 相談（TS-CONSULT-03）は本番スモーク手動
- HTML レポート: \`playwright-report/index.html\`（\`npx playwright show-report\`）

## トレーサビリティ

式样書の \`TS-*\` と e2e / unit ファイル名を対応。失敗時は Playwright trace / screenshot を \`test-results\` 配下で確認。
`;

mkdirSync(join(root, "docs"), { recursive: true });
writeFileSync(outPath, md, "utf8");
console.log(`Wrote ${outPath} (${ok ? "PASS" : "FAIL/INCOMPLETE"})`);
process.exit(ok ? 0 : 1);
