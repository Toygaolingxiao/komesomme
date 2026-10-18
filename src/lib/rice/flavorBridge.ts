import type { RiceProfileV2 } from "@/types/rice";
import { nameMatch } from "./semanticScore";

/**
 * Flavor Bridge: explains why a rice suits the drink or dish the guest asked about.
 *
 * Deterministic rules for each match card. The spoken 2-sentence reply is generated
 * separately after ranking, and may only name those ranked brands.
 */

const PREFECTURE_STEMS = [
  "北海道",
  "青森",
  "岩手",
  "宮城",
  "秋田",
  "山形",
  "福島",
  "茨城",
  "栃木",
  "群馬",
  "埼玉",
  "千葉",
  "東京",
  "神奈川",
  "新潟",
  "富山",
  "石川",
  "福井",
  "山梨",
  "長野",
  "岐阜",
  "静岡",
  "愛知",
  "三重",
  "滋賀",
  "京都",
  "大阪",
  "兵庫",
  "奈良",
  "和歌山",
  "鳥取",
  "島根",
  "岡山",
  "広島",
  "山口",
  "徳島",
  "香川",
  "愛媛",
  "高知",
  "福岡",
  "佐賀",
  "長崎",
  "熊本",
  "大分",
  "宮崎",
  "鹿児島",
  "沖縄",
] as const;

function originStem(value: string) {
  let next = value.replace(/\s+/g, "");
  next = next.replace(/(の米|のお米|のお薦め|のおすすめ)$/g, "");

  // These names already end in 都 / 道 / 府, so they cannot use a generic suffix strip.
  if (next.startsWith("北海道")) return "北海道";
  if (next.startsWith("東京")) return "東京";
  if (next.startsWith("京都")) return "京都";
  if (next.startsWith("大阪")) return "大阪";

  return next.replace(/(県産|府産)$/g, "").replace(/産$/g, "").replace(/(府|県)$/g, "");
}

/** True when the consultation is naming this rice's prefecture. */
export function queryTargetsPrefecture(query: string, prefecture: string) {
  const detected = detectPrefectureStem(query);
  if (!detected) return false;
  return originStem(prefecture) === detected;
}

export function detectPrefectureStem(query: string): string | null {
  const compact = query.replace(/\s+/g, "");
  if (compact.length < 2) return null;

  const hits = PREFECTURE_STEMS.flatMap((stem) => {
    const index = compact.indexOf(stem);
    return index >= 0 ? [{ stem, index }] : [];
  }).sort((a, b) => a.index - b.index || b.stem.length - a.stem.length);

  const kept: Array<{ stem: string; index: number }> = [];
  for (const hit of hits) {
    const overlaps = kept.some((other) => {
      const start = hit.index;
      const end = hit.index + hit.stem.length;
      const otherStart = other.index;
      const otherEnd = other.index + other.stem.length;
      return start < otherEnd && otherStart < end;
    });
    if (!overlaps) kept.push(hit);
  }

  return kept[0]?.stem ?? null;
}

export type DrinkCategory =
  | "highball"
  | "smoky"
  | "sherry"
  | "bourbon"
  | "japanese-whisky"
  | "sake"
  | "beer"
  | "wine"
  | "tea";

const DRINK_KEYWORDS: Array<[DrinkCategory, string[]]> = [
  ["highball", ["ハイボール", "highball", "炭酸割り", "ソーダ割り"]],
  ["smoky", ["スモーキー", "ピート", "泥炭", "アイラ", "smoky", "煙"]],
  ["sherry", ["シェリー", "シェリー樽", "sherry"]],
  ["bourbon", ["バーボン", "bourbon", "アメリカンウイスキー"]],
  [
    "japanese-whisky",
    ["ジャパニーズウイスキー", "和製ウイスキー", "山崎", "白州", "余市"],
  ],
  ["sake", ["日本酒", "純米", "吟醸", "熱燗", "冷酒", "sake"]],
  ["beer", ["ビール", "beer", "生ビール", "エール", "ラガー"]],
  ["wine", ["ワイン", "wine", "シャンパン", "スパークリング"]],
  ["tea", ["お茶", "煎茶", "ほうじ茶", "玉露", "玄米茶", "番茶", "緑茶"]],
];

/** Generic whisky mentions fall back to the balanced Japanese-whisky bridge. */
const WHISKY_KEYWORDS = ["ウイスキー", "ウィスキー", "whisky", "whiskey"];

export function detectDrinkCategory(query: string): DrinkCategory | null {
  const normalized = query.toLowerCase();

  for (const [category, keywords] of DRINK_KEYWORDS) {
    if (keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))) {
      return category;
    }
  }

  if (WHISKY_KEYWORDS.some((keyword) => normalized.includes(keyword.toLowerCase()))) {
    return "japanese-whisky";
  }

  return null;
}

function bridgeForHighball(rice: RiceProfileV2): string {
  if (rice.hardness >= 4 && rice.clarity >= 3) {
    return "ハイボールのキレには、粒立ちがよく後味の軽いお米が合います。油を受け止めながらも口の中を重くせず、唐揚げや焼き鳥の香ばしさをきれいにつなぎます。";
  }
  if (rice.oil_compatibility >= 4) {
    return "揚げ物の油をしっかり受け止める粒感があり、炭酸のキレで後味を整えながら食べ進められます。";
  }
  return "やわらかな甘みが炭酸のキレをやさしく受け止め、味の落差を静かにならしてくれます。";
}

function bridgeForSmoky(rice: RiceProfileV2): string {
  if (rice.clarity >= 4 && rice.sweetness <= 3) {
    return "スモーキーな余韻には、甘みが強すぎない淡麗なお米が向きます。焼き魚の焦げ香とウイスキーの煙香を、お米のほのかな甘みが静かにつないでくれます。";
  }
  if (rice.aroma >= 4) {
    return "炊きたての香りが煙の余韻とゆるやかに重なり、焼きおにぎりや味噌焼きの香ばしさを引き立てます。";
  }
  return "落ち着いた甘みが煙の香りに押されず、焼き魚の塩気と穏やかに釣り合います。";
}

function bridgeForSherry(rice: RiceProfileV2): string {
  if (rice.sweetness >= 4 && rice.umami >= 4) {
    return "シェリー樽の甘い余韻には、ふくよかな甘みと旨みを備えたお米が寄り添います。すき焼きや角煮の濃い煮汁を受け止め、後味をまとめてくれます。";
  }
  if (rice.sauce_absorption >= 4) {
    return "照り焼きや角煮のタレをよく含み、樽由来の甘い香りと重なって満足感のある一膳になります。";
  }
  return "すっきりとした後味が樽香の甘さを引き締め、濃い味付けでも食べ疲れしにくくなります。";
}

function bridgeForBourbon(rice: RiceProfileV2): string {
  if (rice.grain_size >= 4 && rice.sweetness >= 4) {
    return "バーボンの甘い香りには、大粒でふくよかな甘みのあるお米が釣り合います。肉料理やハンバーグの旨みを受け止め、噛むほどに満足感が続きます。";
  }
  if (rice.oil_compatibility >= 4) {
    return "肉の脂を受け止める粒感があり、バーボンの甘みと香ばしさをまっすぐつなぎます。";
  }
  return "穏やかな甘みが香りの強さをやわらげ、BBQ や肉料理の輪郭を整えます。";
}

function bridgeForJapaneseWhisky(rice: RiceProfileV2): string {
  if (rice.aroma >= 4 && rice.clarity >= 3) {
    return "ジャパニーズウイスキーの香りには、香り立ちがよく均衡のとれたお米が合います。塩おにぎりや出汁料理と並べても、どちらの香りも損ないません。";
  }
  if (rice.umami >= 4) {
    return "出汁の旨みを含んだ和食に寄り添う味わいで、樽香とお米の甘みが静かに重なります。";
  }
  return "甘みと粒感の均衡がよく、和食の繊細な味わいと香りを穏やかにつなぎます。";
}

function bridgeForSake(rice: RiceProfileV2): string {
  if (rice.clarity >= 4) {
    return "日本酒の含み香を邪魔しない淡麗な味わいで、刺身や煮物の輪郭を静かに引き立てます。";
  }
  if (rice.umami >= 4) {
    return "旨みの厚みが純米の膨らみと重なり、晩酌の締めの一膳として落ち着きます。";
  }
  return "やわらかな甘みが酒の香りをやさしく受け止め、食卓を穏やかに整えます。";
}

function bridgeForBeer(rice: RiceProfileV2): string {
  if (rice.oil_compatibility >= 4) {
    return "揚げ物の油を受け止める粒感があり、ビールの苦みで後味を切り替えながら食べ進められます。";
  }
  if (rice.hardness >= 4) {
    return "しっかりした粒立ちが炒飯や餃子に負けず、泡のキレと軽やかに釣り合います。";
  }
  return "穏やかな甘みが苦みをやわらげ、和惣菜とビールの間をなめらかにつなぎます。";
}

function bridgeForWine(rice: RiceProfileV2): string {
  if (rice.richness >= 4) {
    return "コクのある味わいが赤ワインの渋みと釣り合い、肉料理やきのこのソテーとよく合います。";
  }
  if (rice.clarity >= 4) {
    return "澄んだ味わいが白ワインの酸と重なり、白身魚や野菜の前菜を軽やかにまとめます。";
  }
  return "ふくよかな甘みがワインの果実香と重なり、洋食の食卓にも自然に収まります。";
}

function bridgeForTea(rice: RiceProfileV2): string {
  if (rice.aftertaste >= 4) {
    return "余韻が長く、お茶の渋みと合わせても味わいが途切れません。お茶漬けや朝の一膳に向いています。";
  }
  if (rice.clarity >= 4) {
    return "淡麗な味わいが煎茶の香りを引き立て、口の中を軽やかに整えます。";
  }
  return "やわらかな甘みがお茶の渋みをやわらげ、静かな時間に寄り添います。";
}

const BRIDGES: Record<DrinkCategory, (rice: RiceProfileV2) => string> = {
  highball: bridgeForHighball,
  smoky: bridgeForSmoky,
  sherry: bridgeForSherry,
  bourbon: bridgeForBourbon,
  "japanese-whisky": bridgeForJapaneseWhisky,
  sake: bridgeForSake,
  beer: bridgeForBeer,
  wine: bridgeForWine,
  tea: bridgeForTea,
};

const SCENE_RULES: Array<[keywords: string[], build: (rice: RiceProfileV2) => string]> = [
  [
    ["弁当", "冷めても", "おにぎり", "作り置き"],
    (rice) =>
      rice.cold_rice_quality >= 4
        ? "冷めても甘みと食感が落ちにくく、お弁当やおにぎりにしても味わいが保たれます。"
        : "炊きたての甘みが穏やかで、時間をおいても重たく感じにくい味わいです。",
  ],
  [
    ["カレー", "丼", "牛丼", "親子丼", "中華"],
    (rice) =>
      rice.sauce_absorption >= 4 || rice.hardness >= 4
        ? "汁気を含んでも粒がへたりにくく、ルーやタレの輪郭を保ったまま食べ進められます。"
        : "やわらかな口当たりがタレとよくなじみ、全体をまとめてくれます。",
  ],
  [
    ["刺身", "寿司", "和食", "出汁", "焼き魚"],
    (rice) =>
      rice.clarity >= 4 || rice.stickiness <= 2
        ? "澄んだ味わいと控えめな粘りで、魚や出汁の繊細な風味を静かに引き立てます。"
        : "穏やかな甘みが魚の脂と釣り合い、和食の食卓を落ち着いた印象にまとめます。",
  ],
  [
    ["疲れ", "やさしい", "ほっと", "癒", "元気"],
    (rice) =>
      rice.stickiness >= 4 || rice.sweetness >= 4
        ? "もっちりとした食感とふくよかな甘みが、疲れた日の食卓に静かに寄り添います。"
        : "軽やかな口当たりで食べ疲れせず、気持ちを穏やかに整えてくれます。",
  ],
  [
    ["楽し", "嬉し", "お祝い", "記念", "ハッピー", "开心", "高兴"],
    (rice) =>
      rice.sweetness >= 4
        ? "ふくよかな甘みが、今日のよい気分を食卓でもう少し続けてくれます。"
        : "すっきりした後味で、今日のよい気分を重たくせずに締められます。",
  ],
  [
    ["秋", "きのこ", "栗", "松茸"],
    (rice) =>
      rice.umami >= 4
        ? "旨みの厚みがきのこや根菜の滋味と重なり、秋の炊き込みご飯に向いています。"
        : "穏やかな甘みが秋の食材の香りを邪魔せず、季節の味わいを引き立てます。",
  ],
  [
    ["すき焼き", "照り焼き", "角煮", "肉", "焼肉"],
    (rice) =>
      rice.richness >= 4 || rice.sauce_absorption >= 4
        ? "コクのある味わいが濃い煮汁やタレを受け止め、肉料理にも負けない存在感があります。"
        : "すっきりとした後味が脂を流し、肉料理の合間に口の中を整えます。",
  ],
  [
    ["夏", "冷やし", "さっぱり", "軽"],
    (rice) =>
      rice.clarity >= 4
        ? "軽やかで澄んだ味わいが、暑い日の食卓にも重たく残りません。"
        : "穏やかな甘みで、冷やした料理と合わせても味わいがぼやけません。",
  ],
  [
    ["葡萄", "ぶどう", "グレープ", "デザート", "食後", "果物", "フルーツ", "果実", "スイーツ"],
    (rice) => {
      if (rice.clarity >= 4 || rice.sweetness <= 2.5) {
        return "後味が軽くすっきりしているので、食後の果実の味を残しやすい一膳です。";
      }
      if (rice.sweetness >= 4) {
        return "甘みがふくよかで、食後の果実の甘みと続きやすい一膳です。";
      }
      return "口当たりが穏やかで、食後の甘みを邪魔しにくい一膳です。";
    },
  ],
];

/**
 * Explanation for a semantic match.
 *
 * Named-brand + cooking questions use catalogue dishes. Exact lookup says so
 * plainly. Otherwise prefers a drink-specific Flavor Bridge, then a scene rule,
 * then the brand's own editorial pairing reason.
 */
export function asksCookingUse(query: string) {
  return /料理|向[いくけ]|合う|用途|弁当|酢飯|寿司|丼|炒|炊き|どんな|どの|どう/.test(
    query
  );
}

function usageReason(rice: RiceProfileV2): string {
  const dishes = rice.best_match_dishes.filter(Boolean).slice(0, 3);
  const why = rice.short_.trim() || rice.pairing_reason.trim();
  if (dishes.length && why) {
    const dishLine = `${dishes.join("、")}に向きます。`;
    return why.startsWith(dishLine) ? why : `${dishLine}${why}`;
  }
  if (dishes.length) {
    return `${dishes.join("、")}に向きます。${rice.texture_label}・${rice.sweetness_label}な一膳です。`;
  }
  if (why) return why;
  return `${rice.prefecture}の、${rice.texture_label}・${rice.sweetness_label}な一膳です。`;
}

export function buildSemanticReason(query: string, rice: RiceProfileV2): string {
  const named = nameMatch(query, rice.name);

  if (named && asksCookingUse(query)) {
    return usageReason(rice);
  }

  if (named === "exact") {
    return `お探しの銘柄です。${rice.prefecture}の、${rice.texture_label}・${rice.sweetness_label}な一膳です。`;
  }

  if (queryTargetsPrefecture(query, rice.prefecture)) {
    return `${rice.prefecture}産の、${rice.texture_label}・${rice.sweetness_label}な一膳です。`;
  }

  const category = detectDrinkCategory(query);
  if (category) {
    return BRIDGES[category](rice);
  }

  const normalized = query.toLowerCase();
  for (const [keywords, build] of SCENE_RULES) {
    if (keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))) {
      return build(rice);
    }
  }

  if (rice.pairing_reason.trim()) {
    return rice.pairing_reason;
  }

  return "料理や気分の言葉に、味わいの特徴がよく重なる一膳です。";
}
