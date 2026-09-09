import type { PairTasteBias } from "@/lib/editorial/pairRank";

export type PairingFaq = {
  q: string;
  a: string;
};

export type PairingPage = {
  slug: string;
  /** Short label for H1 / nav (例: カレー). */
  dishLabel: string;
  /** Strings matched against best_match_dishes. */
  dishAliases: string[];
  /** Optional narrower / wider strings for avoid_pairings only. */
  avoidAliases?: string[];
  /** When catalog avoid is empty, allow axis-opposite fallback. */
  allowAxisOppositeAvoid?: boolean;
  bias: PairTasteBias;
  title: string;
  dek: string;
  lead: string[];
  /** Visible Diff Gate #1 — how Top 5 were ordered. */
  sortNote: string;
  /** Shown when avoidSource === "axis". */
  axisAvoidNote?: string;
  faq: PairingFaq[];
  relatedSlugs: string[];
  collectionSlug?: string;
};

/**
 * Hand-edited cuisine landings (Wave 2A). Top brands and 向かない are derived
 * from the catalogue at render / validate time — do not hard-code brand ids.
 */
export const PAIRING_PAGES: PairingPage[] = [
  {
    slug: "curry",
    dishLabel: "カレー",
    dishAliases: ["カレー", "カレーライス", "スープカレー"],
    avoidAliases: ["カレー", "カレーライス"],
    bias: { sweetness: 2.5, hardness: 3.5, stickiness: 2 },
    title: "カレーに合う米の選び方｜甘み・粒感と比較表",
    dek: "ルーが主役の日は、甘みと粒の残り方で印象が変わります。カタログの相性から五銘柄を並べました。",
    lead: [
      "カレーはソースが先に口に来ます。米は甘みの強さと、汁を含んだあとの粒の残り方で、食卓の印象を左右します。",
      "ここではカタログの「合う料理」にカレーが含まれる銘柄を集め、甘み・粒感の座標がカレー向きの帯に近い順に五銘柄を置いています。価格や還元の話はしません。",
      "合わない組み合わせも、カタログの「向かない」から拾っています。ルーの辛さに負けやすい米は、そこから外れます。",
    ],
    sortNote:
      "候補は best_match_dishes に「カレー」「カレーライス」「スープカレー」を含む銘柄。並びは甘み2.5・硬さ3.5・粘り2に近い座標を優先しています。",
    faq: [
      {
        q: "なぜ値段ではなく味で選ぶのですか。",
        a: "同じカレーでも、米の甘みと粒立ちでルーの印象が変わります。値段の並びだけでは、今夜の一口に届きません。",
      },
      {
        q: "食味ランキングの特Aと、この表は同じですか。",
        a: "違います。日本穀物検定協会の食味ランキングは、産地と品種ごとの白飯の官能評価です。今夜のカレー向きを直接答えているわけではありません。",
      },
      {
        q: "買う前に何を見ればよいですか。",
        a: "表の「向いている人」と「気をつける点」を先に読み、気になった銘柄の事典で産地とメモを確認してください。お店のリンクは比較表のあとです。",
      },
    ],
    relatedSlugs: ["bento", "nabe", "sashimi", "sushi"],
  },
  {
    slug: "sashimi",
    dishLabel: "刺身",
    dishAliases: ["刺身", "お刺身", "白身魚の刺身"],
    avoidAliases: ["刺身", "お刺身", "白身魚", "白身"],
    bias: { sweetness: 2.2, hardness: 2.5, stickiness: 2.5 },
    title: "刺身に合う米の選び方｜甘み・粒感と比較表",
    dek: "魚の脂や塩気を邪魔しない帯を、カタログの相性から拾います。",
    lead: [
      "刺身の日は、米が主張しすぎると魚の味が後ろに下がります。あっさりした甘みと、口の中でほどける粒が扱いやすい帯です。",
      "カタログで刺身向きと書いた銘柄を集め、甘みを抑えめ・粒が立ちすぎない座標に近い順に並べています。",
      "濃いタレや強い甘み向きの米は、向かない欄に寄せました。同じ白飯でも、献立で役割が分かれます。",
    ],
    sortNote:
      "候補は best_match_dishes に刺身系の語を含む銘柄。並びは甘み2.2・硬さ2.5・粘り2.5に近い座標を優先しています。",
    faq: [
      {
        q: "なぜ味の座標で選ぶのですか。",
        a: "刺身は素材の差が大きいです。米の甘みと粘りが強すぎると、魚の塩気や脂が隠れます。",
      },
      {
        q: "特Aの米なら刺身に向きますか。",
        a: "必ずしもそうではありません。食味ランキングは白飯の官能評価であり、刺身専用の答えではありません。",
      },
      {
        q: "寿司用の米とは違いますか。",
        a: "重なる銘柄もありますが、酢を効かせる寿司と、塩気中心の刺身では、求める粘りが少し違います。寿司のページも併せてどうぞ。",
      },
    ],
    relatedSlugs: ["sushi", "curry", "bento", "nabe"],
  },
  {
    slug: "bento",
    dishLabel: "お弁当",
    dishAliases: ["弁当", "お弁当"],
    avoidAliases: ["弁当", "お弁当"],
    allowAxisOppositeAvoid: true,
    bias: { sweetness: 3, hardness: 3.2, stickiness: 2.8, coldRice: 4.2 },
    title: "お弁当に合う米の選び方｜冷めても粒が残る比較表",
    dek: "朝に炊いて昼に蓋を開ける日は、冷めたあとの粒感が大事です。",
    lead: [
      "お弁当の米は、炊きたての甘みより、冷めたあとに粒がばらけすぎないかを見ます。くっつきすぎると具との境が消えます。",
      "カタログで弁当向きと書いた銘柄を集め、冷めたときの食感の指標が高い帯を優先して五銘柄に絞っています。",
      "向かない欄は、カタログに弁当の忌避が少ないため、座標上この帯から遠い銘柄を示しています。絶対に合わないという意味ではありません。",
    ],
    sortNote:
      "候補は best_match_dishes に「弁当」「お弁当」を含む銘柄。並びは冷めたときの指標を重く見つつ、甘み3・硬さ3.2・粘り2.8に近い座標を優先しています。",
    axisAvoidNote:
      "カタログに「弁当には向かない」と明記された銘柄が少ないため、ここでは冷めた弁当向きの座標から遠い銘柄を挙げています。",
    faq: [
      {
        q: "冷めてもおいしい、とは何を見ていますか。",
        a: "カタログの冷めたときの指標と、粘り・硬さのバランスです。べたつかず、かといってパサつかない帯を上に置いています。",
      },
      {
        q: "新米の季節は弁当向きですか。",
        a: "水分が多く柔らかい年もあるので、銘柄の事典メモも読んでください。季節の特集も参考になります。",
      },
      {
        q: "食味ランキングは弁当選びに使えますか。",
        a: "白飯の官能評価としては参考になりますが、冷めた弁当専用の答えではありません。",
      },
    ],
    relatedSlugs: ["curry", "nabe", "sushi", "sashimi"],
    collectionSlug: "bento-cold",
  },
  {
    slug: "nabe",
    dishLabel: "鍋",
    dishAliases: ["鍋", "すき焼き", "きりたんぽ", "もつ鍋", "水炊き"],
    avoidAliases: ["鍋", "すき焼き"],
    allowAxisOppositeAvoid: true,
    bias: { sweetness: 3.2, hardness: 3.6, stickiness: 2.6 },
    title: "鍋に合う米の選び方｜汁がかかっても粒が残る比較表",
    dek: "寄せ鍋やすき焼きのあと、ご飯に汁がかかることがあります。溶ける米より、粒が残る帯を見ます。",
    lead: [
      "鍋の季節は、白米が締めや添えになることが多いです。汁を含んでも形が残る粒のほうが、最後まで食べやすい日があります。",
      "カタログで鍋・すき焼き・郷土鍋の締めなどに触れている銘柄を集め、硬め・粘り控えの座標に近い順に並べています。",
      "向かない欄は、カタログ忌避が少ないため、この帯から遠い銘柄を座標で示しています。甘みが先に来る米は、濃い出汁の日には主役を奪うことがあります。",
    ],
    sortNote:
      "候補は best_match_dishes に鍋・すき焼き・きりたんぽ等を含む銘柄。並びは甘み3.2・硬さ3.6・粘り2.6に近い座標を優先しています。",
    axisAvoidNote:
      "カタログに「鍋には向かない」と直書きされた銘柄が少ないため、汁気の多い献立向きの座標から遠い銘柄を挙げています。",
    faq: [
      {
        q: "鍋の締めの雑炊向きと、添える白飯は同じですか。",
        a: "雑炊は溶ける側、添えの白飯は粒が残る側を見ることが多いです。この表は添え・締めのご飯寄りの帯です。",
      },
      {
        q: "特Aだから鍋に向く、と考えてよいですか。",
        a: "いいえ。食味ランキングは産地品種の白飯評価であり、鍋専用の答えではありません。",
      },
      {
        q: "すき焼きだけ別の米にした方がよいですか。",
        a: "タレが濃い日は、甘みのある米も合いやすいです。表の「向いている人」を見て、今夜の味付けに寄せてください。",
      },
    ],
    relatedSlugs: ["curry", "bento", "sashimi", "sushi"],
    collectionSlug: "nabe",
  },
  {
    slug: "sushi",
    dishLabel: "寿司",
    dishAliases: ["寿司", "お寿司", "手巻き寿司", "ちらし寿司", "酢飯"],
    avoidAliases: ["寿司", "酢飯", "シャリ"],
    bias: { sweetness: 2.4, hardness: 3.2, stickiness: 2.2 },
    title: "寿司に合う米の選び方｜酢飯向きの甘み・粒感と比較表",
    dek: "酢との馴染みと、口の中でほどける粒。カタログの寿司向きから五銘柄を並べます。",
    lead: [
      "寿司のシャリは、粘りが強すぎるとネタの輪郭が消えます。酢を吸わせたあとも粒が残る米が扱いやすいです。",
      "カタログで寿司・酢飯向きと書いた銘柄を集め、甘み控えめ・粘り控えめの座標に近い順に五銘柄を置いています。",
      "酸の強い酢飯を避けたい、とカタログに書かれた銘柄は向かない欄へ寄せました。家で握る日の目安にしてください。",
    ],
    sortNote:
      "候補は best_match_dishes に寿司・酢飯系の語を含む銘柄。並びは甘み2.4・硬さ3.2・粘り2.2に近い座標を優先しています。",
    faq: [
      {
        q: "業務用の酢飯向け銘柄と、家の手巻きは同じですか。",
        a: "重なることが多いですが、家では扱いやすさも大事です。表の気をつける点を読んでから選んでください。",
      },
      {
        q: "食味ランキングの上位なら寿司向きですか。",
        a: "白飯の評価と、酢を合わせたあとの食感は別物です。ランキングは背景として見る程度にしてください。",
      },
      {
        q: "刺身のページとの違いは何ですか。",
        a: "刺身は塩気中心、寿司は酢との馴染みを見ます。両方開いて比べると差が掴みやすいです。",
      },
    ],
    relatedSlugs: ["sashimi", "bento", "curry", "nabe"],
  },
];

export function allPairingSlugs(): string[] {
  return PAIRING_PAGES.map((page) => page.slug);
}

export function pairingPageBySlug(slug: string): PairingPage | null {
  return PAIRING_PAGES.find((page) => page.slug === slug) ?? null;
}
