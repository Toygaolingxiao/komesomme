import * as Sentry from "@sentry/nextjs";
import { sentryDsn } from "@/lib/observability/sentryInit";

/**
 * Server-side exception report. No-ops without a DSN.
 * Never pass consultation text or other user input in `extras`.
 */
export function reportServerError(
  error: unknown,
  extras?: Record<string, string | number | boolean>
): void {
  const tag = extras?.kind ?? extras?.route ?? "server";
  console.error(tag, error);
  if (!sentryDsn()) return;
  Sentry.captureException(error, extras ? { extra: extras } : undefined);
}
