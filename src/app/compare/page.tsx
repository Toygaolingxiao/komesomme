import type { Metadata } from "next";
import Link from "next/link";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumbs } from "@/components/nav/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { PAGE_TITLE, SITE_COLUMN } from "@/components/siteChrome";
import { FOCUS } from "@/components/matrix/shared";
import {
  COMPARISON_INDICATORS,
  allResolvedComparisons,
} from "@/lib/editorial/comparisons";
import { breadcrumbListLd, itemListLd } from "@/lib/seo/jsonLd";

export const metadata: Metadata = {
  title: "銘柄くらべ｜2つの米を、味で並べて比べる",
  description:
    "ゆめぴりかとミルキークイーン、魚沼と佐渡など、迷いやすい2銘柄を12指標の並排表と味わいの地図で比べるページの一覧です。値段ではなく、味の違いで選びます。",
  alternates: { canonical: "/compare" },
};

const TRAIL = [
  { name: "トップ", path: "/" },
  { name: "銘柄くらべ", path: "/compare" },
];

export default function CompareIndexPage() {
  const pages = allResolvedComparisons();

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
      <Breadcrumbs className={`${SITE_COLUMN} pt-5`} crumbs={TRAIL} />

      <div className={`${SITE_COLUMN} pb-20 pt-4`}>
        <h1 className={`mt-3 ${PAGE_TITLE}`}>銘柄くらべ</h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-[1.85] text-[var(--km-ink-soft)]">
          「どっちがいいか」ではなく、「どう違うか」を並べるページです。迷いやすい2銘柄を、12指標の並排表と味わいの地図の位置で比べます。値段の並びは扱いません。
        </p>

        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pages.map(({ page, a, b }) => {
            const diffCount = COMPARISON_INDICATORS.filter(
              ({ key }) => (a[key] as number) !== (b[key] as number),
            ).length;
            return (
              <Link
                key={page.slug}
                href={`/compare/${page.slug}`}
                className={`group block rounded-lg border border-[var(--km-border)] bg-[var(--km-surface)] p-5 transition-colors duration-150 ease-out hover:border-[var(--km-brown)]/35 active:scale-[0.995] ${FOCUS}`}
              >
                <div className="font-serif text-[17px] font-semibold leading-[1.5] text-[var(--km-ink)]">
                  {a.name}
                  <span className="mx-1 text-[var(--km-muted)]">×</span>
                  {b.name}
                </div>
                <p className="mt-2 line-clamp-3 text-[13px] leading-[1.8] text-[var(--km-ink-soft)]">
                  {page.dek}
                </p>
                <div className="mt-3 text-[12px] text-[var(--km-muted)]">
                  12指標中、差があるのは{diffCount}つ
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
