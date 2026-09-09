import Link from "next/link";
import { SteamMark } from "@/components/brand/EditorialMarks";
import { ComparisonTable, type ComparisonRow } from "@/components/pair/ComparisonTable";
import { FOCUS } from "@/components/matrix/shared";
import { SITE_COLUMN } from "@/components/siteChrome";
import { pairingPageBySlug } from "@/data/editorial/pairings";
import type { ResolvedPairing } from "@/lib/editorial/pairings";

function suitedFor(rice: ComparisonRow["rice"]): string {
  const dishes = rice.best_match_dishes.slice(0, 2).join("、");
  return `${rice.short_} ${dishes ? `（${dishes}）` : ""}`.trim();
}

function caution(rice: ComparisonRow["rice"]): string {
  const avoid = rice.avoid_pairings[0];
  if (avoid) return `${avoid}には向きにくい、とカタログにあります。`;
  return rice.pairing_reason.slice(0, 48) || "甘みと粒感のバランスを事典で確認してください。";
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

  return (
    <article className="pb-20">
      <div className={`${SITE_COLUMN} pt-2`}>
        <SteamMark className="h-7 w-7" />
        <h1 className="mt-3 font-serif text-[1.75rem] font-semibold tracking-tight text-[var(--km-ink)] sm:text-[2rem]">
          {page.dishLabel}に合う米
        </h1>
        <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-[var(--km-ink-soft)]">
          {page.dek}
        </p>
      </div>

      <div
        className={`${SITE_COLUMN} mt-8 max-w-3xl space-y-3 text-[14px] leading-[1.85] text-[var(--km-ink-soft)]`}
      >
        {page.lead.map((paragraph) => (
          <p key={paragraph.slice(0, 28)}>{paragraph}</p>
        ))}
      </div>

      <div className={`${SITE_COLUMN} mt-10 max-w-3xl`}>
        <h2 className="font-serif text-[1.15rem] font-semibold text-[var(--km-ink)]">
          並びの根拠
        </h2>
        <p className="mt-2 text-[14px] leading-[1.85] text-[var(--km-ink-soft)]">{page.sortNote}</p>
      </div>

      <div className={`${SITE_COLUMN} mt-10`}>
        <ComparisonTable rows={rows} />
      </div>

      <section className={`${SITE_COLUMN} mt-14 max-w-3xl`} aria-labelledby="pair-avoid-heading">
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
            カタログの「向かない組み合わせ」から拾っています。
          </p>
        )}
        <ul className="mt-4 divide-y divide-[var(--km-border)] border-y border-[var(--km-border)]">
          {avoid.map((rice) => (
            <li key={rice.id}>
              <Link
                href={`/library/${rice.id}`}
                className={`flex flex-col gap-1 py-3 sm:flex-row sm:items-baseline sm:justify-between ${FOCUS}`}
              >
                <span className="font-serif text-[1.05rem] font-semibold text-[var(--km-ink)]">
                  {rice.name}
                  <span className="ml-2 text-[12px] font-normal text-[var(--km-muted)]">
                    {rice.prefecture}
                  </span>
                </span>
                <span className="text-[13px] text-[var(--km-ink-soft)]">
                  {avoidSource === "catalog"
                    ? rice.avoid_pairings.find((item) =>
                        page.avoidAliases
                          ? page.avoidAliases.some((a) => item.includes(a))
                          : page.dishAliases.some((a) => item.includes(a))
                      ) || rice.avoid_pairings[0]
                    : `${rice.sweetness_label} · ${rice.texture_label}`}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className={`${SITE_COLUMN} mt-14 max-w-3xl`} aria-labelledby="pair-faq-heading">
        <h2
          id="pair-faq-heading"
          className="font-serif text-[1.25rem] font-semibold tracking-tight text-[var(--km-ink)]"
        >
          よくある質問
        </h2>
        <dl className="mt-4 space-y-5">
          {page.faq.map((item) => (
            <div key={item.q}>
              <dt className="text-[14px] font-medium text-[var(--km-ink)]">{item.q}</dt>
              <dd className="mt-1.5 text-[14px] leading-[1.85] text-[var(--km-ink-soft)]">
                {item.a}
              </dd>
            </div>
          ))}
        </dl>
      </section>

      <nav
        className={`${SITE_COLUMN} mt-14 max-w-3xl border-t border-[var(--km-border)] pt-8`}
        aria-label="関連リンク"
      >
        <h2 className="font-serif text-[1.1rem] font-semibold text-[var(--km-ink)]">ほかの料理</h2>
        <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-2 text-[14px]">
          {related.map((other) =>
            other ? (
              <li key={other.slug}>
                <Link
                  href={`/pair/${other.slug}`}
                  className={`text-[var(--km-brown)] hover:underline ${FOCUS}`}
                >
                  {other.dishLabel}に合う米
                </Link>
              </li>
            ) : null
          )}
          <li>
            <Link href="/library" className={`text-[var(--km-brown)] hover:underline ${FOCUS}`}>
              銘柄ライブラリ
            </Link>
          </li>
          <li>
            <Link href="/discover" className={`text-[var(--km-brown)] hover:underline ${FOCUS}`}>
              ピックアップ
            </Link>
          </li>
          {page.collectionSlug ? (
            <li>
              <Link
                href={`/collections/${page.collectionSlug}`}
                className={`text-[var(--km-brown)] hover:underline ${FOCUS}`}
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
