import { recordAccess } from "@/lib/analytics/accessClient";

export type AnalyticsEvent =
  | "page_view"
  | "map_marker_click"
  | "slider_change"
  | "recommendation_detail_click"
  | "purchase_cta_click"
  | "rakuten_click"
  | "amazon_click"
  | "yahoo_click"
  | "furusato_click"
  | "shop_disclosure_toggle"
  | "shop_mode_toggle"
  | "language_search_submit"
  | "suggestion_chip_click"
  | "similar_rice_click"
  | "detail_scroll_50"
  | "detail_scroll_90";

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

/**
 * Lightweight event bus.
 * - Pushes to dataLayer for GTM/GA4 when present
 * - Mirrors to Supabase access_events via /api/analytics/event
 * Never blocks UI.
 */
export function track(event: AnalyticsEvent, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") return;

  const entry = { event, ...payload, ts: Date.now() };
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(entry);

  // Skip high-frequency slider noise; page_view is recorded by AnalyticsProvider.
  if (event !== "page_view" && event !== "slider_change") {
    recordAccess(event, payload);
  }

  if (process.env.NODE_ENV !== "production") {
    console.debug("[km]", event, payload);
  }
}
