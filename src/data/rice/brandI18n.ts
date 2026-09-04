/**
 * Guest-facing Chinese / English names for catalog brands.
 * Japanese `name` on the profile stays canonical. These are for search, 事典
 * subtitles, and consultation aliases — not a second encyclopedia.
 */
export type BrandI18n = {
  zh: string;
  en: string;
  /** Extra spellings (typos, 晴 vs 青, pinyin). zh and en are already searched. */
  aliases?: string[];
};

export const BRAND_I18N: Record<string, BrandI18n> = {
  "aichi-no-kaori": { zh: "爱知之香", en: "Aichi no Kaori" },
  akisakari: { zh: "秋盛", en: "Akisakari" },
  akitakomachi: { zh: "秋田小町", en: "Akitakomachi", aliases: ["秋田小町米"] },
  akihonami: { zh: "秋穗波", en: "Akihonami" },
  akiroman: { zh: "秋浪漫", en: "Akiroman" },
  akebono: { zh: "曙", en: "Akebono" },
  "asahi-no-yume": { zh: "朝日之梦", en: "Asahi no Yume" },
  ichihomare: { zh: "一誉", en: "Ichihomare" },
  "inochi-no-ichi": { zh: "生命之一", en: "Inochi no Ichi" },
  iwatekko: { zh: "岩手之子", en: "Iwatekko" },
  emihokoro: { zh: "笑绽", en: "Emihokoro" },
  oidemai: { zh: "请来米", en: "Oidemai" },
  oborozuki: { zh: "朦月", en: "Oborozuki" },
  kitakurin: { zh: "北光", en: "Kitakurin" },
  kinuhikari: { zh: "绢光", en: "Kinuhikari" },
  kinumusume: { zh: "绢娘", en: "Kinumusume" },
  kirara397: { zh: "绮罗拉397", en: "Kirara 397", aliases: ["きらら", "Kirara"] },
  "kumasan-no-kagayaki": { zh: "熊先生的光辉", en: "Kumasan no Kagayaki" },
  "kumasan-no-chikara": { zh: "熊先生的力量", en: "Kumasan no Chikara" },
  koshiibuki: { zh: "越息吹", en: "Koshiibuki" },
  "koshihikari-bl": { zh: "越光", en: "Koshihikari", aliases: ["こしひかり", "Koshi Hikari"] },
  "koshihikari-uonuma": {
    zh: "鱼沼越光",
    en: "Uonuma Koshihikari",
    aliases: ["鱼沼产越光", "魚沼コシヒカリ"],
  },
  "koshihikari-sado": { zh: "佐渡越光", en: "Sado Koshihikari", aliases: ["佐渡产越光"] },
  goropikari: { zh: "五郎光", en: "Goropikari" },
  sagabiyori: { zh: "佐贺日和", en: "Sagabiyori", aliases: ["佐贺好日"] },
  sakihokore: { zh: "先秀", en: "Sakihokore", aliases: ["咲穗"] },
  sasanishiki: { zh: "笹锦", en: "Sasanishiki" },
  "date-masayume": { zh: "伊达正梦", en: "Date Masayume" },
  "tsugaru-roman": { zh: "津轻浪漫", en: "Tsugaru Roman" },
  tsukiakari: { zh: "月明", en: "Tsukiakari" },
  tsubuzoroi: { zh: "粒齐", en: "Tsubuzoroi" },
  tsuyahime: { zh: "光姬", en: "Tsuyahime", aliases: ["艳姬", "つや姫"] },
  tenkomori: { zh: "天满盛", en: "Tenkomori" },
  tentakaku: { zh: "天高", en: "Tentakaku" },
  "tochigi-no-hoshi": { zh: "栃木之星", en: "Tochigi no Hoshi" },
  nasuhikari: { zh: "那须光", en: "Nasuhikari" },
  natsuhonoka: { zh: "夏穗香", en: "Natsuhonoka" },
  nanatsuboshi: { zh: "七星", en: "Nanatsuboshi", aliases: ["ななつぼし"] },
  nikomaru: { zh: "笑满", en: "Nikomaru" },
  nijinokirameki: { zh: "虹之闪耀", en: "Niji no Kirameki" },
  haenuki: { zh: "羽贯", en: "Haenuki" },
  hatsushimo: { zh: "初霜", en: "Hatsushimo" },
  hanaechizen: { zh: "花越前", en: "Hanaechizen" },
  harumi: { zh: "晴实", en: "Harumi" },
  pikamaru: { zh: "闪光丸", en: "Pikamaru" },
  "hikari-shinseiki": { zh: "光新世纪", en: "Hikari Shinseiki" },
  hitomebore: { zh: "一目倾心", en: "Hitomebore", aliases: ["一目惚れ"] },
  hinohikari: { zh: "日之光", en: "Hinohikari" },
  himenorin: { zh: "姬之凛", en: "Himenorin" },
  hyakumangoku: { zh: "百万石", en: "Hyakumangoku" },
  fukuhibiki: { zh: "福响", en: "Fukuhibiki" },
  fukumaru: { zh: "福丸", en: "Fukumaru" },
  fusaotome: { zh: "总乙女", en: "Fusaotome" },
  fusakogane: { zh: "总黄金", en: "Fusakogane" },
  fukkurinko: { zh: "福克林可", en: "Fukkurinko" },
  hoshijirushi: { zh: "星印", en: "Hoshijirushi" },
  hoshinoyume: { zh: "星之梦", en: "Hoshinoyume" },
  masshigura: { zh: "一路向前", en: "Masshigura", aliases: ["まっしぐら"] },
  manamusume: { zh: "爱女", en: "Manamusume" },
  "mie-no-yume": { zh: "三重之梦", en: "Mie no Yume" },
  mizukagami: { zh: "水镜", en: "Mizukagami" },
  mizuhonokagayaki: { zh: "瑞穗之光", en: "Mizuho no Kagayaki" },
  mineasahi: { zh: "峰朝日", en: "Mineasahi" },
  "milky-queen": { zh: "牛奶皇后", en: "Milky Queen", aliases: ["ミルキークイーン"] },
  "milky-princess": { zh: "牛奶公主", en: "Milky Princess" },
  menkoina: { zh: "萌恋", en: "Menkoina" },
  yudai21: { zh: "雄大21", en: "Yudai 21" },
  yukisayaka: { zh: "雪清香", en: "Yukisayaka" },
  "yukinko-mai": { zh: "雪之子舞", en: "Yukinko Mai" },
  yumeobako: { zh: "梦姨", en: "Yumeobako" },
  yumepirika: { zh: "梦美香", en: "Yumepirika", aliases: ["梦比利卡", "ゆめぴりか"] },
  yumemizuho: { zh: "梦瑞穗", en: "Yumemizuho" },
  "yosakoi-bijin": { zh: "夜来恋美人", en: "Yosakoi Bijin" },
  "ai-hitotsubu": { zh: "爱之一粒", en: "Ai Hitotsubu" },
  ichibanboshi: { zh: "一等星", en: "Ichibanboshi" },
  kyoshikibu: { zh: "京式部", en: "Kyoshikibu" },
  kinnoibuki: { zh: "金之息吹", en: "Kin no Ibuki" },
  "konjiki-no-kaze": { zh: "金色之风", en: "Konjiki no Kaze" },
  "gin-no-mikazuki": { zh: "银之眉月", en: "Gin no Mikazuki" },
  "ginga-no-shizuku": { zh: "银河之滴", en: "Ginga no Shizuku" },
  "musubi-no-kami": { zh: "结之神", en: "Musubi no Kami" },
  "genki-tsukushi": { zh: "元气体贴", en: "Genki Tsukushi" },
  "sai-no-kagayaki": { zh: "彩之光辉", en: "Sai no Kagayaki" },
  "sai-no-kizuna": { zh: "彩之绊", en: "Sai no Kizuna" },
  shinnosuke: { zh: "新之助", en: "Shinnosuke" },
  "mori-no-kumasan": { zh: "森林熊先生", en: "Mori no Kumasan" },
  nitamai: { zh: "仁多米", en: "Nitamai" },
  hoshizoramai: { zh: "星空舞", en: "Hoshizoramai" },
  "seiten-no-hekireki": {
    zh: "青天之霹雳",
    en: "Seiten no Hekireki",
    aliases: [
      "晴天的霹雳",
      "青天的霹雳",
      "晴天之霹雳",
      "青天霹雳",
      "晴天霹雳",
      "せいてんのへきれき",
      "Seiten-no-Hekireki",
    ],
  },
  yukihotaka: { zh: "雪穗高", en: "Yukihotaka" },
  yukiwakamaru: { zh: "雪若丸", en: "Yukiwakamaru" },
  "daichi-no-hoshi": { zh: "大地之星", en: "Daichi no Hoshi" },
  "ten-no-tsubu": { zh: "天之粒", en: "Ten no Tsubu" },
  norin48: { zh: "农林48号", en: "Norin 48" },
  fufufu: { zh: "富富富", en: "Fufufu" },
  kazesayaka: { zh: "风清香", en: "Kazesayaka" },
  "fuku-warai": { zh: "福笑", en: "Fuku Warai" },
  moeminori: { zh: "萌实", en: "Moeminori" },
  yumegokochi: { zh: "梦心地", en: "Yumegokochi" },
  "yume-shizuku": { zh: "梦之滴", en: "Yume Shizuku" },
  "yume-tsukushi": { zh: "梦体贴", en: "Yume Tsukushi" },
  "hazuki-minori": { zh: "叶月实", en: "Hazuki Minori" },
  "satoyama-no-tsubu": { zh: "里山之粒", en: "Satoyama no Tsubu" },
  tsubusuke: { zh: "粒助", en: "Tsubusuke" },
  "ryu-no-hitomi": { zh: "龙之瞳", en: "Ryu no Hitomi", aliases: ["いのちの壱"] },
  "koi-no-yokan": { zh: "恋之预感", en: "Koi no Yokan" },
};

export function brandI18nOf(id: string): BrandI18n | undefined {
  return BRAND_I18N[id];
}

export function brandI18nLine(id: string): string | null {
  const row = BRAND_I18N[id];
  if (!row) return null;
  return `${row.zh} · ${row.en}`;
}

export function brandI18nSearchBlob(id: string): string {
  const row = BRAND_I18N[id];
  if (!row) return "";
  return [row.zh, row.en, ...(row.aliases ?? [])].join(" ");
}
