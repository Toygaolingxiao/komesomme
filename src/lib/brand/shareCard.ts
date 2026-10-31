import { appetiteLine, shortTasteTags } from "@/components/matrix/shared";
import { GUIDE_ROLE } from "@/lib/brand/guideRole";
import type { RiceProfileV2 } from "@/types/rice";

/** Phone-portrait 3:4 share card (Xiaohongshu / Stories). */
export const SHARE_CARD_SIZE = { width: 1080, height: 1440 } as const;

/** Warm ink-wash hero pool (runtime JPEGs under public/share/ink/). */
export const SHARE_CARD_INK_ARTS = [
  "ink-rice-01.jpg",
  "ink-rice-02.jpg",
  "ink-rice-03.jpg",
  "ink-rice-04.jpg",
] as const;

export const SHARE_CARD_SLOGAN = "味わいの地図で選ぶ";

export type ShareCardStar = {
  id: string;
  display_x: number;
  display_y: number;
  region: string;
  region_color: string;
};

export type ShareCardScore = {
  label: string;
  value: number;
};

/** Words we never put on shareable creative (platform + product bans). */
const CARD_BANNED = [
  "最強",
  "圧倒的",
  "究極",
  "唯一無二",
  "爆発",
  "無敵",
  "最安",
  "必買",
  "絶対",
  "米ソムリエ",
  "コメソムリエ",
  "お米ソムリエ",
] as const;

export function scrubShareCopy(text: string): string {
  let next = text;
  for (const word of CARD_BANNED) {
    next = next.split(word).join("");
  }
  return next.replace(/\s+/g, " ").trim();
}

export function shareCardBlurb(rice: RiceProfileV2, maxLen = 96): string {
  const raw = scrubShareCopy(appetiteLine(rice) || rice.short_ || "");
  if (raw.length <= maxLen) return raw;
  return `${raw.slice(0, maxLen - 1)}…`;
}

export function shareCardTags(rice: RiceProfileV2): string[] {
  return shortTasteTags(rice)
    .map(scrubShareCopy)
    .filter(Boolean)
    .slice(0, 3);
}

export function shareCardPath(
  id: string,
  opts?: { /** Include styled QR (X / offline). Default omits QR for Xiaohongshu. */ qr?: boolean }
): string {
  const base = `/api/rice/share-card/${encodeURIComponent(id)}`;
  return opts?.qr ? `${base}?qr=1` : base;
}

export function libraryPath(id: string): string {
  return `/library/${encodeURIComponent(id)}`;
}

/** Safe caption for Web Share / clipboard (no hard sell, no price claims). */
export function shareCaption(rice: RiceProfileV2, pageUrl: string): string {
  const name = scrubShareCopy(rice.name);
  const pref = scrubShareCopy(rice.prefecture);
  return [
    `${name}（${pref}）— KomeSomme ${GUIDE_ROLE}`,
    scrubShareCopy(shareCardBlurb(rice, 72)),
    "味わいは編集の目安です",
    pageUrl,
  ].join("\n");
}

/** Radar essence as discrete 1–5 grain scores (not a radar chart). */
export function shareCardScores(rice: RiceProfileV2): ShareCardScore[] {
  const round = (n: number) => Math.max(1, Math.min(5, Math.round(n)));
  return [
    { label: "甘み", value: round(rice.sweetness) },
    { label: "粘り", value: round(rice.stickiness) },
    { label: "硬さ", value: round(rice.hardness) },
    { label: "冷めた時の旨み", value: round(rice.cold_rice_quality) },
  ];
}

function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

/** Stable pick from the ink-art pool so the same brand keeps the same card. */
export function shareCardInkArtFile(riceId: string): string {
  const idx = stableHash(riceId) % SHARE_CARD_INK_ARTS.length;
  return SHARE_CARD_INK_ARTS[idx]!;
}
