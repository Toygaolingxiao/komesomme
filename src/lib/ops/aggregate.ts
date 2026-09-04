export type OpsRange = "1d" | "7d" | "30d";

export type OpsEventRow = {
  event: string;
  created_at: string;
  path: string | null;
  session_id: string | null;
  meta: unknown;
};

export type OpsSummary = {
  range: OpsRange;
  since: string;
  until: string;
  timezone: "Asia/Tokyo";
  rowCount: number;
  truncated: boolean;
  kpis: {
    sessions: number;
    pageViews: number;
    consultSubmits: number;
    shopOpens: number;
    purchaseClicks: number;
  };
  rates: {
    explorePerView: number;
    shopPerView: number;
    purchasePerView: number;
    consultPerView: number;
  };
  funnel: Array<{ id: string; label: string; count: number }>;
  byDay: Array<{ day: string; pageViews: number; purchaseClicks: number; consults: number }>;
  channels: Array<{ id: string; label: string; count: number }>;
  retailChannels: Array<{ id: string; label: string; count: number }>;
  furusatoChannels: Array<{ id: string; label: string; count: number }>;
  topPaths: Array<{ path: string; count: number }>;
  events: Array<{ event: string; count: number }>;
};

const PURCHASE_EVENTS = new Set([
  "purchase_cta_click",
  "rakuten_click",
  "amazon_click",
  "yahoo_click",
  "mercari_click",
  "furusato_click",
  "rakuten_furusato_click",
  "yahoo_furusato_click",
  "satofull_click",
]);

const RETAIL_CHANNEL_IDS = [
  "rakuten_click",
  "yahoo_click",
  "amazon_click",
  "mercari_click",
] as const;
const FURUSATO_CHANNEL_IDS = ["rakuten_furusato", "yahoo_furusato", "satofull"] as const;

const CHANNEL_LABELS: Record<string, string> = {
  rakuten_click: "楽天市場",
  amazon_click: "Amazon",
  yahoo_click: "Yahoo!ショッピング",
  mercari_click: "メルカリ",
  satofull: "さとふる",
  rakuten_furusato: "楽天ふるさと",
  yahoo_furusato: "Yahoo!ふるさと",
  furusato_other: "ふるさと（旧数据）",
  purchase_cta_click: "その他CTA",
};

const TOKYO = "Asia/Tokyo";

export function rangeToMs(range: OpsRange): number {
  if (range === "1d") return 24 * 60 * 60 * 1000;
  if (range === "30d") return 30 * 24 * 60 * 60 * 1000;
  return 7 * 24 * 60 * 60 * 1000;
}

export function parseOpsRange(raw: string | null | undefined): OpsRange {
  if (raw === "1d" || raw === "30d" || raw === "7d") return raw;
  return "7d";
}

export function emptyOpsSummary(range: OpsRange = "7d"): OpsSummary {
  const until = new Date();
  const since = new Date(until.getTime() - rangeToMs(range));
  return aggregateAccessEvents([], range, { since, until, truncated: false });
}

export function tokyoDayKey(isoOrDate: string | Date): string {
  const date = typeof isoOrDate === "string" ? new Date(isoOrDate) : isoOrDate;
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: TOKYO,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

function eachTokyoDay(since: Date, until: Date): string[] {
  const start = tokyoDayKey(since);
  const end = tokyoDayKey(until);
  if (!start || !end) return [];
  const days: string[] = [];
  let cursor = new Date(`${start}T12:00:00+09:00`);
  const last = new Date(`${end}T12:00:00+09:00`);
  for (let i = 0; i < 40 && cursor.getTime() <= last.getTime(); i += 1) {
    days.push(tokyoDayKey(cursor));
    cursor = new Date(cursor.getTime() + 24 * 60 * 60 * 1000);
  }
  return days;
}

function countBy(rows: OpsEventRow[], predicate: (row: OpsEventRow) => boolean): number {
  let n = 0;
  for (const row of rows) if (predicate(row)) n += 1;
  return n;
}

function ratio(numerator: number, denominator: number): number {
  return denominator > 0 ? numerator / denominator : 0;
}

function metaLabel(meta: unknown): string {
  if (!meta || typeof meta !== "object") return "";
  const label = (meta as { label?: unknown }).label;
  return typeof label === "string" ? label : "";
}

function purchaseChannel(row: OpsEventRow): string | null {
  if (!PURCHASE_EVENTS.has(row.event)) return null;
  if (row.event === "satofull_click") return "satofull";
  if (row.event === "rakuten_furusato_click") return "rakuten_furusato";
  if (row.event === "yahoo_furusato_click") return "yahoo_furusato";
  if (row.event !== "furusato_click") return row.event;
  const label = metaLabel(row.meta);
  if (label.includes("さとふる")) return "satofull";
  if (label.includes("楽天")) return "rakuten_furusato";
  if (/yahoo/i.test(label)) return "yahoo_furusato";
  return "furusato_other";
}

function channelRow(id: string, counts: Map<string, number>) {
  return { id, label: CHANNEL_LABELS[id] ?? id, count: counts.get(id) ?? 0 };
}

/**
 * Pure aggregation for the ops dashboard. Keep this free of I/O so unit tests stay fast.
 * Day buckets are Asia/Tokyo calendar dates (product audience + operator TZ).
 */
export function aggregateAccessEvents(
  rows: OpsEventRow[],
  range: OpsRange,
  options: { since: Date; until: Date; truncated: boolean }
): OpsSummary {
  const sessions = new Set<string>();
  for (const row of rows) {
    if (row.session_id) sessions.add(row.session_id);
  }

  const pageViews = countBy(rows, (r) => r.event === "page_view");
  const consultSubmits = countBy(rows, (r) => r.event === "language_search_submit");
  const shopOpens = countBy(
    rows,
    (r) => r.event === "shop_disclosure_toggle" && (r.meta as { open?: unknown } | null)?.open === true
  );
  const purchaseClicks = countBy(rows, (r) => PURCHASE_EVENTS.has(r.event));
  const explore = countBy(
    rows,
    (r) =>
      r.event === "map_marker_click" ||
      r.event === "recommendation_detail_click" ||
      r.event === "similar_rice_click"
  );

  const funnel = [
    { id: "page_view", label: "浏览", count: pageViews },
    { id: "explore", label: "探索", count: explore },
    { id: "shop_open", label: "展开店铺", count: shopOpens },
    { id: "purchase", label: "购入点击", count: purchaseClicks },
    { id: "consult", label: "咨询提交", count: consultSubmits },
  ];

  const dayMap = new Map<string, { pageViews: number; purchaseClicks: number; consults: number }>();
  for (const day of eachTokyoDay(options.since, options.until)) {
    dayMap.set(day, { pageViews: 0, purchaseClicks: 0, consults: 0 });
  }

  for (const row of rows) {
    const day = tokyoDayKey(row.created_at);
    if (!day) continue;
    const bucket = dayMap.get(day) ?? { pageViews: 0, purchaseClicks: 0, consults: 0 };
    if (row.event === "page_view") bucket.pageViews += 1;
    if (PURCHASE_EVENTS.has(row.event)) bucket.purchaseClicks += 1;
    if (row.event === "language_search_submit") bucket.consults += 1;
    dayMap.set(day, bucket);
  }

  const byDay = [...dayMap.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([day, v]) => ({ day, ...v }));

  const channelCounts = new Map<string, number>();
  for (const row of rows) {
    const id = purchaseChannel(row);
    if (!id) continue;
    channelCounts.set(id, (channelCounts.get(id) ?? 0) + 1);
  }
  const retailChannels = RETAIL_CHANNEL_IDS.map((id) => channelRow(id, channelCounts));
  const furusatoChannels = FURUSATO_CHANNEL_IDS.map((id) => channelRow(id, channelCounts));
  if ((channelCounts.get("furusato_other") ?? 0) > 0) {
    furusatoChannels.push(channelRow("furusato_other", channelCounts));
  }
  const extra = [...channelCounts.entries()]
    .filter(
      ([id]) =>
        !RETAIL_CHANNEL_IDS.includes(id as (typeof RETAIL_CHANNEL_IDS)[number]) &&
        !FURUSATO_CHANNEL_IDS.includes(id as (typeof FURUSATO_CHANNEL_IDS)[number]) &&
        id !== "furusato_other"
    )
    .map(([id]) => channelRow(id, channelCounts))
    .sort((a, b) => b.count - a.count);
  const channels = [...retailChannels, ...furusatoChannels, ...extra];

  const pathCounts = new Map<string, number>();
  for (const row of rows) {
    if (row.event !== "page_view") continue;
    const path = row.path?.trim() || "/";
    pathCounts.set(path, (pathCounts.get(path) ?? 0) + 1);
  }
  const topPaths = [...pathCounts.entries()]
    .map(([path, count]) => ({ path, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);

  const eventCounts = new Map<string, number>();
  for (const row of rows) {
    eventCounts.set(row.event, (eventCounts.get(row.event) ?? 0) + 1);
  }
  const events = [...eventCounts.entries()]
    .map(([event, count]) => ({ event, count }))
    .sort((a, b) => b.count - a.count);

  return {
    range,
    since: options.since.toISOString(),
    until: options.until.toISOString(),
    timezone: TOKYO,
    rowCount: rows.length,
    truncated: options.truncated,
    kpis: {
      sessions: sessions.size,
      pageViews,
      consultSubmits,
      shopOpens,
      purchaseClicks,
    },
    rates: {
      explorePerView: ratio(explore, pageViews),
      shopPerView: ratio(shopOpens, pageViews),
      purchasePerView: ratio(purchaseClicks, pageViews),
      consultPerView: ratio(consultSubmits, pageViews),
    },
    funnel,
    byDay,
    channels,
    retailChannels,
    furusatoChannels,
    topPaths,
    events,
  };
}
