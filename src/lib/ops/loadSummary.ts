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
  const since = new Date(until.getTime() - rangeToMs(range));

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("access_events")
    .select("event, created_at, path, session_id, meta")
    .gte("created_at", since.toISOString())
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

  return aggregateAccessEvents(rows, range, { since, until, truncated });
}
