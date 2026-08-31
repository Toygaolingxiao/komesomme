import type { RiceProfileV2 } from "@/types/rice";

function join(values?: string[]) {
  return values && values.length > 0 ? values.join("、") : "";
}

/** Drops lines whose value part is empty so no "合う料理：" stubs reach the embedding. */
function line(label: string, value: string) {
  return value.trim() ? `${label}${value}` : "";
}

/**
 * Builds the retrieval text for a rice profile.
 *
 * Written as natural Japanese sentences rather than a stringified JSON blob: the
 * embedding has to match free-form consultation text like "ハイボールと唐揚げに合う米",
 * so field names and punctuation noise would only dilute the vector.
 */
export function buildRiceSearchText(rice: RiceProfileV2): string {
  return [
    `${rice.name}は${rice.prefecture}の米です。`,
    line("地域分類は", rice.region ? `${rice.region}です。` : ""),
    line("味わいは", rice.quadrant ? `${rice.quadrant}。` : ""),
    rice.texture_label && rice.sweetness_label
      ? `食感は${rice.texture_label}、甘みは${rice.sweetness_label}。`
      : "",
    line("特徴：", rice.short_),
    line("説明：", rice.description),
    line("侍米師メモ：", rice.sommelier_note),
    line("相性の理由：", rice.pairing_reason),
    line("位置づけ：", rice.curation_notes ?? ""),

    line("合う料理：", join(rice.best_match_dishes)),
    line("相性のよい食材：", join(rice.good_with)),
    line("避けたい組み合わせ：", join(rice.avoid_pairings)),

    line("春のおすすめ：", join(rice.spring_pairings)),
    line("夏のおすすめ：", join(rice.summer_pairings)),
    line("秋のおすすめ：", join(rice.autumn_pairings)),
    line("冬のおすすめ：", join(rice.winter_pairings)),

    line("日本酒との相性：", join(rice.sake_pairings)),
    line("ビールとの相性：", join(rice.beer_pairings)),
    line("ワインとの相性：", join(rice.wine_pairings)),
    line("ウイスキーとの相性：", join(rice.whisky_pairings)),
    line("お茶との相性：", join(rice.tea_pairings)),

    line("気分：", join(rice.mood_pairings)),
    line("場面：", join(rice.occasion_pairings)),
    line("生活シーン：", join(rice.lifestyle_scenes)),

    line("タグ：", join(rice.semantic_tags)),
    line("検索意図：", join(rice.search_queries)),
  ]
    .filter(Boolean)
    .join("\n");
}
