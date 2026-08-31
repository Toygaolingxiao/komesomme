import { notFound, redirect } from "next/navigation";
import { OpsDashboard } from "@/components/ops/OpsDashboard";
import { emptyOpsSummary } from "@/lib/ops/aggregate";
import { opsDashboardConfigured } from "@/lib/ops/auth";
import { loadOpsSummary } from "@/lib/ops/loadSummary";
import { hasValidOpsSession } from "@/lib/ops/session";

export const dynamic = "force-dynamic";

export default async function OpsPage() {
  if (!opsDashboardConfigured()) notFound();
  if (!(await hasValidOpsSession())) redirect("/ops/login");

  let summary;
  let loadError = false;
  try {
    summary = await loadOpsSummary("7d");
  } catch (cause) {
    console.error("ops page summary failed:", cause);
    summary = emptyOpsSummary("7d");
    loadError = true;
  }
  return <OpsDashboard initial={summary} loadError={loadError} />;
}
