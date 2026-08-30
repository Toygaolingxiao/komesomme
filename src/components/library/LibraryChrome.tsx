import { SiteHeader } from "@/components/SiteHeader";

/** Library pages share the same header chrome as home. */
export function LibraryChrome({ subtitle = "銘柄ライブラリ" }: { subtitle?: string }) {
  return <SiteHeader active="library" subtitle={subtitle} />;
}
