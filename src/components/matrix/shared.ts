import { RICE_REGIONS, regionColor as colorForRegion } from "@/lib/rice/regions";
import type { RiceProfileV2, RiceRegion } from "@/types/rice";

/** Percent inset so 1 and 5 sit near the frame without clipping the dots. */
export const INSET = 4;
export const BAND = 100 - INSET * 2;

/**
 * Pole copy. Orientation is left=淡 / right=甘, bottom=硬 / top=軟.
 * Wording is KomeSomme's own, not a copy of other tasting maps.
 */
export const AXIS_POLES = {
  sweetLow: "すっきり軽い",
  sweetHigh: "甘みふくよか",
  firm: "粒立ち、しっかり",
  soft: "やわらか、ほどける",
  sweetLowShort: "すっきり",
  sweetHighShort: "甘み",
  firmShort: "粒立ち",
  softShort: "ほどける",
} as const;

export const TAG_TONES = [
  { bg: "#fff5e5", border: "#e29a35", text: "#704522" },
  { bg: "#fdece8", border: "#e56b3f", text: "#7a2e18" },
  { bg: "#eef6e8", border: "#7ca83b", text: "#3f5a1c" },
  { bg: "#f8e8ee", border: "#c85a72", text: "#6b2a3a" },
  { bg: "#e8f3f5", border: "#3f8fa3", text: "#245a68" },
] as const;

export type MapDensity = "full" | "sparse" | "focus";

export const MATCH_LIMIT = 4;
export const NEIGHBOUR_LIMIT = 3;
export const PREVIEW_MATCH_LIMIT = 8;

export const ICON_WEIGHT = "bold" as const;
export const ACCENT = "#e56b3f";

export const LAYER = {
  grid: 0,
  node: 10,
  probe: 20,
  bestNode: 30,
  selected: 34,
  fullscreen: 36,
  overlay: 40,
} as const;

export const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--km-accent)]";

export const REGION_STYLES: Array<{ region: RiceRegion; color: string }> =
  RICE_REGIONS.map(({ name, color }) => ({ region: name, color }));

export function regionColor(region: RiceRegion | string): string {
  return colorForRegion(region);
}

/** A rail entry. Coordinate and semantic paths produce different scores but render alike. */
export type RailMatch = {
  rice: RiceProfileV2;
  score: number;
  reason: string;
};

export function rakutenUrl(keyword: string): string {
  return `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(keyword)}/`;
}

export function amazonUrl(keyword: string): string {
  return `https://www.amazon.co.jp/s?k=${encodeURIComponent(keyword)}`;
}

export function furusatoUrl(keyword: string): string {
  return `https://www.satofull.jp/products/list.php?q=${encodeURIComponent(keyword)}`;
}

export function shortTasteTags(rice: RiceProfileV2): string[] {
  const tags = [rice.texture_label, rice.sweetness_label];
  if (rice.cold_rice_quality >= 4) tags.push("冷めても美味しい");
  return Array.from(new Set(tags.filter(Boolean))).slice(0, 3);
}

export function pairTasteTags(rice: RiceProfileV2): string[] {
  return [rice.texture_label, rice.sweetness_label].filter(Boolean).slice(0, 2);
}

export function dishTags(rice: RiceProfileV2): string[] {
  return [...rice.best_match_dishes, ...rice.good_with].filter(Boolean).slice(0, 4);
}

export function firstSentence(text: string): string {
  const trimmed = text.trim();
  if (!trimmed) return "";
  const first = trimmed.split("。").filter(Boolean)[0];
  return first ? `${first}。` : trimmed;
}

/** One tasting sentence from existing editorial fields. Does not invent facts. */
export function tastingSentence(rice: RiceProfileV2, reason?: string): string {
  const fromReason = reason?.trim();
  if (fromReason) return fromReason;
  if (rice.short_?.trim()) return rice.short_.trim();
  if (rice.pairing_reason?.trim()) return rice.pairing_reason.trim();
  return rice.description.trim();
}

export function tastingSummary(rice: RiceProfileV2): string {
  if (rice.short_?.trim()) return rice.short_.trim();
  return firstSentence(rice.description) || rice.description;
}

const SAUCY_DISH = /煮|丼|タレ|カレー|角煮|豚|焼肉|すき焼き|麻婆|治部/;
const DELICATE_DISH = /刺身|寿司|天ぷら|出汁|白身|繊細/;

/**
 * Appetite-first line from dishes + scores. Does not invent variety facts.
 */
export function appetiteLine(rice: RiceProfileV2): string {
  const dish = rice.best_match_dishes.find(Boolean)?.trim();
  const saucy = dish ? SAUCY_DISH.test(dish) : false;
  const delicate = dish ? DELICATE_DISH.test(dish) : false;
  const candidates: Array<{ weight: number; text: string }> = [];

  if (dish && saucy && rice.sauce_absorption >= 4) {
    candidates.push({
      weight: rice.sauce_absorption + 1,
      text: `${dish}の旨みをふっくら受け止める。日々の食卓に頼れる。`,
    });
  }
  if (dish && delicate && rice.clarity >= 4) {
    candidates.push({
      weight: rice.clarity,
      text: `${dish}の味を立てる、すっきり軽い口当たり。`,
    });
  }
  if (dish && rice.sweetness >= 4) {
    candidates.push({
      weight: rice.sweetness,
      text: `甘みがふくよか。${dish}にも、白ごはんにも向く。`,
    });
  }
  if (dish && rice.hardness >= 4) {
    candidates.push({
      weight: rice.hardness,
      text: `粒がしっかり立つ。${dish}に食べごたえを添える。`,
    });
  }
  if (dish && rice.hardness <= 2) {
    candidates.push({
      weight: 6 - rice.hardness,
      text: `やわらかくほどける。${dish}に寄り添う。`,
    });
  }
  if (dish && rice.cold_rice_quality >= 4) {
    candidates.push({
      weight: rice.cold_rice_quality,
      text: `冷めてもおいしい。${dish}や弁当の日向き。`,
    });
  }
  if (dish && rice.stickiness >= 4) {
    candidates.push({
      weight: rice.stickiness,
      text: `もちっとまとまる。${dish}にも弁当にも向く。`,
    });
  }
  if (dish && rice.sauce_absorption >= 4 && !saucy) {
    candidates.push({
      weight: rice.sauce_absorption,
      text: `${dish}に寄り添い、煮汁やタレもよく含む。`,
    });
  }

  const best = candidates.sort((a, b) => b.weight - a.weight)[0];
  if (best) return best.text;

  const note = firstSentence(rice.sommelier_note);
  if (note) return note;
  if (rice.pairing_reason.trim()) return rice.pairing_reason.trim();
  return tastingSummary(rice);
}

/** Technical follow-up. Variety facts stay in the source description. */
export function technicalLine(rice: RiceProfileV2): string {
  const line = firstSentence(rice.description);
  return line === appetiteLine(rice) ? "" : line;
}

export function todayServeLine(rice: RiceProfileV2): string {
  const dishes = rice.best_match_dishes.filter(Boolean).slice(0, 2);
  if (dishes.length >= 2) return `今日なら、${dishes[0]}や${dishes[1]}と。`;
  if (dishes.length === 1) return `今日なら、${dishes[0]}と。`;
  return "";
}

/**
 * Display-only remap of the 45-100 ranking score.
 * Ranking order is unchanged; 100 never appears so the scale reads as an estimate.
 */
export function affinityDisplay(score: number): number {
  if (score <= 0) return 0;
  const clamped = Math.max(45, Math.min(100, score));
  return Math.round(45 + ((clamped - 45) * 51) / 55);
}

export function affinityLabel(score: number): string {
  const shown = affinityDisplay(score);
  if (shown >= 95) return "とても近い";
  if (shown >= 88) return "近い";
  if (shown >= 80) return "やや近い";
  return "参考";
}

/** Three character lines from existing scores and dishes. Does not invent facts. */
export function riceCharacter(rice: RiceProfileV2): string[] {
  const traits: string[] = [];
  if (rice.sauce_absorption >= 4) traits.push("タレをよく受け止める");
  if (rice.cold_rice_quality >= 4) traits.push("冷めても食べやすい");
  if (rice.oil_compatibility >= 4) traits.push("揚げ物や油ものに合わせやすい");
  if (rice.hardness >= 4) traits.push("粒立ちがあり、丼ものに向く");
  if (rice.hardness <= 2) traits.push("やわらかく、口当たりがやさしい");
  if (rice.sweetness >= 4) traits.push("甘みがふくよか");
  if (rice.sweetness <= 2) traits.push("さっぱりとして料理を引き立てる");
  if (rice.clarity >= 4) traits.push("淡麗で、和食の輪郭を立てやすい");
  if (rice.stickiness >= 4) traits.push("粘りがあり、握りや弁当に向く");
  if (traits.length < 3 && rice.best_match_dishes[0]) {
    traits.push(`${rice.best_match_dishes[0]}に向く`);
  }
  return Array.from(new Set(traits)).slice(0, 3);
}

const DRINK_HINT = /ワイン|ビール|焼酎|日本酒|ハイボール|ウイスキー|茶/;

export function parseDrinkItem(item: string): { style: string; dish?: string } {
  const match = item.match(/^(.+?)と(.+)$/);
  if (match && DRINK_HINT.test(match[1]) && match[2].trim().length >= 2) {
    return { style: match[1].trim(), dish: match[2].trim() };
  }
  return { style: item };
}

export function isDrinkStyle(item: string): boolean {
  return DRINK_HINT.test(item) && !item.includes("と");
}

export const DISCLAIMER =
  "味わい評価はKomeSomme独自基準による目安です。公的な認定・等級を示すものではありません。";

/**
 * One contrast line vs the current recommendation, from existing scores only.
 */
export function contrastLine(base: RiceProfileV2, other: RiceProfileV2): string {
  const options: Array<{ abs: number; text: string }> = [];

  const add = (delta: number, high: string, low: string) => {
    if (Math.abs(delta) < 1) return;
    options.push({ abs: Math.abs(delta), text: delta > 0 ? high : low });
  };

  add(other.grain_size - base.grain_size, "より大粒で、食べごたえ寄り", "粒は控えめ、口当たり寄り");
  add(other.sweetness - base.sweetness, "甘みが少し強く、白ごはん向き", "甘みは控えめで、料理を引き立てやすい");
  add(other.hardness - base.hardness, "粒立ちが強く、丼ものに向く", "やわらかめで、口当たりがやさしい");
  add(other.cold_rice_quality - base.cold_rice_quality, "冷めても食べやすく、弁当にも向く", "");
  add(other.sauce_absorption - base.sauce_absorption, "タレ料理に寄せやすい", "");
  add(other.stickiness - base.stickiness, "粘りが強く、握り向き", "粘り控えめ、寿司向き");

  const best = options
    .filter((option) => option.text.length > 0)
    .sort((a, b) => b.abs - a.abs)[0];

  return best?.text ?? `${other.texture_label}・${other.sweetness_label}`;
}
