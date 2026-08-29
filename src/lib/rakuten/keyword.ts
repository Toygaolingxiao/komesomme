import type { RiceProfileV2 } from "@/types/rice"

export function riceRakutenKeyword(
  rice: Pick<RiceProfileV2, "name" | "rakuten_search_keyword" | "amazon_search_keyword">
): string {
  return (
    rice.rakuten_search_keyword?.trim() ||
    rice.amazon_search_keyword?.trim() ||
    `${rice.name} 白米 5kg`
  )
}
