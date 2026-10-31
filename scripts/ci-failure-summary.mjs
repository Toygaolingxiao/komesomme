/**
 * CI helper: when the E2E step fails, name the failing tests in the
 * workflow run's Summary (GITHUB_STEP_SUMMARY) so the cause is visible on
 * the run page without downloading the Playwright artifact.
 *
 * Reads Playwright's JSON reporter output (test-results/e2e-results.json).
 * Exits 0 even when the file is missing or unreadable — this step must
 * never be the reason a job fails.
 */
import { appendFileSync, existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const resultsPath = join(process.cwd(), "test-results", "e2e-results.json");
const summaryPath = process.env.GITHUB_STEP_SUMMARY;

function emit(markdown) {
  if (summaryPath) {
    appendFileSync(summaryPath, markdown);
  } else {
    process.stdout.write(markdown);
  }
}

function collectFailures(node, file, out) {
  if (!node || typeof node !== "object") return;
  const currentFile = node.file ?? file;
  for (const spec of node.specs ?? []) {
    for (const test of spec.tests ?? []) {
      const results = test.results ?? [];
      const last = results[results.length - 1];
      const status = test.status ?? last?.status;
      if (status !== "unexpected") continue;
      const errors = (last?.errors ?? [])
        .map((e) => (typeof e?.message === "string" ? e.message : ""))
        .filter(Boolean);
      out.push({
        title: spec.title ?? "(untitled)",
        file: currentFile ?? spec.file ?? "",
        project: test.projectName ?? "",
        error: errors[0] ?? "",
      });
    }
  }
  for (const suite of node.suites ?? []) {
    collectFailures(suite, currentFile, out);
  }
}

try {
  if (!existsSync(resultsPath)) {
    emit("\n## E2E failures\n\nNo Playwright results file was produced.\n");
    process.exit(0);
  }
  const data = JSON.parse(readFileSync(resultsPath, "utf8"));
  const failures = [];
  for (const suite of data.suites ?? []) {
    collectFailures(suite, undefined, failures);
  }
  if (failures.length === 0) {
    emit(
      "\n## E2E failures\n\nThe job failed but no individual E2E test was marked failed — the failure is likely outside the tests (server start, install, or a worker crash).\n"
    );
    process.exit(0);
  }
  const lines = ["\n## E2E failures\n"];
  for (const failure of failures) {
    lines.push(
      `- **${failure.title}** — \`${failure.file}\`${failure.project ? ` (${failure.project})` : ""}`
    );
    if (failure.error) {
      const snippet = failure.error
        .replace(/\[[\d;]*m/g, "")
        .split("\n")
        .slice(0, 12)
        .join("\n");
      lines.push("", "```", snippet, "```", "");
    }
  }
  emit(lines.join("\n"));
} catch (error) {
  process.stdout.write(
    `ci-failure-summary: could not summarise results (${error instanceof Error ? error.message : String(error)})\n`
  );
}
process.exit(0);
