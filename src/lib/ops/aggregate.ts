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
  pageTypes: Array<{
    id: string;
    label: string;
    views: number;
    explore: number;
    shopOpens: number;
    purchaseClicks: number;
    consults: number;
    purchasePerView: number;
  }>;
  sources: Array<{ id: string; label: string; sessions: number; views: number }>;
  topBrands: Array<{ id: string; views: number; purchaseClicks: number }>;
  landingPages: Array<{ path: string; sessions: number }>;
  leaders: {
    pair: Array<{ slug: string; views: number; purchaseClicks: number }>;
    prefecture: Array<{ slug: string; views: number; purchaseClicks: number }>;
    compare: Array<{ slug: string; views: number; purchaseClicks: number }>;
    collection: Array<{ slug: string; views: number; purchaseClicks: number }>;
  };
  shares: {
    total: number;
    byKind: Array<{ id: string; label: string; count: number }>;
    topBrands: Array<{ id: string; count: number }>;
  };
  /** 米診断 funnel (distinct sessions per step) + purchases made from result pages. */
  diagnosis: {
    starts: number;
    completes: number;
    shares: number;
    purchaseClicks: number;
    completionRate: number;
    shareRate: number;
    note: string;
  };
  /** KPIs of the immediately preceding window of the same length. Filled by loadSummary. */
  previous?: {
    sessions: number;
    pageViews: number;
    purchaseClicks: number;
    consultSubmits: number;
    shopOpens: number;
  };
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
  "furusato_honpo_click",
  "furusato_labo_click",
]);

const RETAIL_CHANNEL_IDS = [
  "rakuten_click",
  "yahoo_click",
  "amazon_click",
  "mercari_click",
] as const;
const FURUSATO_CHANNEL_IDS = ["rakuten_furusato", "yahoo_furusato", "satofull", "furusato_honpo", "furusato_labo"] as const;

const CHANNEL_LABELS: Record<string, string> = {
  rakuten_click: "楽天市場",
  amazon_click: "Amazon",
  yahoo_click: "Yahoo!ショッピング",
  mercari_click: "メルカリ",
  satofull: "さとふる",
  rakuten_furusato: "楽天ふるさと",
  yahoo_furusato: "Yahoo!ふるさと",
  furusato_honpo: "ふるさと本舗",
  furusato_labo: "ふるラボ",
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

function metaString(meta: unknown, key: string): string {
  if (!meta || typeof meta !== "object") return "";
  const value = (meta as Record<string, unknown>)[key];
  return typeof value === "string" ? value.trim() : "";
}

/** Ratio change of a KPI against the previous window; null when there is no baseline. */
export function kpiDelta(current: number, previous: number): number | null {
  if (previous === 0) return null;
  return (current - previous) / previous;
}

const PAGE_TYPES: Array<{ id: string; label: string }> = [
  { id: "home", label: "首页・味わい地図" },
  { id: "discover", label: "ピックアップ" },
  { id: "library", label: "銘柄ライブラリ" },
  { id: "brand", label: "銘柄ページ" },
  { id: "pair", label: "料理で選ぶ" },
  { id: "compare", label: "銘柄くらべ" },
  { id: "prefecture", label: "産地から選ぶ" },
  { id: "collection", label: "特集" },
  { id: "diagnosis", label: "米診断" },
  { id: "other", label: "その他" },
];

function pageTypeId(path: string | null): string {
  const p = (path ?? "").trim();
  if (!p) return "other";
  if (p === "/") return "home";
  if (p === "/discover") return "discover";
  if (p === "/library") return "library";
  if (/^\/library\/[^/]+$/.test(p)) return "brand";
  if (p === "/pair" || p.startsWith("/pair/")) return "pair";
  if (p === "/compare" || p.startsWith("/compare/")) return "compare";
  if (p === "/prefectures" || p.startsWith("/prefectures/")) return "prefecture";
  if (p === "/collections" || p.startsWith("/collections/")) return "collection";
  if (p === "/shindan" || p.startsWith("/shindan/")) return "diagnosis";
  return "other";
}

function brandIdFromPath(path: string | null): string | null {
  const p = (path ?? "").trim();
  const match = /^\/library\/([^/]+)$/.exec(p);
  return match ? match[1] : null;
}

function isExploreEvent(event: string): boolean {
  return (
    event === "map_marker_click" ||
    event === "recommendation_detail_click" ||
    event === "similar_rice_click"
  );
}

function isShopOpen(row: OpsEventRow): boolean {
  return (
    row.event === "shop_disclosure_toggle" &&
    (row.meta as { open?: unknown } | null)?.open === true
  );
}

function referrerHost(referrer: string): string {
  try {
    return new URL(referrer).host;
  } catch {
    return referrer.replace(/^[a-z][a-z0-9+.-]*:\/\//i, "").split("/")[0] ?? "";
  }
}

/** First-touch source of a session, from its earliest page_view meta. */
function sessionSource(meta: unknown): { id: string; label: string } {
  const utm = metaString(meta, "utm_source");
  if (utm) return { id: utm, label: utm };
  const referrer = metaString(meta, "referrer");
  if (referrer) {
    const host = referrerHost(referrer);
    if (host) return { id: host, label: host };
  }
  return { id: "direct", label: "直接访问" };
}

const LEADER_PREFIXES = [
  { key: "pair", prefix: "/pair/" },
  { key: "prefecture", prefix: "/prefectures/" },
  { key: "compare", prefix: "/compare/" },
  { key: "collection", prefix: "/collections/" },
] as const;

type LeaderKey = (typeof LEADER_PREFIXES)[number]["key"];

function leaderSlug(path: string | null): { key: LeaderKey; slug: string } | null {
  const p = (path ?? "").trim();
  for (const { key, prefix } of LEADER_PREFIXES) {
    if (!p.startsWith(prefix)) continue;
    const slug = p.slice(prefix.length);
    if (!slug || slug.includes("/")) return null;
    return { key, slug };
  }
  return null;
}

const SHARE_KINDS = [
  { id: "share_card_download", label: "下载" },
  { id: "share_card_native", label: "系统分享" },
  { id: "share_card_copy_link", label: "复制链接" },
  { id: "share_fallback", label: "兜底" },
] as const;

const SHARE_EVENTS = new Set<string>(SHARE_KINDS.map((kind) => kind.id));

function purchaseChannel(row: OpsEventRow): string | null {
  if (!PURCHASE_EVENTS.has(row.event)) return null;
  if (row.event === "satofull_click") return "satofull";
  if (row.event === "rakuten_furusato_click") return "rakuten_furusato";
  if (row.event === "yahoo_furusato_click") return "yahoo_furusato";
  if (row.event === "furusato_honpo_click") return "furusato_honpo";
  if (row.event === "furusato_labo_click") return "furusato_labo";
  if (row.event !== "furusato_click") return row.event;
  const label = metaLabel(row.meta);
  if (label.includes("ふるさと本舗")) return "furusato_honpo";
  if (label.includes("ふるラボ")) return "furusato_labo";
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
  const shopOpens = countBy(rows, isShopOpen);
  const purchaseClicks = countBy(rows, (r) => PURCHASE_EVENTS.has(r.event));
  const explore = countBy(rows, (r) => isExploreEvent(r.event));

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

  // Per page-type funnel: same predicates as the global funnel, split by path class.
  const typeCounts = new Map<
    string,
    { views: number; explore: number; shopOpens: number; purchaseClicks: number; consults: number }
  >();
  for (const type of PAGE_TYPES) {
    typeCounts.set(type.id, { views: 0, explore: 0, shopOpens: 0, purchaseClicks: 0, consults: 0 });
  }
  for (const row of rows) {
    const bucket = typeCounts.get(pageTypeId(row.path));
    if (!bucket) continue;
    if (row.event === "page_view") bucket.views += 1;
    if (isExploreEvent(row.event)) bucket.explore += 1;
    if (isShopOpen(row)) bucket.shopOpens += 1;
    if (PURCHASE_EVENTS.has(row.event)) bucket.purchaseClicks += 1;
    if (row.event === "language_search_submit") bucket.consults += 1;
  }
  const pageTypes = PAGE_TYPES.map((type) => {
    const c = typeCounts.get(type.id) ?? {
      views: 0,
      explore: 0,
      shopOpens: 0,
      purchaseClicks: 0,
      consults: 0,
    };
    return { id: type.id, label: type.label, ...c, purchasePerView: ratio(c.purchaseClicks, c.views) };
  })
    .filter(
      (t) =>
        t.views > 0 || t.explore > 0 || t.shopOpens > 0 || t.purchaseClicks > 0 || t.consults > 0
    )
    .sort((a, b) => b.views - a.views);

  // First-touch sources: rows arrive chronological, so the first page_view of a
  // session carries that session's landing attribution.
  const sessionSourceById = new Map<string, { id: string; label: string }>();
  const sessionViews = new Map<string, number>();
  for (const row of rows) {
    if (row.event !== "page_view" || !row.session_id) continue;
    sessionViews.set(row.session_id, (sessionViews.get(row.session_id) ?? 0) + 1);
    if (!sessionSourceById.has(row.session_id)) {
      sessionSourceById.set(row.session_id, sessionSource(row.meta));
    }
  }
  const sourceCounts = new Map<string, { id: string; label: string; sessions: number; views: number }>();
  for (const [sessionId, source] of sessionSourceById) {
    const entry = sourceCounts.get(source.id) ?? { ...source, sessions: 0, views: 0 };
    entry.sessions += 1;
    entry.views += sessionViews.get(sessionId) ?? 0;
    sourceCounts.set(source.id, entry);
  }
  const sources = [...sourceCounts.values()]
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 8);

  // Brand pages: views and purchase clicks on /library/<id>.
  const brandCounts = new Map<string, { views: number; purchaseClicks: number }>();
  for (const row of rows) {
    const brandId = brandIdFromPath(row.path);
    if (!brandId) continue;
    if (row.event !== "page_view" && !PURCHASE_EVENTS.has(row.event)) continue;
    const entry = brandCounts.get(brandId) ?? { views: 0, purchaseClicks: 0 };
    if (row.event === "page_view") entry.views += 1;
    if (PURCHASE_EVENTS.has(row.event)) entry.purchaseClicks += 1;
    brandCounts.set(brandId, entry);
  }
  const topBrands = [...brandCounts.entries()]
    .map(([id, c]) => ({ id, views: c.views, purchaseClicks: c.purchaseClicks }))
    .sort((a, b) => b.purchaseClicks - a.purchaseClicks || b.views - a.views)
    .slice(0, 10);

  // Landing pages: the path of each session's earliest page_view.
  const sessionLanding = new Map<string, string>();
  for (const row of rows) {
    if (row.event !== "page_view" || !row.session_id) continue;
    if (!sessionLanding.has(row.session_id)) {
      sessionLanding.set(row.session_id, row.path?.trim() || "/");
    }
  }
  const landingCounts = new Map<string, number>();
  for (const path of sessionLanding.values()) {
    landingCounts.set(path, (landingCounts.get(path) ?? 0) + 1);
  }
  const landingPages = [...landingCounts.entries()]
    .map(([path, sessions]) => ({ path, sessions }))
    .sort((a, b) => b.sessions - a.sessions)
    .slice(0, 10);

  // Content leaders: per-slug views + purchase clicks for the four content types.
  const leaderCounts: Record<LeaderKey, Map<string, { views: number; purchaseClicks: number }>> = {
    pair: new Map(),
    prefecture: new Map(),
    compare: new Map(),
    collection: new Map(),
  };
  for (const row of rows) {
    if (row.event !== "page_view" && !PURCHASE_EVENTS.has(row.event)) continue;
    const hit = leaderSlug(row.path);
    if (!hit) continue;
    const map = leaderCounts[hit.key];
    const entry = map.get(hit.slug) ?? { views: 0, purchaseClicks: 0 };
    if (row.event === "page_view") entry.views += 1;
    if (PURCHASE_EVENTS.has(row.event)) entry.purchaseClicks += 1;
    map.set(hit.slug, entry);
  }
  const leaderRows = (map: Map<string, { views: number; purchaseClicks: number }>) =>
    [...map.entries()]
      .map(([slug, c]) => ({ slug, views: c.views, purchaseClicks: c.purchaseClicks }))
      .sort((a, b) => b.purchaseClicks - a.purchaseClicks || b.views - a.views)
      .slice(0, 6);
  const leaders = {
    pair: leaderRows(leaderCounts.pair),
    prefecture: leaderRows(leaderCounts.prefecture),
    compare: leaderRows(leaderCounts.compare),
    collection: leaderRows(leaderCounts.collection),
  };

  // Shares: share-card actions, split by kind, with the most-shared brands.
  const shareKindCounts = new Map<string, number>();
  const shareBrandCounts = new Map<string, number>();
  let shareTotal = 0;
  for (const row of rows) {
    if (!SHARE_EVENTS.has(row.event)) continue;
    shareTotal += 1;
    shareKindCounts.set(row.event, (shareKindCounts.get(row.event) ?? 0) + 1);
    const brandId = brandIdFromPath(row.path);
    if (brandId) shareBrandCounts.set(brandId, (shareBrandCounts.get(brandId) ?? 0) + 1);
  }
  const shares = {
    total: shareTotal,
    byKind: SHARE_KINDS.map((kind) => ({
      id: kind.id,
      label: kind.label,
      count: shareKindCounts.get(kind.id) ?? 0,
    })),
    topBrands: [...shareBrandCounts.entries()]
      .map(([id, count]) => ({ id, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5),
  };

  // Diagnosis funnel: distinct sessions per step, plus purchase clicks that
  // happened on result pages (the strip's own mall events carry the path).
  const diagnosisSessions = (
    predicate: (row: OpsEventRow) => boolean,
  ): number => {
    const seen = new Set<string>();
    for (const row of rows) {
      if (row.session_id && predicate(row)) seen.add(row.session_id);
    }
    return seen.size;
  };
  const diagnosisStarts = diagnosisSessions((r) => r.event === "diagnosis_start");
  const diagnosisCompletes = diagnosisSessions(
    (r) => r.event === "diagnosis_complete",
  );
  const diagnosisShares = diagnosisSessions(
    (r) =>
      r.event === "diagnosis_share_copy" || r.event === "diagnosis_share_native",
  );
  const diagnosisPurchaseClicks = countBy(
    rows,
    (r) =>
      PURCHASE_EVENTS.has(r.event) &&
      (r.path ?? "").trim().startsWith("/shindan/r/"),
  );
  const diagnosis = {
    starts: diagnosisStarts,
    completes: diagnosisCompletes,
    shares: diagnosisShares,
    purchaseClicks: diagnosisPurchaseClicks,
    completionRate: ratio(diagnosisCompletes, diagnosisStarts),
    shareRate: ratio(diagnosisShares, diagnosisCompletes),
    note: "完了率＝完了セッション÷開始セッション、共有率＝共有セッション÷完了セッション。購入率は参考値であり、診断の成否は完了率と共有率で見る。",
  };

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
    pageTypes,
    sources,
    topBrands,
    landingPages,
    leaders,
    shares,
    diagnosis,
  };
}
