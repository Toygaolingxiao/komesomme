import { recordAccess } from "@/lib/analytics/accessClient";
import { readLandingAttribution } from "@/lib/analytics/attribution";
import { analyticsLayerEntry, gtagEventParams } from "@/lib/analytics/layer";
import { isOpsPath } from "@/lib/ops/paths";

export type AnalyticsEvent =
  | "page_view"
  | "map_marker_click"
  | "slider_change"
  | "recommendation_detail_click"
  | "purchase_cta_click"
  | "rakuten_click"
  | "amazon_click"
  | "yahoo_click"
  | "mercari_click"
  | "furusato_click"
  | "rakuten_furusato_click"
  | "yahoo_furusato_click"
  | "satofull_click"
  | "shop_disclosure_toggle"
  | "shop_mode_toggle"
  | "language_search_submit"
  | "suggestion_chip_click"
  | "similar_rice_click"
  | "detail_scroll_50"
  | "detail_scroll_90"
  | "share_card_native"
  | "share_card_download"
  | "share_card_copy_link"
  | "editorial_bowl_click"
  | "editorial_collection_open"
  | "editorial_discover_open"
  | "editorial_discover_dismiss";

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
    gtag?: (...args: unknown[]) => void;
  }
}

/**
 * Lightweight event bus.
 * - Pushes to dataLayer for GTM/GA4 when present
 * - Mirrors custom events to gtag.js when NEXT_PUBLIC_GA_MEASUREMENT_ID is set
 * - Mirrors to Supabase access_events via /api/analytics/event
 * Never blocks UI.
 */
export function track(event: AnalyticsEvent, payload: AnalyticsPayload = {}) {
  if (typeof window === "undefined") return;
  if (isOpsPath(window.location.pathname)) return;

  // Slider input fires many times per drag — skip GTM and access log.
  if (event === "slider_change") {
    if (process.env.NODE_ENV !== "production") {
      console.debug("[km]", event, payload);
    }
    return;
  }

  const pagePath = window.location.pathname;
  // dataLayer / access log only. gtag page_view stays path + title so GA4
  // keeps document.location (and the utm_* on it) as page_location.
  const attribution = readLandingAttribution();
  const entry = {
    ...analyticsLayerEntry(event, payload, pagePath),
    ...attribution,
    ts: Date.now(),
  };
  window.dataLayer = window.dataLayer ?? [];
  window.dataLayer.push(entry);

  if (typeof window.gtag === "function") {
    const params = gtagEventParams(
      event,
      event === "page_view" ? { ...payload, page_title: document.title } : payload,
      pagePath
    );
    window.gtag("event", event, params);
  }

  // page_view is recorded by AnalyticsProvider.
  if (event !== "page_view") {
    recordAccess(event, payload);
  }

  if (process.env.NODE_ENV !== "production") {
    console.debug("[km]", event, payload);
  }
}
