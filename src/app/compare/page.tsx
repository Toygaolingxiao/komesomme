import { Suspense } from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { BowlMark } from "@/components/brand/EditorialMarks";
import { PageMasthead } from "@/components/editorial/PageMasthead";
import { SiteHeader } from "@/components/SiteHeader";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_COLUMN } from "@/components/siteChrome";
import { FOCUS } from "@/components/matrix/shared";
import { FreeCompare } from "@/components/compare/FreeCompare";
import { GrainMark } from "@/components/compare/GrainMark";
import { freeCompareDataset } from "@/lib/editorial/freeCompare";
import { regionColor } from "@/lib/rice/regions";
import {
  COMPARISON_INDICATORS,
  allResolvedComparisons,
} from "@/lib/editorial/comparisons";
import { breadcrumbListLd, itemListLd } from "@/lib/seo/jsonLd";

export const metadata: Metadata = {
  title: "銘柄くらべ｜2つの米を、味で並べて比べる",
  description:
    "全銘柄から2つを自由に選んで比べられる道具と、迷いやすい組み合わせを手書きで比べたページの一覧です。12指標の並排表と味わいの地図で、値段ではなく味の違いで選びます。",
  alternates: { canonical: "/compare" },
};

const TRAIL = [
  { name: "トップ", path: "/" },
  { name: "銘柄くらべ", path: "/compare" },
];

export default function CompareIndexPage() {
  const pages = allResolvedComparisons();
  const dataset = freeCompareDataset();

  return (
    <main className="min-h-[100dvh] w-full min-w-0 text-[var(--km-ink)]">
      <JsonLd
        data={[
          breadcrumbListLd(TRAIL),
          itemListLd({
            name: "銘柄くらべ",
            items: pages.map((row) => ({
              name: `${row.a.name}と${row.b.name}の違い`,
              path: `/compare/${row.page.slug}`,
            })),
          }),
        ]}
      />
      <SiteHeader active="compare" />
      <PageMasthead
        crumbs={TRAIL}
        mark={<BowlMark className="h-8 w-8" />}
        title="銘柄くらべ"
        lede="「どっちがいいか」ではなく、「どう違うか」を並べるページです。迷いやすい2銘柄を、12指標の並排表と味わいの地図の位置で比べます。値段の並びは扱いません。"
        art={null}
      />

      <div className={`${SITE_COLUMN} pb-20`}>
        <section
          aria-label="2つ選んで比べる"
          className="mt-10 rounded-lg border border-[var(--km-border)] bg-[var(--km-surface)] p-5 sm:p-6"
        >
          <h2 className="border-b-2 border-[var(--km-gold)] pb-2 font-serif text-[1.25rem] font-semibold text-[var(--km-ink)]">
            2つ選んで比べる
          </h2>
          <p className="mb-5 mt-2 text-[13.5px] leading-[1.85] text-[var(--km-ink-soft)]">
            全銘柄から、気になる2つを自由に選べます。選ぶと、その場で12指標の並排表と味わいの地図が出ます。
          </p>
          <Suspense fallback={null}>
            <FreeCompare dataset={dataset} />
          </Suspense>
        </section>

        <h2 className="mt-14 border-b-2 border-[var(--km-gold)] pb-2 font-serif text-[1.25rem] font-semibold text-[var(--km-ink)]">
          よく比べられる組み合わせ
        </h2>
        <p className="mt-2 text-[13.5px] leading-[1.85] text-[var(--km-ink-soft)]">
          迷いやすい組み合わせは、手書きのページで詳しく比べています。
        </p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map(({ page, a, b }) => {
            const diffs = COMPARISON_INDICATORS.map(({ key, label }) => ({
              label,
              d: Math.abs((a[key] as number) - (b[key] as number)),
            }))
              .filter((row) => row.d > 0)
              .sort((x, y) => y.d - x.d);
            return (
              <Link
                key={page.slug}
                href={`/compare/${page.slug}`}
                className={`group block rounded-lg border border-[var(--km-border)] bg-[var(--km-surface)] p-5 shadow-[0_1px_3px_rgba(48,40,32,0.05)] transition-colors duration-150 ease-out hover:border-[var(--km-brown)]/35 active:scale-[0.995] ${FOCUS}`}
              >
                <div className="flex items-center gap-2">
                  <GrainMark
                    color={regionColor(a.region)}
                    width={17}
                    height={21}
                  />
                  <span className="font-serif text-[16.5px] font-semibold leading-[1.45] text-[var(--km-ink)]">
                    {a.name}
                    <span className="mx-1 text-[var(--km-muted)]">×</span>
                    {b.name}
                  </span>
                  <GrainMark
                    color={regionColor(b.region)}
                    width={17}
                    height={21}
                  />
                </div>
                <p className="mt-2 line-clamp-3 text-[13px] leading-[1.8] text-[var(--km-ink-soft)]">
                  {page.dek}
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <span className="rounded-full bg-[var(--km-surface-warm)] px-2.5 py-[2px] text-[11.5px] font-bold text-[var(--km-brown)] ring-1 ring-[var(--km-border)]">
                    差 {diffs.length} 指標
                  </span>
                  {diffs.slice(0, 3).map((row) => (
                    <span
                      key={row.label}
                      className="rounded-full bg-white px-2.5 py-[2px] text-[11.5px] text-[var(--km-ink-soft)] ring-1 ring-[var(--km-border)]"
                    >
                      {row.label}
                    </span>
                  ))}
                </div>
              </Link>
            );
          })}
        </div>
      </div>
      <SiteFooter />
    </main>
  );
}
