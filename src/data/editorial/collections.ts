export type EditorialCollection = {
  slug: string;
  title: string;
  dek: string;
  /** Extra line for the index list; keep short. */
  lede?: string;
  /** 誌面に出す公開日時（東京）。季節の `months` とは別。 */
  dateLabel: string;
  /** Calendar months 1–12 when this collection is featured on /collections. */
  months: number[];
  riceIds: string[];
  /** Filename under public/brand-art/collections/, or null until art exists. */
  artFile: string | null;
  body: string[];
};

/**
 * Hand-edited seasonal notes. Not generated. Ids must exist in the encyclopedia
 * manifest; unknown ids are stripped at lookup time.
 */
export const EDITORIAL_COLLECTIONS: EditorialCollection[] = [
  {
    slug: "jugatsu-wase",
    title: "十月の袋、早生から",
    dek: "令和8年産が店頭に並び始めるころ。先に届く早生を五銘柄読みます。",
    lede: "食味ランキングの前に、刈り入れの早い銘柄から手に取る読み方です。",
    dateLabel: "2026年10月12日 22時08分",
    months: [10, 11],
    riceIds: [
      "hazuki-minori",
      "hanaechizen",
      "yumemizuho",
      "fusakogane",
      "koshiibuki",
    ],
    artFile: "jugatsu-wase.webp",
    body: [
      "十月の店頭では、極早生や早生の令和8年産が先に袋になります。中生の主産地はこれから本格的に並び、食味ランキングは来年2月です。年産の優劣を決めつける時期ではありません。",
      "ここでは刈り入れが早い銘柄を、産地の違う五本に絞りました。袋の年産表記を確認してから、事典のメモと照らし合わせると、今年の入り口がつかみやすいです。",
    ],
  },
  {
    slug: "shio-musubi",
    title: "塩むすびで、味を見る",
    dek: "具もタレも足さない日に、米そのものの甘みと粒を読みます。",
    lede: "塩だけの握りは、銘柄の差が一番わかりやすい食べ方です。",
    dateLabel: "2026年10月12日 17時10分",
    months: [3, 4, 5, 6, 10, 11],
    riceIds: [
      "ryu-no-hitomi",
      "yumepirika",
      "koshihikari-uonuma",
      "nitamai",
      "sasanishiki",
    ],
    artFile: "shio-musubi.webp",
    body: [
      "塩だけの握りは、おかずに隠されない分、甘みの出方と粒の感触がはっきりします。同じ「おいしい」でも、大粒の厚みと、すっきりした後味では印象が変わります。",
      "ここでは塩むすびに向きやすい銘柄を、産地の違う五本に絞りました。まず塩で食べてから、事典のメモを読むと、選び方がつかみやすいです。",
    ],
  },
  {
    slug: "bento-cold",
    title: "冷めても、弁当に",
    dek: "昼の弁当箱で、粒がばらけすぎない米を集めました。",
    lede: "朝に炊いて、昼に蓋を開ける日のための読みどころです。",
    dateLabel: "2026年9月2日 0時02分",
    months: [4, 5, 6, 7, 8, 9],
    riceIds: ["sasanishiki", "hitomebore", "nanatsuboshi", "milky-queen", "haenuki"],
    artFile: "bento.webp",
    body: [
      "朝に炊いて、昼に蓋を開ける。そのあいだに粒が固まらず、かといって水っぽくならない米があります。",
      "冷めたときの粒立ちを目安に集めました。",
    ],
  },
  {
    slug: "shinmai",
    title: "新米のころ",
    dek: "秋の食卓に、炊きたての香りを。",
    lede: "刈り入れのあとは、産地の違う数銘柄を並べて読むと違いがつかみやすいです。",
    dateLabel: "2026年9月3日 16時48分",
    months: [9, 10, 11],
    riceIds: ["yumepirika", "koshihikari-uonuma", "tsuyahime", "hitomebore", "tentakaku"],
    artFile: "shinmai.webp",
    body: [
      "刈り入れのあとの米は、水分が多く、香りが立ちやすいとされています。同じ銘柄でも年で差が出ます。",
      "新米の時期に、産地の違う数銘柄を並べて読むと、甘みと粒の違いがつかみやすいです。",
    ],
  },
  {
    slug: "nabe",
    title: "鍋の季節",
    dek: "汁気の多い料理に、しっかりした粒。",
    lede: "汁がかかっても粒が残りやすい米を中心に置いてあります。",
    dateLabel: "2026年9月3日 18時53分",
    months: [11, 12, 1, 2],
    riceIds: ["yumepirika", "koshihikari-uonuma", "akitakomachi", "tsuyahime", "sagabiyori"],
    artFile: "nabe.webp",
    body: [
      "すき焼きや寄せ鍋のあと、ご飯に汁がかかることがあります。溶ける米より、粒が残る米のほうが合いやすい日です。",
      "甘みの強い銘柄と、すっきりした銘柄を両方置いてあります。今夜の鍋に合わせて選んでください。",
    ],
  },
  {
    slug: "toku-a",
    title: "特Aの一膳",
    dek: "日本穀物検定協会の食味ランキング。令和7年産で特Aだった銘柄から、五銘柄を読みます。",
    lede: "産地と年で変わります。令和8年産の結果は、来年2月です。",
    dateLabel: "2026年9月5日 1時45分",
    months: [2, 3, 9],
    riceIds: [
      "yumepirika",
      "seiten-no-hekireki",
      "tsuyahime",
      "koshihikari-uonuma",
      "sagabiyori",
    ],
    artFile: "toku-a.webp",
    body: [
      "特Aは、日本穀物検定協会が白飯を食べ比べてつける評価です。基準米より特に良いとされた産地と品種に、その年だけ付きます。",
      "令和7年産は、2026年2月27日に公表されました。令和8年産の刈り入れはこれからで、ランキングは来年2月です。ここでは7年産で特Aだった銘柄から、産地の違う五銘柄を並べています。",
      "北海道のゆめぴりか、津軽で特Aに戻った青天の霹靂、山形のつや姫、魚沼のコシヒカリ、佐賀のさがびよりです。同じ特Aでも、甘みと粒の感触は違います。",
    ],
  },
];
