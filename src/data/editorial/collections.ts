/** Magazine date for the page. Sort keys keep the clock in `dateLabel`. */
export function collectionDateDisplay(dateLabel: string): string {
  return dateLabel.replace(/\s+\d{1,2}時\d{1,2}分$/, "");
}

export type EditorialCollection = {
  slug: string;
  title: string;
  dek: string;
  /** Extra line for the index list; keep short. */
  lede?: string;
  /** 誌面に出す公開日時（東京）。季節の `months` とは別。 */
  dateLabel: string;
  /** 同じ書式の更新日時。一覧の並びと日付表示は、更新日時があればそちらを優先する。 */
  updatedLabel?: string;
  /** Calendar months 1–12 when this collection is featured on /collections. */
  months: number[];
  riceIds: string[];
  /** Filename under public/brand-art/collections/, or null until art exists. */
  artFile: string | null;
  body: string[];
  /** h2 + 箇条書き。URL は年を付けず、毎年ここを書き換える。 */
  sections?: { heading: string; items: string[] }[];
  /** 銘柄 id → 誌面の短い注。事典 headline の下に出す。 */
  riceNotes?: Record<string, string>;
};

/**
 * Hand-edited seasonal notes. Not generated. Ids must exist in the encyclopedia
 * manifest; unknown ids are stripped at lookup time.
 */
export const EDITORIAL_COLLECTIONS: EditorialCollection[] = [
  {
    slug: "yakizakana",
    title: "焼き魚の夜",
    dek: "塩気の立つ魚に、白飯が静かに寄り添う銘柄を集めました。",
    lede: "秋刀魚のころから定食の焼き魚まで。米が魚を邪魔しない帯です。",
    dateLabel: "2026年10月19日 6時45分",
    months: [10, 11],
    riceIds: [
      "seiten-no-hekireki",
      "tentakaku",
      "sasanishiki",
      "sakihokore",
      "tsuyahime",
    ],
    artFile: "yakizakana.webp",
    body: [
      "塩焼きの魚は、皮の香ばしさと塩気が先に来ます。米は甘みが強すぎず、後味が短く残るほうが、次の一口の魚に戻りやすいです。",
      "ここでは焼き魚の定食に向きやすい銘柄を、産地の違う五本に絞りました。すっきりした帯と、塩気を受け止める甘みの帯を両方置いてあります。",
    ],
  },
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
    dek: "令和8年産の新米を、産地を変えて食べ比べる。",
    lede: "早く出回る銘柄から特Aの常連まで、12銘柄を並べました。",
    dateLabel: "2026年9月3日 16時48分",
    updatedLabel: "2026年10月31日 14時05分",
    months: [9, 10, 11],
    riceIds: [
      "hazuki-minori",
      "yumepirika",
      "nanatsuboshi",
      "seiten-no-hekireki",
      "sakihokore",
      "tsuyahime",
      "yukiwakamaru",
      "koshihikari-uonuma",
      "tenkomori",
      "ichihomare",
      "genki-tsukushi",
      "nijinokirameki",
    ],
    artFile: "shinmai.webp",
    body: [
      "令和8年産の新米が、北から南まで出そろってきました。刈り入れのあとの米は水分が多めで、炊きたての香りが立ちやすいとされています。",
      "同じ銘柄でも年ごとに表情が変わるので、産地の違う数銘柄を並べて食べ比べると、甘みや粒の違いがつかみやすくなります。今年は早く出回る銘柄から、食味ランキングで評価の高かった銘柄まで、12銘柄を選びました。",
    ],
    sections: [
      {
        heading: "今年の新米メモ",
        items: [
          "令和8年産の主食用米は、予想収穫量が710万5千トンで、前年より7万6千トン少ない見込みです。全国の作況単収指数は102と発表されています。（出典：農林水産省「令和8年産水稲の作付面積及び9月25日現在の予想収穫量」2026年10月）",
          "全国のスーパーでの平均販売価格は、10月19日〜25日の週で5kgあたり2,788円（税込）でした。前の週より33円安く、値下がりは11週続いています。前年の同じ時期より1,420円安くなっています。銘柄米（販売数量の83%）は5kgあたり2,811円で前の週より61円安く、ブレンド米など（17%）は2,678円で69円高くなっています。（出典：農林水産省「[スーパーでの販売数量・価格の推移](https://www.maff.go.jp/j/nousan/kokumotu/ksppos.pdf)」2026年10月30日）",
          "令和8年産の1等比率（水稲うるち玄米）は、9月末時点の速報で79.8%でした。前年の同じ時点（77.0%）より2.8ポイント高くなっています。検査はまだ途中のため、今後の数字は変わります。（出典：農林水産省「令和8年産米の農産物検査結果（速報値、9月30日現在）」2026年10月30日）。",
          "高温に強い品種の作付けは、令和7年産で主食用米の18.2%まで広がりました。令和8年産の割合はまだ公表されていません。（出典：農林水産省「令和7年地球温暖化影響調査レポート（速報）」2026年3月）",
          "令和8年産の食味ランキングは、例年どおりなら2027年2月ごろの発表です。下の銘柄の特Aは、令和7年産の結果にもとづいています。（出典：日本穀物検定協会「令和7年産米の食味ランキング」2026年2月）",
          "埼玉県の新品種『[えみほころ](/library/emihokoro)』は、令和8年産から本格流通が始まりました。県内のスーパーなどでは11月下旬から販売予定とされています。（出典：埼玉県「[“えみほころ”で食欲の秋を楽しもう！](https://www.pref.saitama.lg.jp/a0314/sainokuni/sainokuni-kensei-202610p02.html)」2026年10月1日）",
        ],
      },
      {
        heading: "新米の楽しみ方",
        items: [
          "水加減は目盛りよりほんの少し控えめから始めて、炊き上がりを見て次回に調整します。乾燥が進んだ新米もあるので、決めつけないのがコツです。",
          "研ぐときは手早くやさしく。最初の水はすぐに捨てると、ぬか臭さが残りにくくなります。",
          "最初の一膳は、塩むすびか白ごはんだけで。香りと甘みの違いがいちばんよく分かります。",
          "食べ比べは、同じ日に同じ水加減で2銘柄を少量ずつ炊くと、違いがはっきりします。精米後は密閉して涼しい場所（夏場は野菜室）に置き、早めに食べきりましょう。",
        ],
      },
    ],
    riceNotes: {
      "hazuki-minori": "新潟の極早生で、暑い時期にいち早く出回ります。今年の新米の走りを確かめる一袋に。",
      yumepirika: "北海道の令和7年産特A銘柄。粘りと甘みのしっかりした新米を食べたい日に。",
      nanatsuboshi: "同じく北海道の特A。釣り合いのとれた味で、ゆめぴりかとの食べ比べに向きます。",
      "seiten-no-hekireki": "津軽産が令和7年産で特Aに戻りました。すっきりした後味で、焼き魚の日に。",
      sakihokore: "秋田の新しい銘柄で、令和5〜7年産と特Aが続いています。",
      tsuyahime: "村山・置賜産が3年続けて特A。炊き上がりの白さとツヤを新米で。",
      yukiwakamaru: "山形のもう一つの銘柄。庄内・置賜産が令和7年産で特A、粒感が好きな方に。",
      "koshihikari-uonuma": "魚沼産は令和7年産も特A。食べ比べの基準になる一膳です。",
      tenkomori: "令和5・6年産のAから、令和7年産で特Aに上がった富山の銘柄です。",
      ichihomare: "福井の銘柄で、令和5〜7年産と特Aが続いています。やさしい甘みが持ち味です。",
      "genki-tsukushi": "暑さに強い福岡の品種。令和7年産で特Aに返り咲きました。",
      nijinokirameki: "高温に対応して開発された大粒の品種。丼やカレーでも粒感が残ります。",
    },
  },
  {
    slug: "nabe",
    title: "鍋の季節",
    dek: "汁気の多い料理に、しっかりした粒。",
    lede: "汁がかかっても粒が残りやすい米を中心に置いてあります。",
    dateLabel: "2026年9月3日 18時53分",
    updatedLabel: "2026年10月25日 18時53分",
    months: [11, 12, 1, 2],
    riceIds: [
      "yumepirika",
      "koshihikari-uonuma",
      "akitakomachi",
      "tsuyahime",
      "sagabiyori",
      "nijinokirameki",
    ],
    artFile: "nabe.webp",
    body: [
      "鍋のあとの雑炊や、取り分けた具をごはんにのせる日。汁を吸ってもべちゃっとしにくい、粒のしっかりした銘柄を中心に選びました。甘みの強い銘柄とすっきりした銘柄を両方置いているので、寄せ鍋やキムチ鍋など、その日の味の濃さで選んでください。",
    ],
    riceNotes: {
      nijinokirameki: "汁気のある料理でも形が崩れにくいお米です。",
    },
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
