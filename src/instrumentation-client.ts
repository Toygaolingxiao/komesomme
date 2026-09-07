import * as Sentry from "@sentry/nextjs";
import { initSentry } from "@/lib/observability/sentryInit";

initSentry();

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
