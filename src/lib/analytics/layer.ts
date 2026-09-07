export type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

/** dataLayer / gtag payload. `page_path` is always present for SPA GA4. */
export function analyticsLayerEntry(
  event: string,
  payload: AnalyticsPayload,
  pagePath: string
): Record<string, unknown> {
  const path =
    typeof payload.page_path === "string" && payload.page_path ? payload.page_path : pagePath;
  return {
    event,
    ...payload,
    page_path: path,
  };
}

export function gtagEventParams(
  event: string,
  payload: AnalyticsPayload,
  pagePath: string
): Record<string, unknown> {
  const entry = analyticsLayerEntry(event, payload, pagePath);
  if (event === "page_view") {
    return {
      page_path: entry.page_path,
      page_title: entry.page_title,
    };
  }
  return Object.fromEntries(Object.entries(entry).filter(([key]) => key !== "event"));
}
