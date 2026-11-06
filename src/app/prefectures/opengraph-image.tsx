import { ImageResponse } from "next/og";
import { loadOgFonts } from "@/lib/og/fonts";
import {
  OG_SIZE,
  PREFECTURES_WITH_BRANDS,
  PrefectureOgCard,
} from "@/lib/og/prefectureCard";

export const alt = "KomeSomme 産地から選ぶ";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function PrefecturesOpenGraphImage() {
  const fonts = await loadOgFonts();
  return new ImageResponse(
    (
      <PrefectureOgCard
        eyebrow="KomeSomme · 産地"
        title="産地から選ぶ"
        dek={`日本地図から都道府県を選んで、その土地の銘柄へ。銘柄のある${PREFECTURES_WITH_BRANDS}県には、産地ページがあります。`}
        highlight={null}
      />
    ),
    { ...size, fonts }
  );
}
