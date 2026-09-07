import * as Sentry from "@sentry/nextjs";

/** DSN is public by design. Empty / unset disables the SDK (no events, no network). */
export function sentryDsn(): string | undefined {
  const dsn =
    process.env.NEXT_PUBLIC_SENTRY_DSN?.trim() || process.env.SENTRY_DSN?.trim() || "";
  return dsn || undefined;
}

export function initSentry(): void {
  const dsn = sentryDsn();
  Sentry.init({
    dsn,
    enabled: Boolean(dsn),
    sendDefaultPii: false,
    tracesSampleRate: 0,
    environment: process.env.VERCEL_ENV ?? process.env.NODE_ENV,
  });
}
