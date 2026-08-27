import type { RiceProfileV2, RiceSource } from "@/types/rice";
import {
  getQuadrant,
  getSweetnessLabel,
  getTextureLabel,
  normalizeTasteValue,
} from "./matrix";

/**
 * Derives the repetitive parts of a rice profile from its taste scores.
 *
 * Only brand-specific judgements are hand-authored in `src/data/rice/*`. Labels,
 * seasonal and drink pairings, mood, occasion, lifestyle scenes and search metadata
 * follow from the twelve taste values, which keeps ~90 brands consistent and
 * maintainable. Anything a rule gets wrong is fixed per brand via `overrides`.
 *
 * Wording stays inside the restrained vocabulary defined in docs/ui_design.md.
 */

type Rule = [active: boolean, value: string];

/** Keeps the first `max` matching values, falling back so no array is ever empty. */
function pick(rules: Rule[], fallback: string[], max = 3): string[] {
  const matched = rules.filter(([active]) => active).map(([, value]) => value);
  const values = matched.length > 0 ? matched : fallback;
  return Array.from(new Set(values)).slice(0, max);
}

function deriveSpring(r: RiceSource): string[] {
  return pick(
    [
      [r.clarity >= 4, "山菜の天ぷら"],
      [r.aroma >= 4, "桜えびの炊き込みご飯"],
      [r.hardness >= 4, "ちらし寿司"],
      [r.sweetness >= 4, "新玉ねぎの味噌汁"],
      [r.stickiness >= 4, "菜の花のおひたし"],
      [r.clarity >= 3, "鯛の刺身"],
    ],
    ["春野菜のおひたし"]
  );
}

function deriveSummer(r: RiceSource): string[] {
  return pick(
    [
      [r.cold_rice_quality >= 4, "冷やし茶漬け"],
      [r.clarity >= 4, "鮎の塩焼き"],
      [r.hardness >= 4, "冷やしうどんの供"],
      [r.aftertaste <= 3, "焼き茄子"],
      [r.sweetness >= 4, "枝豆ごはん"],
      [r.cold_rice_quality >= 3, "塩おにぎりと冷やしトマト"],
    ],
    ["夏野菜の揚げ浸し"]
  );
}

function deriveAutumn(r: RiceSource): string[] {
  return pick(
    [
      [r.umami >= 4, "きのこの炊き込みご飯"],
      [r.aroma >= 4, "秋刀魚の塩焼き"],
      [r.sweetness >= 4, "栗ごはん"],
      [r.richness >= 4, "里芋の煮物"],
      [r.grain_size >= 4, "さつまいもご飯"],
      [r.umami >= 3, "きのこのお吸い物"],
    ],
    ["根菜の煮物"]
  );
}

function deriveWinter(r: RiceSource): string[] {
  return pick(
    [
      [r.sauce_absorption >= 4, "すき焼き"],
      [r.richness >= 4, "ぶり大根"],
      [r.oil_compatibility >= 4, "鍋物の締め"],
      [r.clarity >= 4, "湯豆腐"],
      [r.umami >= 4, "牡蠣ごはん"],
      [r.stickiness >= 4, "おでん"],
    ],
    ["冬野菜の煮物"]
  );
}

function deriveBeer(r: RiceSource): string[] {
  return pick(
    [
      [r.oil_compatibility >= 4, "ラガー"],
      [r.hardness >= 4, "ピルスナー"],
      [r.richness >= 4, "黒ビール"],
      [r.clarity >= 4, "すっきりしたラガー"],
      [r.aftertaste <= 3, "エール"],
    ],
    ["ラガー"]
  );
}

function deriveWine(r: RiceSource): string[] {
  return pick(
    [
      [r.clarity >= 4, "辛口の白ワイン"],
      [r.richness >= 4, "フルボディの赤ワイン"],
      [r.aroma >= 4, "スパークリング"],
      [r.oil_compatibility >= 4, "ミディアムボディの赤ワイン"],
      [r.sweetness >= 4, "まろやかな白ワイン"],
      [r.umami >= 4, "ミディアムボディの赤ワイン"],
    ],
    ["軽やかな白ワイン"]
  );
}

function deriveTea(r: RiceSource): string[] {
  return pick(
    [
      [r.clarity >= 4, "煎茶"],
      [r.richness >= 4, "ほうじ茶"],
      [r.aroma >= 4, "玄米茶"],
      [r.sweetness >= 4, "玉露"],
      [r.aftertaste >= 4, "番茶"],
      [r.cold_rice_quality >= 4, "麦茶"],
    ],
    ["ほうじ茶"]
  );
}

function deriveMood(r: RiceSource): string[] {
  return pick(
    [
      [r.stickiness >= 4 && r.sweetness >= 4, "疲れた日にほっとしたい"],
      [r.clarity >= 4, "軽やかに食べたい"],
      [r.richness >= 4, "しっかり満たされたい"],
      [r.aroma >= 4, "香りを静かに楽しみたい"],
      [r.hardness >= 4, "気持ちを切り替えたい"],
      [r.umami >= 4, "味わいをじっくり感じたい"],
    ],
    ["いつもの調子で食べたい"]
  );
}

function deriveOccasion(r: RiceSource): string[] {
  return pick(
    [
      [r.cold_rice_quality >= 4, "お弁当"],
      [r.grain_size >= 4, "来客のもてなし"],
      [r.richness >= 4, "休日の夕食"],
      [r.clarity >= 4, "朝の食卓"],
      [r.sauce_absorption >= 4, "家族で囲む夕食"],
      [r.aroma >= 4, "祝いの席"],
    ],
    ["平日の夕食"]
  );
}

function deriveLifestyle(r: RiceSource): string[] {
  return pick(
    [
      [r.cold_rice_quality >= 4, "作り置きと弁当づくり"],
      [r.clarity >= 4, "在宅勤務の昼食"],
      [r.richness >= 4, "晩酌の締め"],
      [r.stickiness >= 4, "子どもと囲む食卓"],
      [r.hardness >= 4, "丼もので手早く済ませる日"],
      [r.aroma >= 4, "ひとりで静かに味わう夜"],
    ],
    ["毎日の食卓"]
  );
}

function deriveSemanticTags(
  r: RiceSource,
  labels: { quadrant: string; texture: string; sweetness: string }
): string[] {
  const tags = [
    labels.texture,
    labels.sweetness,
    r.region,
    r.prefecture,
    r.cold_rice_quality >= 4 ? "冷めても美味しい" : "",
    r.stickiness >= 4 ? "もっちり" : "",
    r.stickiness <= 2 ? "粘り控えめ" : "",
    r.clarity >= 4 ? "淡麗" : "",
    r.richness >= 4 ? "コクがある" : "",
    r.grain_size >= 4 ? "大粒" : "",
    r.oil_compatibility >= 4 ? "揚げ物に合う" : "",
    r.sauce_absorption >= 4 ? "タレによく合う" : "",
    r.aroma >= 4 ? "香り豊か" : "",
    r.umami >= 4 ? "旨みが強い" : "",
  ].filter(Boolean);

  return Array.from(new Set(tags));
}

function deriveSearchQueries(r: RiceSource, texture: string): string[] {
  const queries = [
    `${r.name} 特徴`,
    `${r.prefecture} の米 おすすめ`,
    `${texture}のお米`,
    r.cold_rice_quality >= 4 ? "冷めても美味しいお弁当用の米" : "",
    r.oil_compatibility >= 4 ? "揚げ物に合う米" : "",
    r.sauce_absorption >= 4 ? "丼ものに合う米" : "",
    r.clarity >= 4 ? "刺身に合う米" : "",
    r.stickiness >= 4 ? "もちもちしたご飯" : "",
    r.stickiness <= 2 ? "寿司のシャリに合う米" : "",
    r.richness >= 4 ? "しっかりした味の米" : "",
    r.whisky_pairings.length > 0 ? "ウイスキーと合わせたい米" : "",
  ].filter(Boolean);

  return Array.from(new Set(queries)).slice(0, 8);
}

export function deriveRiceProfile(source: RiceSource): RiceProfileV2 {
  const hardness = normalizeTasteValue(source.hardness);
  const sweetness = normalizeTasteValue(source.sweetness);

  const quadrant = getQuadrant(hardness, sweetness);
  const texture_label = getTextureLabel(hardness);
  const sweetness_label = getSweetnessLabel(sweetness);

  const profile: RiceProfileV2 = {
    id: source.id,
    name: source.name,
    prefecture: source.prefecture,
    region: source.region,

    sweetness,
    hardness,
    stickiness: normalizeTasteValue(source.stickiness),
    aroma: normalizeTasteValue(source.aroma),
    umami: normalizeTasteValue(source.umami),
    aftertaste: normalizeTasteValue(source.aftertaste),
    grain_size: normalizeTasteValue(source.grain_size),
    clarity: normalizeTasteValue(source.clarity),
    richness: normalizeTasteValue(source.richness),
    cold_rice_quality: normalizeTasteValue(source.cold_rice_quality),
    sauce_absorption: normalizeTasteValue(source.sauce_absorption),
    oil_compatibility: normalizeTasteValue(source.oil_compatibility),

    quadrant,
    texture_label,
    sweetness_label,

    best_match_dishes: source.best_match_dishes,
    good_with: source.good_with,
    avoid_pairings: source.avoid_pairings,

    spring_pairings: deriveSpring(source),
    summer_pairings: deriveSummer(source),
    autumn_pairings: deriveAutumn(source),
    winter_pairings: deriveWinter(source),

    sake_pairings: source.sake_pairings,
    beer_pairings: deriveBeer(source),
    wine_pairings: deriveWine(source),
    whisky_pairings: source.whisky_pairings,
    tea_pairings: deriveTea(source),

    mood_pairings: deriveMood(source),
    occasion_pairings: deriveOccasion(source),
    lifestyle_scenes: deriveLifestyle(source),

    short_: source.short_,
    description: source.description,
    sommelier_note: source.sommelier_note,
    pairing_reason: source.pairing_reason,

    semantic_tags: deriveSemanticTags(source, {
      quadrant,
      texture: texture_label,
      sweetness: sweetness_label,
    }),
    search_queries: deriveSearchQueries(source, texture_label),

    rakuten_search_keyword: source.rakuten_search_keyword,
    amazon_search_keyword:
      source.amazon_search_keyword ?? `${source.name} 白米 5kg`,
    furusato_keywords:
      source.furusato_keywords ?? [`${source.prefecture} ${source.name}`],

    data_source: source.data_source ?? "editorial",
    data_confidence: source.data_confidence ?? "medium",
  };

  return { ...profile, ...source.overrides };
}

export function deriveRiceProfiles(sources: RiceSource[]): RiceProfileV2[] {
  return sources.map(deriveRiceProfile);
}
