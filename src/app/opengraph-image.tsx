import { renderHomeBannerImage } from "@/lib/og/homeBanner";

export const alt = "KomeSomme | 侍米師（じべいし）";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return renderHomeBannerImage();
}
