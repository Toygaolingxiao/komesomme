import type { Metadata } from "next";
import Image from "next/image";
import { BowlMark } from "@/components/brand/EditorialMarks";
import { PageMasthead } from "@/components/editorial/PageMasthead";
import { TransitionLink } from "@/components/editorial/TransitionLink";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { FOCUS } from "@/components/matrix/shared";
import { SITE_COLUMN } from "@/components/siteChrome";
import { prefectureArtPath } from "@/data/editorial/prefectureArt";
import { PrefectureMap } from "@/components/editorial/PrefectureMap";
import {
  PREFECTURE_PAGES,
  prefectureMapSummaries,
  prefecturesByRegion,
  prefecturesWithFewBrands,
} from "@/lib/editorial/prefectures";
import { breadcrumbListLd, itemListLd } from "@/lib/seo/jsonLd";

const DESCRIPTION = `銘柄が3つ以上ある${PREFECTURE_PAGES.length}の産地について、銘柄の一覧と味わいの平均像をまとめました。銘柄の少ない産地も含め、記録のある産地はすべて並べています。産地は、ふるさと納税の寄附先でもあります。`;

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
  const fewGroups = prefecturesWithFewBrands();

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
      <SiteHeader active="prefectures" />
      <PageMasthead
        crumbs={TRAIL}
        mark={<BowlMark className="h-8 w-8" />}
        title="産地から選ぶ"
        lede={`${DESCRIPTION}地域ごとに、その土地の銘柄と味わいの傾向を並べました。`}
        art={null}
      />

      <div className={SITE_COLUMN}>
        <div className="mt-8">
          <PrefectureMap summaries={prefectureMapSummaries()} />
        </div>
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
                        {page.brands.length > 3 ? "など" : ""}
                      </span>
                    </span>
                  </TransitionLink>
                </li>
              ))}
            </ol>
          </section>
        ))}

        <section className="mt-16">
          <h2 className="font-serif text-[1.25rem] font-semibold tracking-tight text-[var(--km-ink)]">
            銘柄の少ない産地
          </h2>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-[var(--km-muted)]">
            まだ銘柄が1〜2つの産地です。専用ページはありませんが、記録のある銘柄から辿れます。
          </p>
          {fewGroups.map((group) => (
            <div key={group.region} className="mt-8">
              <h3 className="text-[13px] font-semibold tracking-wide text-[var(--km-brown)]">
                {group.region}
              </h3>
              <ul className="mt-3 divide-y divide-[var(--km-border)] border-y border-[var(--km-border)]">
                {group.prefectures.map((mini) => (
                  <li
                    key={mini.prefecture}
                    className="flex flex-wrap items-baseline gap-x-3 gap-y-1 py-2.5"
                  >
                    <span className="font-serif text-[15px] font-semibold text-[var(--km-ink)]">
                      {mini.prefecture}
                      <span className="ml-2 text-[12px] font-normal text-[var(--km-muted)]">
                        {mini.brands.length}銘柄
                      </span>
                    </span>
                    <span className="text-[13px] leading-relaxed text-[var(--km-ink-soft)]">
                      {mini.brands.map((brand, index) => (
                        <span key={brand.id}>
                          {index > 0 ? "、" : ""}
                          <TransitionLink
                            href={`/library/${brand.id}`}
                            className={`underline decoration-[var(--km-border)] underline-offset-4 transition hover:text-[var(--km-brown)] ${FOCUS}`}
                          >
                            {brand.name}
                          </TransitionLink>
                        </span>
                      ))}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </section>
      </div>

      <SiteFooter />
    </main>
  );
}
