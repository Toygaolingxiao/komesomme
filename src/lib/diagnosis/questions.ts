import { pairingPageBySlug, type PairingPage } from "@/data/editorial/pairings";
import type { PairTasteBias } from "@/lib/editorial/pairRank";
import type { ComparisonIndicatorKey } from "@/lib/editorial/comparisons";

/**
 * Diagnosis question/copy definitions (KomeSomme 2.0 gate 1).
 *
 * Pure data module: no functions with side effects, so the OG font coverage
 * test can JSON-stringify everything the diagnosis surfaces can render.
 * Dish biases and pool/avoid aliases come straight from PAIRING_PAGES — the
 * diagnosis never keeps a second set of dish numbers.
 */

export type IndicatorKey = ComparisonIndicatorKey;
export type TasteTarget = Partial<Record<IndicatorKey, number>>;

export type DishKey =
  | "curry"
  | "sushi"
  | "donburi"
  | "bento"
  | "sashimi"
  | "nabe"
  | "tkg"
  | "plain";
export type TextureKey = "mochi" | "tsubu" | "hiete";
export type CookerKey = "pressure" | "ih" | "micro" | "donabe";
export type SlotKey = "honmei" | "taikou" | "ana";
export type ConflictId = "C1" | "C2" | "C3" | "C4" | "C5" | "C6" | "C7";

/** The answers a diagnosis code carries (see code.ts). */
export type DiagnosisAnswers = {
  dish: DishKey;
  /** Resolved catalogue id of the base rice (avg decodes to koshihikari-bl). */
  baseId: string;
  baseIsDefault: boolean;
  tex: TextureKey;
  cooker: CookerKey;
};

function biasToTarget(bias: PairTasteBias): TasteTarget {
  const target: TasteTarget = {};
  if (bias.sweetness != null) target.sweetness = bias.sweetness;
  if (bias.hardness != null) target.hardness = bias.hardness;
  if (bias.stickiness != null) target.stickiness = bias.stickiness;
  if (bias.coldRice != null) target.cold_rice_quality = bias.coldRice;
  if (bias.oilCompatibility != null) target.oil_compatibility = bias.oilCompatibility;
  if (bias.clarity != null) target.clarity = bias.clarity;
  if (bias.sauceAbsorption != null) target.sauce_absorption = bias.sauceAbsorption;
  return target;
}

function pageOrThrow(slug: string): PairingPage {
  const page = pairingPageBySlug(slug);
  if (!page) throw new Error(`pairing page missing: ${slug}`);
  return page;
}

function pageBias(slug: string): TasteTarget {
  return biasToTarget(pageOrThrow(slug).bias);
}

function pageAliases(slug: string): string[] {
  return [...pageOrThrow(slug).dishAliases];
}

function pageAvoidAliases(slug: string): string[] {
  const page = pageOrThrow(slug);
  return [...(page.avoidAliases ?? page.dishAliases)];
}

function pageTopExcludeIds(slug: string): string[] {
  return [...(pageOrThrow(slug).topExcludeIds ?? [])];
}

export type DishOption = {
  key: DishKey;
  label: string;
  note: string;
  /** Q1 target vector (tkg: the 濃厚版; biasAlt is the 粒立ち版 used by F1). */
  bias: TasteTarget;
  biasAlt?: TasteTarget;
  /** best_match_dishes match strings for the main pool (plain: no filter). */
  poolAliases: string[];
  /** avoid_pairings match strings for rule R1. */
  avoidAliases: string[];
  /** Rule R2 exclusions from the pairing page. */
  topExcludeIds: string[];
  pairSlug: string | null;
  /** Closing sentence of the pick reason for this dish (§2.6). */
  sceneLine: string;
};

export const DISH_OPTIONS: DishOption[] = [
  {
    key: "curry",
    label: "カレー",
    note: "ルーに負けない粒がほしい日",
    bias: pageBias("curry"),
    poolAliases: pageAliases("curry"),
    avoidAliases: pageAvoidAliases("curry"),
    topExcludeIds: pageTopExcludeIds("curry"),
    pairSlug: "curry",
    sceneLine:
      "ルーの重さに押されないので、カレーの日はこちらの方が食卓が締まります。",
  },
  {
    key: "sushi",
    label: "寿司・酢飯",
    note: "家で握る、巻く",
    bias: pageBias("sushi"),
    poolAliases: pageAliases("sushi"),
    avoidAliases: pageAvoidAliases("sushi"),
    topExcludeIds: pageTopExcludeIds("sushi"),
    pairSlug: "sushi",
    sceneLine:
      "酢を合わせても粒の輪郭が残るので、家の手巻きでも崩れません。",
  },
  {
    key: "donburi",
    label: "丼もの",
    note: "つゆやタレがかかる献立",
    bias: pageBias("donburi"),
    poolAliases: pageAliases("donburi"),
    avoidAliases: pageAvoidAliases("donburi"),
    topExcludeIds: pageTopExcludeIds("donburi"),
    pairSlug: "donburi",
    sceneLine:
      "つゆがかかっても粒が流れないので、丼の最後の一口まで輪郭があります。",
  },
  {
    key: "bento",
    label: "お弁当・おにぎり",
    note: "冷めたご飯が主役",
    bias: pageBias("bento"),
    // Spec §1: the bento option also matches the onigiri page's aliases.
    poolAliases: [...pageAliases("bento"), ...pageAliases("onigiri")],
    avoidAliases: pageAvoidAliases("bento"),
    topExcludeIds: pageTopExcludeIds("bento"),
    pairSlug: "bento",
    sceneLine:
      "昼に開けた時の香りと甘さが残るので、弁当の真ん中に置けます。",
  },
  {
    key: "sashimi",
    label: "刺身・焼き魚",
    note: "魚の日の白飯",
    bias: pageBias("sashimi"),
    poolAliases: pageAliases("sashimi"),
    avoidAliases: pageAvoidAliases("sashimi"),
    topExcludeIds: pageTopExcludeIds("sashimi"),
    pairSlug: "sashimi",
    sceneLine:
      "魚の塩気と脂を覆わないので、刺身の日の白飯はこちらが正解に近いはずです。",
  },
  {
    key: "nabe",
    label: "鍋・雑炊",
    note: "締めまで米が働く",
    bias: pageBias("nabe"),
    poolAliases: pageAliases("nabe"),
    avoidAliases: pageAvoidAliases("nabe"),
    topExcludeIds: pageTopExcludeIds("nabe"),
    pairSlug: "nabe",
    sceneLine:
      "締めの雑炊で粒がほどけすぎないので、鍋の最後まで働きます。",
  },
  {
    key: "tkg",
    label: "卵かけご飯",
    note: "朝の一杯が楽しみ",
    bias: pageBias("tamagokake"),
    biasAlt: pageBias("tamagokake_sappari"),
    poolAliases: pageAliases("tamagokake"),
    avoidAliases: pageAvoidAliases("tamagokake"),
    topExcludeIds: pageTopExcludeIds("tamagokake"),
    pairSlug: "tamagokake",
    sceneLine:
      "卵の濃さに米の甘さが並ぶので、朝の一杯の満足が上がります。",
  },
  {
    key: "plain",
    label: "白飯そのまま",
    note: "おかず全般、決まった献立はない",
    // Site-original vector (no pairing page exists): balanced, leaning to
    // sweetness/umami — the position that least often goes wrong plain.
    bias: {
      sweetness: 3.4,
      stickiness: 3.2,
      hardness: 3,
      umami: 3.6,
      richness: 3.4,
      aroma: 3.4,
    },
    poolAliases: [],
    avoidAliases: [],
    topExcludeIds: [],
    pairSlug: null,
    sceneLine:
      "おかずを選ばない位置にいるので、献立が決まらない日の保険になります。",
  },
];

export const DISH_KEYS = DISH_OPTIONS.map((option) => option.key) as DishKey[];

export function dishOption(key: DishKey): DishOption {
  const option = DISH_OPTIONS.find((row) => row.key === key);
  if (!option) throw new Error(`unknown dish: ${key}`);
  return option;
}

export type TextureOption = {
  key: TextureKey;
  label: string;
  note: string;
  target: TasteTarget;
  /** Preference tag (labels the taste, never the person). */
  tag: string;
};

export const TEXTURE_OPTIONS: TextureOption[] = [
  {
    key: "mochi",
    label: "もちもち・甘み寄り",
    note: "やわらかく、甘みが広がる方が好き",
    target: { sweetness: 4.2, stickiness: 4.2, hardness: 2.2, richness: 3.8 },
    tag: "もちもち甘み派",
  },
  {
    key: "tsubu",
    label: "粒立ち・さっぱり",
    note: "粒が立って、後味が引く方が好き",
    target: { hardness: 4.2, clarity: 4.4, stickiness: 1.8, sweetness: 2.4 },
    tag: "粒立ちさっぱり派",
  },
  {
    key: "hiete",
    label: "冷めても旨い重視",
    note: "弁当や残りご飯の旨さが大事",
    target: { cold_rice_quality: 5, sweetness: 3.4, stickiness: 3.4, hardness: 3 },
    tag: "冷めても旨い派",
  },
];

export const TEXTURE_KEYS = TEXTURE_OPTIONS.map(
  (option) => option.key,
) as TextureKey[];

export function textureOption(key: TextureKey): TextureOption {
  const option = TEXTURE_OPTIONS.find((row) => row.key === key);
  if (!option) throw new Error(`unknown texture: ${key}`);
  return option;
}

export type CookerOption = {
  key: CookerKey;
  label: string;
  /** Deltas applied to the merged target (clamped to [1,5] afterwards). */
  adjust: Partial<Record<IndicatorKey, number>>;
};

export const COOKER_OPTIONS: CookerOption[] = [
  {
    key: "pressure",
    label: "圧力IH",
    adjust: { stickiness: -0.5, hardness: 0.5 },
  },
  { key: "ih", label: "IH（ふつう）", adjust: {} },
  { key: "micro", label: "マイコン", adjust: {} },
  {
    key: "donabe",
    label: "土鍋・ガス釜",
    adjust: { stickiness: 0.3, hardness: -0.3 },
  },
];

export const COOKER_KEYS = COOKER_OPTIONS.map(
  (option) => option.key,
) as CookerKey[];

export function cookerOption(key: CookerKey): CookerOption {
  const option = COOKER_OPTIONS.find((row) => row.key === key);
  if (!option) throw new Error(`unknown cooker: ${key}`);
  return option;
}

/** Conflict warnings in priority order (matching logic lives in engine.ts). */
export const DIAGNOSIS_CONFLICTS: Array<{ id: ConflictId; warning: string }> = [
  {
    id: "C1",
    warning:
      "一言だけ。寿司の日に粘りの強い米を持ってくると、シャリが重くなってネタの輪郭が消えます。好みは分かりますが、今日のところは粒が立つ方に寄せて選びました。握らない日の楽しみに、その銘柄は取っておきましょう。",
  },
  {
    id: "C2",
    warning:
      "一言だけ。カレーにもちもちの甘い米は、ルーと甘さが重なって後半が重くなります。粘りと甘みには上限を付けて選びました。残った希望は、対抗と穴の方に回してあります。",
  },
  {
    id: "C3",
    warning:
      "一言だけ。刺身の日は、米の甘みが魚より前に出ると食卓の主役が入れ替わります。甘みには上限を付けてあります。甘い米の本領は、肉の日や卵かけご飯の日にどうぞ。",
  },
  {
    id: "C4",
    warning:
      "一言だけ。締めの雑炊は、粒が少しほどける方が出汁と馴染みます。粒立ちの希望は少しだけ丸めて選びました。白飯で盛る分には、対抗の方が好みに近いかもしれません。",
  },
  {
    id: "C5",
    warning:
      "一言だけ。お弁当は冷めた状態が本番です。粒立ちの希望は受け取りましたが、冷めてからの旨さだけは譲らずに選びました。温かいうちの顔と、昼の顔、両方見て選んであります。",
  },
  {
    id: "C6",
    warning:
      "一言だけ。圧力IHはただでさえ粘りとやわらかさを足します。もちもち希望と重なると、水加減を間違えたような炊き上がりになります。目標を少し引き締めて選びました。炊く時は水を気持ち少なめにどうぞ。",
  },
  {
    id: "C7",
    warning:
      "一言だけ。ふだんの米は粘りと甘みの側、今夜の寿司は粒とすっきり感の側です。正反対の位置なので、出てくる三つは『いつもと違う』顔ぶれになります。それが狙いです。",
  },
];

export const SLOT_DEFS: Record<
  SlotKey,
  { title: string; note: string }
> = {
  honmei: {
    title: "本命",
    note: "答えにいちばん近い一席。まずはこれです。",
  },
  taikou: {
    title: "対抗",
    note: "方向の違う本命候補。迷ったら、こちらと食べ比べです。",
  },
  ana: {
    title: "穴",
    note: "いつもの米からいちばん遠い、けれど外さない一席。番頭の遊び心ではなく、計算の上での冒険です。",
  },
};

/**
 * Delta phrasing (§2.6). `single` stands alone at the end of the sentence;
 * `conn` is the continuative (中止法) form used when two deltas are joined.
 * Bands: p2 = Δ≥+2, p1 = Δ=+1, m1 = Δ=−1, m2 = Δ≤−2.
 */
export type DeltaBand = "p2" | "p1" | "m1" | "m2";

export const DELTA_PHRASES: Partial<
  Record<IndicatorKey, Record<DeltaBand, { single: string; conn: string }>>
> = {
  sweetness: {
    p2: { single: "甘みがぐっと強くなる", conn: "甘みがぐっと強くなり" },
    p1: { single: "甘みがひと口分増す", conn: "甘みがひと口分増し" },
    m1: { single: "甘みは少し引く", conn: "甘みは少し引き" },
    m2: { single: "甘みが大きく引く", conn: "甘みが大きく引き" },
  },
  stickiness: {
    p2: { single: "粘りが別物なくらい増す", conn: "粘りが別物なくらい増し" },
    p1: { single: "粘りが少し増す", conn: "粘りが少し増し" },
    m1: { single: "粘りは少し引く", conn: "粘りは少し引き" },
    m2: { single: "粘りがすっと引く", conn: "粘りがすっと引き" },
  },
  hardness: {
    p2: { single: "粒立ちがはっきり強くなる", conn: "粒立ちがはっきり強くなり" },
    p1: { single: "粒が少し立つ", conn: "粒が少し立ち" },
    m1: { single: "粒は少しやわらぐ", conn: "粒は少しやわらぎ" },
    m2: { single: "粒がだいぶやわらぐ", conn: "粒がだいぶやわらぎ" },
  },
  cold_rice_quality: {
    p2: {
      single: "冷めてからの旨さが段違いに伸びる",
      conn: "冷めてからの旨さが段違いに伸び",
    },
    p1: {
      single: "冷めても旨さが残りやすい",
      conn: "冷めても旨さが残りやすく",
    },
    m1: {
      single: "冷めた時の旨さは少し落ちる",
      conn: "冷めた時の旨さは少し落ち",
    },
    m2: { single: "冷めた時の旨さは落ちる", conn: "冷めた時の旨さは落ち" },
  },
  clarity: {
    p2: { single: "後味がかなりすっきりする", conn: "後味がかなりすっきりし" },
    p1: { single: "後味が少しすっきりする", conn: "後味が少しすっきりし" },
    m1: { single: "すっきり感は少し弱まる", conn: "すっきり感は少し弱まり" },
    m2: { single: "すっきり感は弱まる", conn: "すっきり感は弱まり" },
  },
  umami: {
    p2: { single: "旨みがしっかり厚くなる", conn: "旨みがしっかり厚くなり" },
    p1: { single: "旨みが少し増す", conn: "旨みが少し増し" },
    m1: { single: "旨みは少し薄くなる", conn: "旨みは少し薄くなり" },
    m2: { single: "旨みがだいぶ薄くなる", conn: "旨みがだいぶ薄くなり" },
  },
};

/** Headline delta keys, in the order ties are broken (§2.6). */
export const HEADLINE_KEYS: IndicatorKey[] = [
  "sweetness",
  "stickiness",
  "hardness",
  "cold_rice_quality",
  "clarity",
  "umami",
];

export const DIAGNOSIS_COPY = {
  wizardTitle: "番頭の米診断",
  // v1 asks three questions in the UI; the cooker field still exists in the
  // engine and the result code (always the default), so a fourth question
  // can be added later without changing the code format.
  wizardLead:
    "いらっしゃい。三つだけ聞かせてください。ふだんの食卓と、いつもの米。それだけで、うちの108銘柄の中から「今日の相棒米」を三つ、理由つきで出します。値段の話はしません。味の相性だけ見ます。",
  startButton: "診断をはじめる",
  invalidNotice:
    "リンクの診断コードを読み取れませんでした。お手数ですが、もう一度どうぞ。",
  q1Title: "その米、いちばん出番が多いのはどんな食卓ですか。",
  q1Sub: "いちばん近いものを一つ。",
  q2Title: "ふだん、家で炊いている米は何ですか。",
  q2Sub:
    "銘柄名で答えてください。『コシヒカリ』『ゆめぴりか』のような書き方で大丈夫です。",
  q2Unknown: "決まった銘柄はない・分からない",
  q2Next: "次へ",
  q2Placeholder: "銘柄名を入力",
  q3Title: "ご飯の好み、どちらに寄っていますか。",
  q3Sub: "直感でどうぞ。あとで番頭が献立とすり合わせます。",
  back: "戻る",
  resultEyebrow: "番頭の米診断",
  resultTitle: "今日の相棒米",
  subtitleNamed: "{base}をものさしに、108銘柄から三つ選びました。",
  subtitleAvg: "ものさしのコシヒカリと比べながら、108銘柄から三つ選びました。",
  warningTitle: "番頭から一言",
  baseBarPrefix: "ものさし",
  fallbackNote:
    "『{raw}』はうちの帳簿で一意に決められなかったので、ものさしのコシヒカリで比べています。",
  noDeltaNamed:
    "いつもの{base}と味の位置はほぼ同じです。産地と香りの違いを楽しむ一席としてどうぞ。",
  noDeltaAvg:
    "ものさしのコシヒカリと味の位置はほぼ同じです。産地と香りの違いを楽しむ一席としてどうぞ。",
  comparePrefixNamed: "いつもの{base}と比べると、",
  comparePrefixAvg: "ものさしのコシヒカリと比べると、",
  detailLink: "銘柄ページで詳しく",
  shareTitle: "この三席を送る",
  shareCopy: "リンクをコピー",
  shareCopied: "コピーしました",
  shareX: "Xで送る",
  shareLine: "LINEで送る",
  shareText:
    "番頭に選んでもらった『今日の相棒米』は{name}でした。あなたの三席は？ {url}",
  retryLink: "答えを変えて、もう一度",
  tagAriaPrefix: "好みの目印",
  entryLead: "迷ったら、番頭の診断",
  entryNote: "三つの質問で『今日の相棒米』を出します",
  entryCompare: "決めきれない時は診断へ",
} as const;

export const OG_COPY = {
  eyebrow: "KomeSomme 番頭の米診断",
  title: "今日の相棒米",
  footerNamed: "{base}をものさしに選んだ三席",
  footerAvg: "ものさしのコシヒカリと比べた三席",
  host: "komesomme.jp",
} as const;

export const BUYING_TIPS_TITLE = "お得な買い方（番頭メモ）";

export const BUYING_TIPS_LINES: string[] = [
  "ふるさと納税なら、実質負担2,000円でこの銘柄が届く自治体があります。銘柄ページの『ふるさと納税』タブに寄附先を並べてあります。",
  "初めてなら2kgの試し買い、家族で毎日炊くなら5kgの定期便が、結果的に無駄がありません。",
  "新米は秋に出回り、年明けからは前年産が落ち着いた値段で出ます。急がないなら、そこも狙い目です。",
];

export const BUYING_TIPS_LINK_LABEL = "銘柄ページの購入欄へ";
