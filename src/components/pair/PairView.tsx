import Link from "next/link";
import { BowlMark, SteamMark } from "@/components/brand/EditorialMarks";
import { EditorialArt } from "@/components/editorial/EditorialArt";
import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";
import { ComparisonTable, type ComparisonRow } from "@/components/pair/ComparisonTable";
import { FOCUS } from "@/components/matrix/shared";
import { SITE_COLUMN } from "@/components/siteChrome";
import { EDITORIAL_COLLECTIONS } from "@/data/editorial/collections";
import { pairingPageBySlug } from "@/data/editorial/pairings";
import {
  collectionArtSrc,
  mastheadArtSrc,
  resolveBrandArt,
} from "@/lib/editorial/art";
import type { ResolvedPairing } from "@/lib/editorial/pairings";
import type { RiceProfileV2 } from "@/types/rice";

function suitedFor(rice: RiceProfileV2): string {
  const dishes = rice.best_match_dishes.slice(0, 2).join("、");
  return `${rice.short_} ${dishes ? `（${dishes}）` : ""}`.trim();
}

function caution(rice: RiceProfileV2): string {
  const avoid = rice.avoid_pairings[0];
  if (avoid) return `${avoid}には向きにくい、とカタログにあります。`;
  return rice.pairing_reason.slice(0, 48) || "甘みと粒感のバランスを事典で確認してください。";
}

function heroSrc(page: ResolvedPairing["page"], lead: RiceProfileV2 | undefined): string | null {
  if (page.collectionSlug) {
    const collection = EDITORIAL_COLLECTIONS.find((row) => row.slug === page.collectionSlug);
    const fromCollection = collectionArtSrc(collection?.artFile ?? null);
    if (fromCollection) return fromCollection;
  }
  if (lead) {
    const brand = resolveBrandArt(lead.id, lead.region, lead.prefecture);
    if (brand) return brand.src;
  }
  return mastheadArtSrc();
}

function avoidLabel(
  rice: RiceProfileV2,
  page: ResolvedPairing["page"],
  avoidSource: ResolvedPairing["avoidSource"]
): string {
  if (avoidSource === "axis") {
    return `座標が遠め（${rice.sweetness_label} · ${rice.texture_label}）`;
  }
  const aliases = page.avoidAliases?.length ? page.avoidAliases : page.dishAliases;
  const hit =
    rice.avoid_pairings.find((item) => aliases.some((alias) => item.includes(alias))) ||
    rice.avoid_pairings[0];
  return `${hit}には向きにくい`;
}

export function PairView({ resolved }: { resolved: ResolvedPairing }) {
  const { page, top, avoid, avoidSource } = resolved;
  const rows: ComparisonRow[] = top.map((rice) => ({
    rice,
    suitedFor: suitedFor(rice),
    caution: caution(rice),
  }));

  const related = page.relatedSlugs
    .map((slug) => pairingPageBySlug(slug))
    .filter(Boolean);
  const lead = top[0];
  const hero = heroSrc(page, lead);

  return (
    <article className="pb-20">
      <div className={`${SITE_COLUMN} pt-2`}>
        <div className="grid items-end gap-5 md:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] md:gap-10">
          {hero ? (
            <EditorialArt
              src={hero}
              alt=""
              className="h-36 w-full md:h-auto md:aspect-[24/9]"
              sizes="(min-width: 768px) 58vw, 100vw"
              quality={90}
              priority
              objectPosition="50% 40%"
            />
          ) : (
            <div
              aria-hidden
              className="flex h-36 w-full items-end bg-[var(--km-surface-warm)] px-5 pb-4 md:h-auto md:aspect-[24/9]"
            >
              <BowlMark className="h-12 w-12 opacity-80" />
            </div>
          )}
          <div className="min-w-0 pb-1">
            <SteamMark className="h-7 w-7" />
            <p className="mt-3 text-[12px] tracking-wide text-[var(--km-muted)]">料理で選ぶ</p>
            <h1 className="mt-1.5 font-serif text-[1.85rem] font-semibold tracking-tight text-[var(--km-ink)] sm:text-[2.15rem]">
              {page.dishLabel}に合う米
            </h1>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--km-ink-soft)]">{page.dek}</p>
            {lead ? (
              <p className="mt-4 text-[12px] text-[var(--km-muted)]">
                いちばん近い候補は
                <Link
                  href={`/library/${lead.id}`}
                  className={`ml-1 text-[var(--km-brown)] hover:underline ${FOCUS}`}
                >
                  {lead.name}
                </Link>
              </p>
            ) : null}
          </div>
        </div>
      </div>

      <div
        className={`${SITE_COLUMN} mt-8 max-w-3xl space-y-3 text-[14px] leading-[1.85] text-[var(--km-ink-soft)]`}
      >
        {page.lead.map((paragraph) => (
          <p key={paragraph.slice(0, 28)}>{paragraph}</p>
        ))}
      </div>

      <div className={`${SITE_COLUMN} mt-10`}>
        <div className="border border-[var(--km-border)] bg-[var(--km-surface-warm)] px-4 py-4 sm:px-5">
          <h2 className="font-serif text-[1.05rem] font-semibold text-[var(--km-ink)]">
            並びの根拠
          </h2>
          <p className="mt-2 text-[13px] leading-[1.85] text-[var(--km-ink-soft)]">{page.sortNote}</p>
        </div>
      </div>

      <section className={`${SITE_COLUMN} mt-12`} aria-labelledby="pair-top-heading">
        <div className="flex items-end justify-between gap-3">
          <h2
            id="pair-top-heading"
            className="font-serif text-[1.35rem] font-semibold tracking-tight text-[var(--km-ink)]"
          >
            今夜の候補
          </h2>
          <p className="text-[12px] text-[var(--km-muted)]">近い順 · {top.length}銘柄</p>
        </div>
        <ol className="mt-5 divide-y divide-[var(--km-border)] border-y border-[var(--km-border)]">
          {top.map((rice, index) => {
            const art = resolveBrandArt(rice.id, rice.region, rice.prefecture);
            const odd = index % 2 === 0;
            return (
              <li key={rice.id}>
                <Link
                  href={`/library/${rice.id}`}
                  className={`group grid grid-cols-[5.75rem_minmax(0,1fr)] items-center gap-3.5 py-4 sm:grid-cols-[6.5rem_minmax(0,1fr)] sm:gap-5 ${FOCUS}`}
                >
                  {art ? (
                    <EditorialArt
                      src={art.src}
                      alt=""
                      className={`w-full ${odd ? "aspect-[4/5]" : "aspect-square"}`}
                      sizes="(min-width: 640px) 6.5rem, 5.75rem"
                      objectPosition={odd ? "40% 50%" : "60% 40%"}
                      quality={78}
                    />
                  ) : (
                    <div
                      aria-hidden
                      className={`flex w-full items-center justify-center bg-[var(--km-surface-warm)] ${
                        odd ? "aspect-[4/5]" : "aspect-square"
                      }`}
                    >
                      <span className="font-serif text-[1.4rem] text-[var(--km-gold)]">
                        {String(index + 1).padStart(2, "0")}
                      </span>
                    </div>
                  )}
                  <span className="min-w-0">
                    <span className="text-[12px] text-[var(--km-muted)]">
                      {String(index + 1).padStart(2, "0")}
                      <span className="mx-2">{rice.prefecture}</span>
                      {index === 0 ? (
                        <span className="text-[var(--km-brown)]">いちばん近い</span>
                      ) : null}
                    </span>
                    <span className="mt-1 block font-serif text-[1.25rem] font-semibold tracking-tight text-[var(--km-ink)] group-hover:text-[var(--km-brown)] sm:text-[1.35rem]">
                      {rice.name}
                    </span>
                    <span className="mt-1.5 line-clamp-2 block text-[13px] leading-relaxed text-[var(--km-ink-soft)]">
                      {rice.short_}
                    </span>
                    <span className="mt-2 block text-[11px] tracking-wide text-[var(--km-muted)]">
                      {rice.sweetness_label} · {rice.texture_label}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ol>
      </section>

      <div className={`${SITE_COLUMN} mt-12`}>
        <ComparisonTable rows={rows} />
      </div>

      <section className={`${SITE_COLUMN} mt-14 max-w-3xl`} aria-labelledby="pair-avoid-heading">
        <div className="border-l-[3px] border-l-[var(--km-plum)] pl-4 sm:pl-5">
          <h2
            id="pair-avoid-heading"
            className="font-serif text-[1.25rem] font-semibold tracking-tight text-[var(--km-ink)]"
          >
            この料理には向かない米
          </h2>
          {avoidSource === "axis" && page.axisAvoidNote ? (
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--km-muted)]">
              {page.axisAvoidNote}
            </p>
          ) : (
            <p className="mt-2 text-[13px] leading-relaxed text-[var(--km-muted)]">
              カタログの「向かない組み合わせ」から拾っています。右の一文は、その米が避けたい献立です。
            </p>
          )}
        </div>
        <ul className="mt-5 divide-y divide-[var(--km-border)] border-y border-[var(--km-border)]">
          {avoid.map((rice) => {
            const art = resolveBrandArt(rice.id, rice.region, rice.prefecture);
            return (
              <li key={rice.id}>
                <Link
                  href={`/library/${rice.id}`}
                  className={`group grid grid-cols-[4.5rem_minmax(0,1fr)] items-center gap-3.5 py-3.5 sm:grid-cols-[5.25rem_minmax(0,1fr)] ${FOCUS}`}
                >
                  {art ? (
                    <EditorialArt
                      src={art.src}
                      alt=""
                      className="aspect-square w-full opacity-90"
                      sizes="5.25rem"
                      quality={72}
                      objectPosition="50% 45%"
                    />
                  ) : (
                    <div
                      aria-hidden
                      className="aspect-square w-full bg-[var(--km-bg-soft)]"
                    />
                  )}
                  <span className="min-w-0">
                    <span className="font-serif text-[1.05rem] font-semibold text-[var(--km-ink)] group-hover:text-[var(--km-brown)]">
                      {rice.name}
                      <span className="ml-2 text-[12px] font-normal text-[var(--km-muted)]">
                        {rice.prefecture}
                      </span>
                    </span>
                    <span className="mt-1 block text-[13px] leading-relaxed text-[var(--km-ink-soft)]">
                      {avoidLabel(rice, page, avoidSource)}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </section>

      <section className={`${SITE_COLUMN} mt-14 max-w-3xl`} aria-labelledby="pair-faq-heading">
        <h2
          id="pair-faq-heading"
          className="font-serif text-[1.25rem] font-semibold tracking-tight text-[var(--km-ink)]"
        >
          よくある質問
        </h2>
        <dl className="mt-5 space-y-3">
          {page.faq.map((item) => (
            <div
              key={item.q}
              className="border border-[var(--km-border)] bg-[var(--km-surface)] px-4 py-3.5 sm:px-5"
            >
              <dt className="text-[14px] font-medium text-[var(--km-ink)]">{item.q}</dt>
              <dd className="mt-1.5 text-[14px] leading-[1.85] text-[var(--km-ink-soft)]">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <nav
        className={`${SITE_COLUMN} mt-14 border-t border-[var(--km-border)] pt-10`}
        aria-label="関連リンク"
      >
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-serif text-[1.15rem] font-semibold text-[var(--km-ink)]">
            ほかの料理
          </h2>
          <AffiliateDisclosure variant="pr" className="sm:hidden" />
        </div>
        <ul className="mt-4 flex flex-wrap gap-2.5">
          {related.map((other) =>
            other ? (
              <li key={other.slug}>
                <Link
                  href={`/pair/${other.slug}`}
                  className={`inline-flex border border-[var(--km-border)] bg-[var(--km-surface-warm)] px-3.5 py-2 text-[13px] text-[var(--km-ink)] hover:border-[var(--km-brown)]/35 hover:text-[var(--km-brown)] ${FOCUS}`}
                >
                  {other.dishLabel}
                </Link>
              </li>
            ) : null
          )}
          <li>
            <Link
              href="/library"
              className={`inline-flex border border-[var(--km-border)] bg-[var(--km-surface)] px-3.5 py-2 text-[13px] text-[var(--km-brown)] ${FOCUS}`}
            >
              銘柄ライブラリ
            </Link>
          </li>
          <li>
            <Link
              href="/discover"
              className={`inline-flex border border-[var(--km-border)] bg-[var(--km-surface)] px-3.5 py-2 text-[13px] text-[var(--km-brown)] ${FOCUS}`}
            >
              ピックアップ
            </Link>
          </li>
          {page.collectionSlug ? (
            <li>
              <Link
                href={`/collections/${page.collectionSlug}`}
                className={`inline-flex border border-[var(--km-border)] bg-[var(--km-surface)] px-3.5 py-2 text-[13px] text-[var(--km-brown)] ${FOCUS}`}
              >
                関連特集
              </Link>
            </li>
          ) : null}
        </ul>
      </nav>
    </article>
  );
}
