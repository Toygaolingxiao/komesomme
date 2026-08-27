import { detectDrinkCategory, detectPrefectureStem, type DrinkCategory } from "./flavorBridge";

/**
 * Prefab retrieval hints for consultation.
 *
 * The guest sees only their own sentence. Before embedding we append the same
 * vocabulary used in `search_text` (dishes, drinks, texture) so a short chatty
 * query still lands near the right catalogue rows.
 */

const DRINK_HINTS: Record<DrinkCategory, string> = {
  highball: "ハイボール 炭酸 粒立ち 後味すっきり 油相性 唐揚げ 焼き鳥",
  smoky: "スモーキー ピート 淡麗 焼き魚 香り",
  sherry: "シェリー樽 甘み 旨み すき焼き 角煮 コク",
  bourbon: "バーボン 大粒 甘み 肉料理 油相性",
  "japanese-whisky": "ジャパニーズウイスキー 香り 出汁 塩おにぎり 均衡",
  sake: "日本酒 純米 吟醸 淡麗 刺身 煮物",
  beer: "ビール 油相性 粒立ち 餃子 炒飯",
  wine: "ワイン コク 洋食 きのこ",
  tea: "お茶 煎茶 余韻 お茶漬け",
};

const SCENE_HINTS: Array<[keywords: string[], hint: string]> = [
  [["弁当", "冷めても", "おにぎり", "作り置き"], "冷めても 弁当 おにぎり 冷飯"],
  [["唐揚げ", "揚げ", "油"], "揚げ物 油相性 粒立ち"],
  [["カレー", "丼", "牛丼", "親子丼", "中華"], "カレー 丼 タレ相性 粒立ち"],
  [["刺身", "寿司", "和食", "出汁", "焼き魚"], "刺身 寿司 出汁 淡麗 粘り控えめ"],
  [["疲れ", "やさしい", "ほっと", "癒", "元気"], "粘り 甘み やさしい 日常"],
  [["楽し", "嬉し", "お祝い", "記念", "ハッピー", "开心", "高兴"], "お祝い 甘み ふくよか 食卓"],
  [["秋", "きのこ", "栗", "松茸"], "秋 きのこ 旨み 炊き込み"],
  [["すき焼き", "照り焼き", "角煮", "焼肉"], "肉料理 タレ コク 旨み"],
  [["夏", "冷やし", "さっぱり"], "夏 さっぱり 淡麗 冷やし"],
  [
    ["葡萄", "ぶどう", "グレープ", "デザート", "食後", "果物", "フルーツ", "果実", "スイーツ"],
    "食後 果実 デザート 後味 甘み 淡麗",
  ],
  [["不想吃甜", "不吃甜", "不甜", "甘くない", "甘みを抑", "甘み少な"], "淡麗 すっきり 甘み控えめ 後味軽い"],
  [["甘い米", "甘み豊か", "ふくよか", "想吃甜"], "ふくよか 甘み 粘り"],
];

export function expandConsultationQuery(query: string): string {
  const lines = [`ゲストの相談: ${query.trim()}`, "検索の手がかり:"];

  const drink = detectDrinkCategory(query);
  if (drink) {
    lines.push(`酒: ${DRINK_HINTS[drink]}`);
  }

  const prefecture = detectPrefectureStem(query);
  if (prefecture) {
    lines.push(`産地: ${prefecture} 県産 土地の銘柄`);
  }

  const normalized = query.toLowerCase();
  for (const [keywords, hint] of SCENE_HINTS) {
    if (keywords.some((keyword) => normalized.includes(keyword.toLowerCase()))) {
      lines.push(`場面: ${hint}`);
    }
  }

  lines.push("日本のブランド米 一膳 産地 食味 粒感 甘み 粘り");
  return lines.join("\n");
}
