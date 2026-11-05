import type { Metadata } from "next";
import Image from "next/image";
import { TransitionLink } from "@/components/editorial/TransitionLink";
import { Breadcrumbs } from "@/components/nav/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { FOCUS } from "@/components/matrix/shared";
import { PAGE_TITLE, READING_COLUMN, SITE_COLUMN } from "@/components/siteChrome";
import { prefectureArtPath } from "@/data/editorial/prefectureArt";
import {
  PREFECTURE_PAGES,
  prefecturesByRegion,
} from "@/lib/editorial/prefectures";
import { breadcrumbListLd, itemListLd } from "@/lib/seo/jsonLd";

const DESCRIPTION = `銘柄が3つ以上ある${PREFECTURE_PAGES.length}の産地について、銘柄の一覧と味わいの平均像をまとめました。産地は、ふるさと納税の寄附先でもあります。`;

export const metadata: Metadata = {
  title: "産地から選ぶ｜都道府県別の米と銘柄",
  description: DESCRIPTION,
  alternates: { canonical: "/prefectures" },
  openGraph: {
    title: "産地から選ぶ｜都道府県別の米と銘柄",
    description: DESCRIPTION,
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "産地から選ぶ｜都道府県別の米と銘柄",
    description: DESCRIPTION,
  },
};

const TRAIL = [
  { name: "トップ", path: "/" },
  { name: "産地から選ぶ", path: "/prefectures" },
];

export default function PrefecturesIndexPage() {
  const groups = prefecturesByRegion();

  return (
    <main className="min-h-[100dvh] w-full min-w-0 text-[var(--km-ink)]">
      <JsonLd
        data={[
          breadcrumbListLd(TRAIL),
          itemListLd({
            name: "産地から選ぶ",
            items: PREFECTURE_PAGES.map((page) => ({
              name: `${page.prefecture}の米`,
              path: `/prefectures/${page.slug}`,
            })),
          }),
        ]}
      />
      <SiteHeader active="library" />
      <div className={`${SITE_COLUMN} pt-5`}>
        <Breadcrumbs className={READING_COLUMN} crumbs={TRAIL} />
      </div>

      <div className={`${SITE_COLUMN} pt-4`}>
        <header className={READING_COLUMN}>
          <h1 className={PAGE_TITLE}>産地から選ぶ</h1>
          <p className="mt-3 text-[15px] leading-relaxed text-[var(--km-ink-soft)]">
            {DESCRIPTION}
            地域ごとに、その土地の銘柄と味わいの傾向を並べました。
          </p>
        </header>
      </div>

      <div className={`${SITE_COLUMN} pb-20`}>
        {groups.map((group) => (
          <section key={group.region} className="mt-12">
            <h2 className="font-serif text-[1.25rem] font-semibold tracking-tight text-[var(--km-ink)]">
              {group.region}
            </h2>
            <ol className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {group.pages.map((page) => (
                <li key={page.slug}>
                  <TransitionLink
                    href={`/prefectures/${page.slug}`}
                    className={`group flex items-center gap-4 rounded-xl border border-[var(--km-border)] bg-[var(--km-surface)] p-3 transition hover:bg-[var(--km-surface-warm)] ${FOCUS}`}
                  >
                    <span className="relative block aspect-[4/5] w-16 shrink-0 overflow-hidden rounded-lg">
                      <Image
                        src={prefectureArtPath(page.slug)}
                        alt={`${page.prefecture}の産地`}
                        fill
                        sizes="4rem"
                        className="object-cover"
                      />
                    </span>
                    <span className="min-w-0">
                      <span className="block font-serif text-[1.15rem] font-semibold tracking-tight text-[var(--km-ink)] group-hover:text-[var(--km-brown)]">
                        {page.prefecture}
                        <span className="ml-2 text-[12px] font-normal text-[var(--km-muted)]">
                          {page.brands.length}銘柄
                        </span>
                      </span>
                      <span className="mt-1 line-clamp-2 block text-[13px] leading-relaxed text-[var(--km-ink-soft)]">
                        {page.brands
                          .slice(0, 3)
                          .map((brand) => brand.name)
                          .join("、")}
                        など
                      </span>
                    </span>
                  </TransitionLink>
                </li>
              ))}
            </ol>
          </section>
        ))}
      </div>

      <SiteFooter />
    </main>
  );
}
