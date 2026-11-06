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
    lede: "秋刀魚のころから定食の焼き魚まで。米が魚の味を邪魔しない、控えめな味わいの銘柄です。",
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
      "ここでは焼き魚の定食に向きやすい五本を並べました。すっきりした味わいの銘柄と、塩気を受け止める甘みのある銘柄を、両方置いてあります。",
    ],
  },
  {
    slug: "jugatsu-wase",
    title: "十月の袋、早生から",
    dek: "令和8年産が店頭に並び始めるころ。先に届く早生を五銘柄並べます。",
    lede: "食味ランキングの前に、刈り入れの早い銘柄から手に取る読み方です。",
    dateLabel: "2026年10月12日 22時08分",
    months: [10, 11],
    riceIds: [
      "hazuki-minori",
      "hanaechizen",
      "yumemizuho",
      "fusaotome",
      "koshiibuki",
    ],
    artFile: "jugatsu-wase.webp",
    body: [
      "十月の店頭では、極早生や早生の令和8年産が先に袋になります。中生の主産地はこれから本格的に並び、食味ランキングは来年2月です。年産の優劣を決めつける時期ではありません。",
      "並べたのは、刈り入れの早い五本です。袋の年産表記を確認してから、事典のメモと照らし合わせると、今年の入り口がつかみやすいです。",
    ],
  },
  {
    slug: "shio-musubi",
    title: "塩むすびで、味を見る",
    dek: "具もタレも足さない日に、米そのものの甘みと粒を確かめます。",
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
      "五本とも、塩だけで握って差が出る銘柄です。まず塩で食べてから、事典のメモを読むと、選び方がつかみやすいです。",
    ],
  },
  {
    slug: "bento-cold",
    title: "冷めても、弁当に",
    dek: "昼の弁当箱で、粒がばらけすぎない米を集めました。",
    lede: "朝に炊いて、昼に蓋を開ける日のための読みどころです。",
    dateLabel: "2026年9月2日 0時02分",
    months: [4, 5, 6, 7, 8, 9],
    riceIds: ["nanatsuboshi", "haenuki", "hitomebore", "milky-queen", "sasanishiki"],
    artFile: "bento.webp",
    body: [
      "朝に炊いて、昼に蓋を開ける。そのあいだに粒が固まらず、かといって水っぽくならない米があります。",
      "冷めたときの粒立ちを目安に集めました。",
    ],
    riceNotes: {
      sasanishiki:
        "冷めても粒立ちと風味が残る、駅弁の時代からの顔。粒の固まりにくさでは、上の四本に譲ります。",
    },
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
          "全国のスーパーでの平均販売価格は、10月19日〜25日の週で5kgあたり2,788円（税込）でした。全国約1,000店のPOSデータによる平均で、この価格は毎週公表され、週ごとに変わります。前の週より33円安く、値下がりは11週続いています。前年の同じ時期より1,420円安くなっています。銘柄米（販売数量の83%）は5kgあたり2,811円で前の週より61円安く、ブレンド米など（17%）は2,678円で69円高くなっています。（出典：農林水産省「[スーパーでの販売数量・価格の推移](https://www.maff.go.jp/j/nousan/kokumotu/ksppos.pdf)」2026年10月30日）",
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
      tsuyahime: "村山・置賜産が3年続けて特A。炊き上がりの白さとつやを新米で。",
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
      "haenuki",
      "yukiwakamaru",
      "sagabiyori",
      "tsuyahime",
      "koshihikari-uonuma",
      "akitakomachi",
      "nijinokirameki",
      "yumepirika",
    ],
    artFile: "nabe.webp",
    body: [
      "鍋のあとの雑炊や、取り分けた具をごはんにのせる日。汁を吸ってもべちゃっとしにくい、粒のしっかりした銘柄を中心に選びました。甘みの強い銘柄とすっきりした銘柄を両方置いているので、寄せ鍋やキムチ鍋など、その日の味の濃さで選んでください。",
    ],
    riceNotes: {
      nijinokirameki:
        "大粒で粒の輪郭がはっきりした新しい品種。鍋の具をのせても、ご飯の存在感が負けません。",
      yumepirika:
        "いちばん粘りの強い一本。鍋そのものより、締めの雑炊で甘みを楽しむ役回りです。",
    },
  },
  {
    slug: "toku-a",
    title: "特Aの一膳",
    dek: "日本穀物検定協会の食味ランキング。令和7年産で特Aだった銘柄から、五銘柄を並べます。",
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
      "令和7年産は、2026年2月27日に公表されました。令和8年産の結果は、例年どおりなら2027年2月の公表です。ここでは令和7年産で特Aだった銘柄から、産地の違う五銘柄を並べています。",
      "北海道のゆめぴりか、津軽で特Aに戻った青天の霹靂、山形のつや姫、魚沼のコシヒカリ、佐賀のさがびよりです。同じ特Aでも、甘みと粒の感触は違います。",
    ],
  },
  {
    slug: "furusato-nozei",
    title: "ふるさと納税で、産地の米を選ぶ",
    dek: "寄附の返礼品として米を受け取るなら。産地、すなわち寄附先の自治体で絞り、銘柄の味わいで選ぶための特集です。",
    lede: "米は返礼品で最も選ばれる品目の一つです。産地の顔の銘柄を、味わいの違いと一緒に並べました。",
    dateLabel: "2026年11月6日 7時44分",
    months: [11, 12],
    riceIds: [
      "yumepirika",
      "seiten-no-hekireki",
      "ginga-no-shizuku",
      "akitakomachi",
      "tsuyahime",
      "shinnosuke",
      "ichihomare",
      "mori-no-kumasan",
    ],
    artFile: null,
    body: [
      "ふるさと納税の返礼品で、米は単品でいちばん選ばれている品目です。毎日食べるものだから無駄がなく、寄附先の自治体がそのまま産地になるので、選び方の軸がはっきりしています。ここでは産地の顔と言える銘柄を、北から南へ並べました。",
      "寄附額は1万円前後からが多いです。返礼品は寄附額の3割以下と決まっているため、届く量は自治体と年度で変わります。同じ銘柄でも、量・精米の有無・定期便の有無は自治体ごとに違うので、銘柄ページの「お店で探す」にある「ふるさと納税」のタブで見比べられます。その年の控除に使う寄附は、12月31日までに完了させる必要があります。",
    ],
    sections: [
      {
        heading: "選ぶときの目安",
        items: [
          "産地で絞る：寄附先は、米の産地の自治体です。応援したい産地があるなら、そこから選ぶのが寄附の考え方に沿った選び方です。",
          "量で選ぶ：5kg・10kg・20kgで寄附額が変わります。食べきれる量で選んでください。定期便なら、少しずつ分けて届きます。",
          "味で選ぶ：粘りの強い銘柄と粒立ちの銘柄では、合う献立が違います。味わいの地図と合わせて見ると外れにくいです。",
          "県から探す：[産地から選ぶ](/prefectures)では、県ごとの銘柄と味わいの平均をまとめています。",
          "締切：年末は申込みが集中します。手続きは早めに済ませてください。",
        ],
      },
    ],
    riceNotes: {
      yumepirika:
        "北海道の顔。粘りと甘みがいちばん前に出る一本で、返礼品でも定番の位置にいます。",
      "seiten-no-hekireki":
        "青森の粒立ち系。甘さ控えめで、食事の邪魔をしない返し方をします。",
      "ginga-no-shizuku":
        "岩手の新顔。粒の張りと、すっきりした甘みの組み合わせです。",
      akitakomachi:
        "秋田の定番。粘りと甘みのバランス型で、毎日の常備に向きます。",
      tsuyahime:
        "山形の艶と甘み。冷めても味が落ちにくく、弁当にも回せます。",
      shinnosuke:
        "新潟の大粒系。粒そのものを楽しむ食べ方に向きます。",
      ichihomare:
        "福井の粘り系。甘みが前に出る、もちっとした食感です。",
      "mori-no-kumasan":
        "熊本の顔。粘りと甘みの九州らしい組み合わせです。",
    },
  },
];
