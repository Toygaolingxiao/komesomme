import { createAdminClient } from "@/lib/supabase/admin";
import {
  aggregateAccessEvents,
  parseOpsRange,
  rangeToMs,
  type OpsEventRow,
  type OpsRange,
  type OpsSummary,
} from "@/lib/ops/aggregate";

/** Soft cap so a busy day cannot blow the serverless memory budget. */
export const OPS_MAX_ROWS = 15_000;

export async function loadOpsSummary(rangeRaw?: string | null): Promise<OpsSummary> {
  const range: OpsRange = parseOpsRange(rangeRaw);
  const until = new Date();
  const windowMs = rangeToMs(range);
  const since = new Date(until.getTime() - windowMs);
  // Fetch two windows back so the dashboard can compare against the previous one.
  const since2 = new Date(until.getTime() - 2 * windowMs);

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("access_events")
    .select("event, created_at, path, session_id, meta")
    .gte("created_at", since2.toISOString())
    .lte("created_at", until.toISOString())
    .order("created_at", { ascending: false })
    .limit(OPS_MAX_ROWS);

  if (error) {
    throw new Error(error.message);
  }

  const rows = (data ?? []) as OpsEventRow[];
  const truncated = rows.length >= OPS_MAX_ROWS;
  // Chronological for day fill; aggregate does not require order but charts read byDay sorted.
  rows.reverse();

  const sinceMs = since.getTime();
  const currentRows = rows.filter((row) => new Date(row.created_at).getTime() >= sinceMs);
  const summary = aggregateAccessEvents(currentRows, range, { since, until, truncated });

  // The previous window is only comparable when the fetch was not truncated:
  // a capped fetch drops the oldest rows first, which are exactly that window.
  if (!truncated) {
    const previousRows = rows.filter((row) => new Date(row.created_at).getTime() < sinceMs);
    const previousSummary = aggregateAccessEvents(previousRows, range, {
      since: since2,
      until: since,
      truncated: false,
    });
    summary.previous = {
      sessions: previousSummary.kpis.sessions,
      pageViews: previousSummary.kpis.pageViews,
      purchaseClicks: previousSummary.kpis.purchaseClicks,
      consultSubmits: previousSummary.kpis.consultSubmits,
      shopOpens: previousSummary.kpis.shopOpens,
    };
  }

  return summary;
}
