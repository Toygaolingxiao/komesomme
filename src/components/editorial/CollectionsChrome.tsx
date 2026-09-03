import { SiteHeader } from "@/components/SiteHeader";

/** Shared chrome for /collections/[slug] — nav highlights ピックアップ. */
export function CollectionsChrome() {
  return <SiteHeader active="discover" />;
}
