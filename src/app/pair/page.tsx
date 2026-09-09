import type { Metadata } from "next";
import Link from "next/link";
import { SteamMark } from "@/components/brand/EditorialMarks";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumbs } from "@/components/nav/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_COLUMN } from "@/components/siteChrome";
import { FOCUS } from "@/components/matrix/shared";
import { PAIRING_PAGES } from "@/data/editorial/pairings";
import { allResolvedPairings } from "@/lib/editorial/pairings";
import { breadcrumbListLd, itemListLd } from "@/lib/seo/jsonLd";

export const metadata: Metadata = {
  title: "料理で選ぶ米｜甘み・粒感の比較表",
  description:
    "カレー、刺身、弁当、鍋、寿司など、献立から米を選ぶページです。カタログの相性と座標で並べています。",
  alternates: { canonical: "/pair" },
};

const TRAIL = [
  { name: "トップ", path: "/" },
  { name: "料理で選ぶ", path: "/pair" },
];

export default function PairIndexPage() {
  const pages = allResolvedPairings();

  return (
    <main className="min-h-[100dvh] w-full min-w-0 text-[var(--km-ink)]">
      <JsonLd
        data={[
          breadcrumbListLd(TRAIL),
          itemListLd({
            name: "料理で選ぶ",
            items: pages.map((row) => ({
              name: `${row.page.dishLabel}に合う米`,
              path: `/pair/${row.page.slug}`,
            })),
          }),
        ]}
      />
      <SiteHeader active="discover" />
      <Breadcrumbs className={`${SITE_COLUMN} pt-5`} crumbs={TRAIL} />

      <div className={`${SITE_COLUMN} pb-20 pt-4`}>
        <SteamMark className="h-8 w-8" />
        <h1 className="mt-3 font-serif text-[1.85rem] font-semibold tracking-tight text-[var(--km-ink)] sm:text-[2.1rem]">
          料理で選ぶ
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-[1.85] text-[var(--km-ink-soft)]">
          今夜の献立から、甘みと粒感の近い銘柄を並べています。値段の並びではなく、味の座標で選ぶページです。
        </p>

        <ul className="mt-10 divide-y divide-[var(--km-border)] border-y border-[var(--km-border)]">
          {pages.map(({ page }) => (
            <li key={page.slug}>
              <Link
                href={`/pair/${page.slug}`}
                className={`block py-4 ${FOCUS}`}
              >
                <span className="font-serif text-[1.2rem] font-semibold text-[var(--km-ink)]">
                  {page.dishLabel}に合う米
                </span>
                <span className="mt-1 block text-[13px] leading-relaxed text-[var(--km-ink-soft)]">
                  {page.dek}
                </span>
              </Link>
            </li>
          ))}
        </ul>

        {PAIRING_PAGES.length !== pages.length ? (
          <p className="mt-6 text-[12px] text-[var(--km-muted)]">
            一部の料理は候補が揃い次第公開します。
          </p>
        ) : null}
      </div>

      <SiteFooter />
    </main>
  );
}
