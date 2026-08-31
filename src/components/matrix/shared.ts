import {
  amazonSearchUrl,
  rakutenFurusatoSearchUrl,
  wrapSatofullSearchUrl,
  yahooFurusatoSearchUrl,
  yahooShoppingSearchUrl,
} from "@/lib/affiliate";
import { wrapRakutenAffiliateUrl, rakutenSearchUrl } from "@/lib/rakuten/affiliate";
import { riceRakutenKeyword } from "@/lib/rakuten/keyword";
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

export function shopKeyword(rice: RiceProfileV2): string {
  return riceRakutenKeyword(rice);
}

export function furusatoKeyword(rice: RiceProfileV2): string {
  return rice.furusato_keywords?.[0]?.trim() || `${rice.prefecture} ${rice.name}`;
}

export function rakutenUrl(keyword: string): string {
  return wrapRakutenAffiliateUrl(rakutenSearchUrl(keyword));
}

export function amazonUrl(keyword: string): string {
  return amazonSearchUrl(keyword);
}

export function yahooShoppingUrl(keyword: string): string {
  return yahooShoppingSearchUrl(keyword);
}

export function rakutenFurusatoUrl(keyword: string): string {
  return rakutenFurusatoSearchUrl(keyword);
}

export function yahooFurusatoUrl(keyword: string): string {
  return yahooFurusatoSearchUrl(keyword);
}

export function furusatoUrl(keyword: string): string {
  return wrapSatofullSearchUrl(keyword);
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

  const grain =
    rice.hardness >= 4 ? "しっかりした粒感" : rice.hardness <= 2 ? "やわらかい口当たり" : "ほどよい粒感";
  const sweet =
    rice.sweetness >= 4 ? "ふくよかな甘み" : rice.sweetness <= 2 ? "すっきりした後味" : "穏やかな甘み";

  if (dish && saucy && rice.sauce_absorption >= 4) {
    candidates.push({
      weight: rice.sauce_absorption + 1,
      text: `${grain}と${sweet}が、${dish}や煮物の濃い旨みをふっくら受け止めます。`,
    });
  }
  if (dish && delicate && rice.clarity >= 4) {
    candidates.push({
      weight: rice.clarity,
      text: `${grain}と${sweet}が、${dish}の味をすっきり立てます。`,
    });
  }
  if (dish && rice.sweetness >= 4) {
    candidates.push({
      weight: rice.sweetness,
      text: `${grain}とふくよかな甘みが、${dish}にも白ごはんにも向きます。`,
    });
  }
  if (dish && rice.hardness >= 4) {
    candidates.push({
      weight: rice.hardness,
      text: `しっかりした粒感が、${dish}に食べごたえを添えます。`,
    });
  }
  if (dish && rice.hardness <= 2) {
    candidates.push({
      weight: 6 - rice.hardness,
      text: `やわらかくほどける口当たりが、${dish}に寄り添います。`,
    });
  }
  if (dish && rice.cold_rice_quality >= 4) {
    candidates.push({
      weight: rice.cold_rice_quality,
      text: `${grain}が冷めても続き、${dish}や弁当の日に向きます。`,
    });
  }
  if (dish && rice.stickiness >= 4) {
    candidates.push({
      weight: rice.stickiness,
      text: `もちっとまとまる粘りが、${dish}にも弁当にも向きます。`,
    });
  }
  if (dish && rice.sauce_absorption >= 4 && !saucy) {
    candidates.push({
      weight: rice.sauce_absorption,
      text: `${grain}が${dish}に寄り添い、煮汁やタレもよく含みます。`,
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

const DRINK_HINT = /ワイン|ビール|焼酎|日本酒|ハイボール|ウイスキー|茶|ラガー|エール|ピルスナー|IPA|純米|吟醸|本醸造|熱燗|冷酒|ぬる燗|玉露|番茶/;
const FOODISH =
  /唐揚|餃子|おにぎり|ハンバーグ|カルパッチョ|枝豆|天ぷら|寿司|丼|炒|焼肉|鍋|串揚|焼き鳥|和惣菜/;

export function parseDrinkItem(item: string): { style: string; dish?: string } {
  const match = item.match(/^(.+?)と(.+)$/);
  if (match && DRINK_HINT.test(match[1]) && match[2].trim().length >= 2) {
    return { style: match[1].trim(), dish: match[2].trim() };
  }
  return { style: item };
}

export function isDrinkStyle(item: string): boolean {
  return DRINK_HINT.test(item) && !FOODISH.test(item);
}

/** Drink names only. Food leftovers in beer/tea fields are dropped. */
export function drinkStyleLabels(items: string[]): string[] {
  return Array.from(
    new Set(
      items
        .map((item) => parseDrinkItem(item).style.trim())
        .filter((style) => style.length >= 2 && isDrinkStyle(style))
    )
  );
}

export { TASTE_DISCLAIMER_DETAIL as DISCLAIMER } from "@/lib/affiliate";

export function coreTasteMetrics(rice: RiceProfileV2): Array<[string, number]> {
  return [
    ["粒感", rice.hardness],
    ["甘み", rice.sweetness],
    ["旨み", rice.umami],
    ["粘り", rice.stickiness],
    ["冷めても", rice.cold_rice_quality],
  ];
}

export function extraTasteMetrics(rice: RiceProfileV2): Array<[string, number]> {
  return [
    ["香り", rice.aroma],
    ["余韻", rice.aftertaste],
    ["コク", rice.richness],
    ["タレ相性", rice.sauce_absorption],
    ["油相性", rice.oil_compatibility],
    ["淡麗さ", rice.clarity],
    ["粒の大きさ", rice.grain_size],
  ];
}

export function forYouLines(rice: RiceProfileV2): string[] {
  const lines: string[] = [];
  if (rice.sauce_absorption >= 4) lines.push("煮物やタレ料理に合う米を探している");
  if (rice.hardness >= 4) lines.push("粒立ちのある食べごたえがほしい");
  else if (rice.hardness <= 2) lines.push("やわらかく、口当たりのやさしい米が好き");
  if (rice.sweetness >= 4) lines.push("ふくよかな甘みの米が好き");
  else if (rice.sweetness >= 3 && rice.hardness >= 2.5 && rice.hardness <= 3.5) {
    lines.push("ほどよい甘みと粒感が好き");
  }
  if (rice.cold_rice_quality >= 4) lines.push("弁当やおにぎりにも使いやすい米がほしい");
  if (rice.clarity >= 4 && lines.length < 3) lines.push("和食の輪郭を立てたい");
  if (lines.length < 3) lines.push("毎日の食卓にも使いやすい米がほしい");
  return Array.from(new Set(lines)).slice(0, 3);
}

/** Short “who / which day” line for comparing nearby brands. */
export function suitabilityLine(rice: RiceProfileV2): string {
  if (rice.sauce_absorption >= 4 && rice.hardness >= 3.4) return "煮物や肉料理に";
  if (rice.hardness >= 4) return "丼もの・定食向き";
  if (rice.hardness <= 2.2) return "軽く食べたい日に";
  if (rice.cold_rice_quality >= 4) return "弁当の日に";
  if (rice.sweetness >= 4) return "白ごはんで味わいたい日に";
  if (rice.clarity >= 4) return "和食を引き立てたい日に";
  const dish = rice.best_match_dishes.find(Boolean);
  return dish ? `${dish}の日に` : "日常の食卓に";
}

export type ContourAxis = { label: string; value: number };

export function contourAxes(rice: RiceProfileV2): ContourAxis[] {
  const fallback = (value: number | undefined, alt: number) =>
    typeof value === "number" && Number.isFinite(value) && value > 0 ? value : alt;

  return [
    { label: "甘み", value: fallback(rice.sweetness, 3) },
    { label: "粒感", value: fallback(rice.hardness, 3) },
    { label: "粘り", value: fallback(rice.stickiness, 3) },
    { label: "旨み", value: fallback(rice.umami, 3) },
    { label: "香り", value: fallback(rice.aroma, rice.aftertaste) },
    { label: "冷めても", value: fallback(rice.cold_rice_quality, rice.stickiness) },
  ];
}

export function contourSummary(rice: RiceProfileV2): string {
  const ranked = [...contourAxes(rice)].sort((a, b) => b.value - a.value);
  const top = ranked[0];
  const second = ranked[1];
  if (!top) return "味わいの輪郭は、品鑑の目安です。";
  if (top.label === "冷めても" || second?.label === "冷めても") {
    return `${top.label}と${second?.label ?? "粒感"}の傾向があり、弁当や煮物にも合わせやすい味わいです。`;
  }
  if (top.label === "旨み" || rice.sauce_absorption >= 4) {
    return `${top.label}と${second?.label ?? "甘み"}が立ち、煮物やタレ料理に寄せやすい味わいです。`;
  }
  return `${top.label}と${second?.label ?? "粒感"}が際立ち、日々の食卓に合わせやすい味わいです。`;
}

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
