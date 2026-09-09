import type { Metadata } from "next";
import Link from "next/link";
import { BowlMark, SteamMark } from "@/components/brand/EditorialMarks";
import { EditorialArt } from "@/components/editorial/EditorialArt";
import { SiteHeader } from "@/components/SiteHeader";
import { Breadcrumbs } from "@/components/nav/Breadcrumbs";
import { JsonLd } from "@/components/seo/JsonLd";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_COLUMN } from "@/components/siteChrome";
import { FOCUS } from "@/components/matrix/shared";
import { EDITORIAL_COLLECTIONS } from "@/data/editorial/collections";
import { PAIRING_PAGES } from "@/data/editorial/pairings";
import { collectionArtSrc, mastheadArtSrc, resolveBrandArt } from "@/lib/editorial/art";
import { allResolvedPairings, type ResolvedPairing } from "@/lib/editorial/pairings";
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

function artFor(resolved: ResolvedPairing): string | null {
  const { page, top } = resolved;
  if (page.collectionSlug) {
    const collection = EDITORIAL_COLLECTIONS.find((row) => row.slug === page.collectionSlug);
    const src = collectionArtSrc(collection?.artFile ?? null);
    if (src) return src;
  }
  const lead = top[0];
  if (lead) return resolveBrandArt(lead.id, lead.region, lead.prefecture)?.src ?? null;
  return mastheadArtSrc();
}

export default function PairIndexPage() {
  const pages = allResolvedPairings();
  const [first, ...rest] = pages;

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

        {first ? (
          <Link
            href={`/pair/${first.page.slug}`}
            className={`group mt-10 grid items-center gap-4 border border-[var(--km-border)] bg-[var(--km-surface)] p-3 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] sm:gap-6 sm:p-4 ${FOCUS}`}
          >
            {artFor(first) ? (
              <EditorialArt
                src={artFor(first)!}
                alt=""
                className="aspect-[21/9] w-full sm:aspect-[24/11]"
                sizes="(min-width: 640px) 55vw, 100vw"
                quality={86}
                priority
                objectPosition="50% 42%"
              />
            ) : (
              <div
                aria-hidden
                className="flex aspect-[21/9] items-end bg-[var(--km-surface-warm)] px-4 pb-3 sm:aspect-[24/11]"
              >
                <BowlMark className="h-10 w-10 opacity-80" />
              </div>
            )}
            <span className="min-w-0 px-1 pb-1 sm:pr-2">
              <span className="text-[12px] text-[var(--km-muted)]">ピックアップ</span>
              <span className="mt-1 block font-serif text-[1.45rem] font-semibold tracking-tight text-[var(--km-ink)] group-hover:text-[var(--km-brown)] sm:text-[1.6rem]">
                {first.page.dishLabel}に合う米
              </span>
              <span className="mt-2 block text-[13px] leading-relaxed text-[var(--km-ink-soft)]">
                {first.page.dek}
              </span>
            </span>
          </Link>
        ) : null}

        {rest.length > 0 ? (
          <ul className="mt-8 divide-y divide-[var(--km-border)] border-y border-[var(--km-border)]">
            {rest.map((resolved, index) => {
              const art = artFor(resolved);
              return (
                <li key={resolved.page.slug}>
                  <Link
                    href={`/pair/${resolved.page.slug}`}
                    className={`group grid grid-cols-[5.5rem_minmax(0,1fr)] items-center gap-3.5 py-4 sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:gap-5 ${FOCUS}`}
                  >
                    {art ? (
                      <EditorialArt
                        src={art}
                        alt=""
                        className={`w-full ${index % 2 === 0 ? "aspect-[4/5]" : "aspect-square"}`}
                        sizes="6.5rem"
                        quality={74}
                        objectPosition="50% 42%"
                      />
                    ) : (
                      <div
                        aria-hidden
                        className={`flex w-full items-center justify-center bg-[var(--km-surface-warm)] ${
                          index % 2 === 0 ? "aspect-[4/5]" : "aspect-square"
                        }`}
                      >
                        <BowlMark className="h-8 w-8 opacity-70" />
                      </div>
                    )}
                    <span className="min-w-0">
                      <span className="font-serif text-[1.2rem] font-semibold text-[var(--km-ink)] group-hover:text-[var(--km-brown)]">
                        {resolved.page.dishLabel}に合う米
                      </span>
                      <span className="mt-1 block text-[13px] leading-relaxed text-[var(--km-ink-soft)]">
                        {resolved.page.dek}
                      </span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : null}

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
