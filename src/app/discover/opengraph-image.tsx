import { renderHomeBannerImage } from "@/lib/og/homeBanner";

export const alt = "KomeSomme | ピックアップ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Same watercolor bowl card as the homepage, at 1200×630. */
export default function DiscoverOpenGraphImage() {
  return renderHomeBannerImage();
}
