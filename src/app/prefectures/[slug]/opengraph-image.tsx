import { ImageResponse } from "next/og";
import { loadOgFonts } from "@/lib/og/fonts";
import { OG_SIZE, PrefectureOgCard } from "@/lib/og/prefectureCard";
import {
  PREFECTURE_PAGES,
  prefectureBySlug,
} from "@/lib/editorial/prefectures";

export const alt = "KomeSomme 産地ページ";
export const size = OG_SIZE;
export const contentType = "image/png";

export function generateStaticParams() {
  return PREFECTURE_PAGES.map((page) => ({ slug: page.slug }));
}

export default async function PrefectureOpenGraphImage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const page = prefectureBySlug(slug);
  const fonts = await loadOgFonts();

  const title = page ? `${page.prefecture}の米` : "産地から選ぶ";
  const dek = page
    ? `${page.region} · 銘柄は${page.brands.length}つ。その土地の銘柄の一覧と、味わいの傾向をまとめました。`
    : "日本地図から都道府県を選んで、その土地の銘柄へ。";

  return new ImageResponse(
    (
      <PrefectureOgCard
        eyebrow="KomeSomme · 産地から選ぶ"
        title={title}
        dek={dek}
        highlight={page ? page.prefecture : null}
      />
    ),
    { ...size, fonts }
  );
}
