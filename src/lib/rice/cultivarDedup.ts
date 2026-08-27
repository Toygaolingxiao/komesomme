import type { RiceProfileV2 } from "@/types/rice";

/**
 * Two-layer catalogue identity for the tasting map and vector search.
 *
 * 1. Cultivar merge: prefecture-only or SKU-only variants of the same variety
 *    (特選 / ゴールド / 県名違いで数値がほぼ同じ) collapse to one row.
 * 2. Premium GI / 特A keep: 魚沼・佐渡・仁多 (and 龍の瞳 as the branded いのちの壱)
 *    keep independent IDs so they do not fight the generic parent in ranking.
 *
 * `backup_riceP.ts` is the hand archive; this module is what the running
 * catalogue and `seed:rice` actually consume.
 */

export type CultivarIdentity = {
  cultivar: string;
  branch: string;
  /** Shop blends and non-cultivar SKUs are dropped from the matrix. */
  drop?: boolean;
};

const SKU_MARKERS =
  /特選|特別栽培|厳選特選版|厳選米|厳選|極上選抜|極上|極み|ゴールドプレミアム|ゴールド|最高峰版|一般栽培版/g;

function kebab(id: string): string {
  return id.replace(/_/g, "-").toLowerCase();
}

function stripDecorators(name: string): string {
  return name
    .normalize("NFKC")
    .replace(/[（(][^）)]*[）)]/g, "")
    .replace(/[／/].*$/, "")
    .replace(SKU_MARKERS, "")
    .replace(
      /^(北海道|(?:青森|岩手|宮城|秋田|山形|福島|茨城|栃木|群馬|埼玉|千葉|神奈川|新潟|富山|石川|福井|山梨|長野|岐阜|静岡|愛知|三重|滋賀|京都|大阪|兵庫|奈良|和歌山|鳥取|島根|岡山|広島|山口|徳島|香川|愛媛|高知|福岡|佐賀|長崎|熊本|大分|宮崎|鹿児島|沖縄)県|東京都|大阪府|京都府)産/,
      ""
    )
    .replace(/\s+/g, "")
    .trim();
}

export function identityOf(rice: Pick<RiceProfileV2, "id" | "name">): CultivarIdentity {
  const blob = `${rice.id} ${rice.name}`;
  const stripped = stripDecorators(rice.name);

  if (/どんち/.test(blob)) {
    return { cultivar: "どんち", branch: "blend", drop: true };
  }
  if (/晴の日|はるのひ/.test(blob) && /厳選/.test(blob)) {
    return { cultivar: "晴の日", branch: "shop", drop: true };
  }

  if (/魚沼|南魚沼|塩沢/.test(blob) && /コシヒカリ|koshihikari|koshikari/.test(blob)) {
    return { cultivar: "コシヒカリ", branch: "uonuma" };
  }
  if (/佐渡/.test(blob) && /コシヒカリ|koshihikari/.test(blob)) {
    return { cultivar: "コシヒカリ", branch: "sado" };
  }
  if (/仁多|奥出雲|nitamai/.test(blob)) {
    return { cultivar: "コシヒカリ", branch: "nita" };
  }
  if (/龍の瞳|ryu-no-hitomi|ryunohitomi|dragon.eye|dragon_eye/.test(blob)) {
    return { cultivar: "いのちの壱", branch: "tatsunohitomi" };
  }
  if (/いのちの壱|inochi/.test(blob)) {
    return { cultivar: "いのちの壱", branch: "generic" };
  }
  if (
    /コシヒカリ|koshihikari/.test(blob) &&
    !/こしいぶき/.test(stripped)
  ) {
    return { cultivar: "コシヒカリ", branch: "generic" };
  }

  return {
    cultivar: stripped || rice.name,
    branch: "generic",
  };
}

export function identityKey(identity: CultivarIdentity): string {
  return `${identity.cultivar}::${identity.branch}`;
}

const CANONICAL: Record<
  string,
  {
    id: string;
    name: string;
    prefecture?: string;
    region?: RiceProfileV2["region"];
    notes: string;
  }
> = {
  "コシヒカリ::generic": {
    id: "koshihikari-bl",
    name: "コシヒカリ",
    prefecture: "新潟県",
    region: "関東・甲信越",
    notes:
      "全国で作付けされるコシヒカリ。県名違いで食味数値がほぼ同じ行は統合した。魚沼・佐渡・仁多は産地銘柄として別ID。",
  },
  "コシヒカリ::uonuma": {
    id: "koshihikari-uonuma",
    name: "コシヒカリ（魚沼産）",
    prefecture: "新潟県",
    region: "関東・甲信越",
    notes:
      "コシヒカリの産地銘柄。魚沼（南魚沼・塩沢を含む）の水質と昼夜の寒暖差による一膳。特選・ゴールド等のSKUはここに統合。",
  },
  "コシヒカリ::sado": {
    id: "koshihikari-sado",
    name: "コシヒカリ（佐渡産）",
    prefecture: "新潟県",
    region: "関東・甲信越",
    notes:
      "コシヒカリの産地銘柄。佐渡の海風と棚田の寒暖差による、魚沼とは別の一膳。",
  },
  "コシヒカリ::nita": {
    id: "nitamai",
    name: "仁多米",
    prefecture: "島根県",
    region: "中国・四国",
    notes:
      "コシヒカリの産地銘柄。奥出雲・仁多の水と寒暖差で流通上独立した一膳。",
  },
  "いのちの壱::tatsunohitomi": {
    id: "ryu-no-hitomi",
    name: "龍の瞳（いのちの壱）",
    prefecture: "岐阜県",
    region: "東海・北陸",
    notes:
      "いのちの壱の商標銘柄。一般栽培のいのちの壱とは別ID。",
  },
  "いのちの壱::generic": {
    id: "inochi-no-ichi",
    name: "いのちの壱",
    prefecture: "岐阜県",
    region: "東海・北陸",
    notes:
      "いのちの壱の一般栽培。龍の瞳は商標銘柄として別ID。",
  },
};

function rankMember(rice: RiceProfileV2, preferredId?: string): number {
  let rank = 0;
  if (preferredId && kebab(rice.id) === preferredId) rank += 100;
  if (!SKU_MARKERS.test(rice.name)) rank += 20;
  if (/^[a-z0-9-]+$/.test(rice.id)) rank += 5;
  rank += Math.min(rice.description.length, 80) / 80;
  return rank;
}

/**
 * Collapse SKU / prefecture clones. Premium GI branches stay as their own row.
 */
export function dedupeRiceCatalogue(profiles: RiceProfileV2[]): RiceProfileV2[] {
  const groups = new Map<string, RiceProfileV2[]>();
  const dropped: RiceProfileV2[] = [];

  for (const rice of profiles) {
    const identity = identityOf(rice);
    if (identity.drop) {
      dropped.push(rice);
      continue;
    }
    const key = identityKey(identity);
    const list = groups.get(key) ?? [];
    list.push(rice);
    groups.set(key, list);
  }

  const result: RiceProfileV2[] = [];
  const usedIds = new Set<string>();

  for (const [key, members] of groups) {
    const canonical = CANONICAL[key];
    const sorted = [...members].sort(
      (a, b) => rankMember(b, canonical?.id) - rankMember(a, canonical?.id)
    );
    const winner: RiceProfileV2 = { ...sorted[0] };

    if (canonical) {
      winner.id = canonical.id;
      winner.name = canonical.name;
      if (canonical.prefecture) winner.prefecture = canonical.prefecture;
      if (canonical.region) winner.region = canonical.region;
      winner.curation_notes = canonical.notes;
    } else if (members.length > 1) {
      winner.name = stripDecorators(winner.name) || winner.name;
      winner.curation_notes = `${winner.name}の県名・SKU違いは食味がほぼ同じため統合した。`;
    }

    winner.id = kebab(winner.id);
    if (usedIds.has(winner.id)) {
      winner.id = `${winner.id}-${winner.prefecture.replace(/県|都|府|全国.*/g, "") || "alt"}`
        .replace(/\s+/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, "");
    }
    usedIds.add(winner.id);
    result.push(winner);
  }

  return result.sort((a, b) => a.name.localeCompare(b.name, "ja"));
}
