import Link from "next/link";
import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";
import { FOCUS } from "@/components/matrix/shared";
import {
  AFFILIATE_LINK_REL,
  amazonSearchUrl,
  shopQuery,
} from "@/lib/affiliate";
import { wrapRakutenAffiliateUrl, rakutenSearchUrl } from "@/lib/rakuten/affiliate";
import { riceRakutenKeyword } from "@/lib/rakuten/keyword";
import type { RiceProfileV2 } from "@/types/rice";

export type ComparisonRow = {
  rice: RiceProfileV2;
  suitedFor: string;
  caution: string;
};

function shopHref(rice: RiceProfileV2): string {
  const keyword =
    riceRakutenKeyword(rice) || shopQuery({ prefecture: rice.prefecture, brand: rice.name });
  return wrapRakutenAffiliateUrl(rakutenSearchUrl(keyword)) || amazonSearchUrl(keyword);
}

/**
 * Fits the pair column (~40rem) without horizontal scroll.
 * Axes share one column; shop lives under the brand name.
 */
export function ComparisonTable({
  rows,
  title = "比較表",
}: {
  rows: ComparisonRow[];
  title?: string;
}) {
  if (rows.length === 0) return null;

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2
            id="pair-top-heading"
            className="font-serif text-[1.25rem] font-semibold tracking-tight text-[var(--km-ink)]"
          >
            {title}
          </h2>
          <p className="mt-1 text-[12px] text-[var(--km-muted)]">
            甘みと粒感を先に見て、右の文で向き・注意を確かめてください。
          </p>
        </div>
        <AffiliateDisclosure variant="pr" />
      </div>

      <div className="mt-5 w-full">
        <table className="w-full table-fixed border-collapse text-left">
          <colgroup>
            <col className="w-[26%]" />
            <col className="w-[22%]" />
            <col className="w-[26%]" />
            <col className="w-[26%]" />
          </colgroup>
          <thead>
            <tr className="border-b border-[var(--km-ink)]/20">
              <th
                scope="col"
                className="py-3 pr-3 pl-0 text-[11px] font-medium tracking-[0.12em] text-[var(--km-muted)]"
              >
                銘柄
              </th>
              <th
                scope="col"
                className="px-2 py-3 text-[11px] font-medium tracking-[0.12em] text-[var(--km-muted)]"
              >
                味わい
              </th>
              <th
                scope="col"
                className="px-2 py-3 text-[11px] font-medium tracking-[0.12em] text-[var(--km-muted)]"
              >
                向いている人
              </th>
              <th
                scope="col"
                className="py-3 pr-0 pl-2 text-[11px] font-medium tracking-[0.12em] text-[var(--km-muted)]"
              >
                気をつける点
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => {
              const lead = index === 0;
              return (
                <tr
                  key={row.rice.id}
                  className={`border-b border-[var(--km-border)] last:border-b-0 ${
                    lead ? "bg-[var(--km-surface-warm)]/55" : ""
                  }`}
                >
                  <th
                    scope="row"
                    className="py-4 pr-3 pl-0 align-top font-serif text-[15px] font-semibold text-[var(--km-ink)]"
                  >
                    <Link
                      href={`/library/${row.rice.id}`}
                      className={`hover:text-[var(--km-brown)] ${FOCUS}`}
                    >
                      {row.rice.name}
                    </Link>
                    <span className="mt-1 block font-sans text-[11px] font-normal tracking-normal text-[var(--km-muted)]">
                      {row.rice.prefecture}
                      {lead ? (
                        <span className="ml-1.5 text-[var(--km-accent)]">いちばん近い</span>
                      ) : null}
                    </span>
                    <a
                      href={shopHref(row.rice)}
                      target="_blank"
                      rel={AFFILIATE_LINK_REL}
                      className={`mt-2 inline-block font-sans text-[12px] font-normal text-[var(--km-brown)] underline-offset-2 hover:underline ${FOCUS}`}
                    >
                      お店で価格を見る
                    </a>
                  </th>
                  <td className="px-2 py-4 align-top">
                    <div className="grid grid-cols-2 gap-2">
                      <div>
                        <span className="block text-[10px] tracking-wide text-[var(--km-muted)]">
                          甘み
                        </span>
                        <span className="mt-1 block font-serif text-[1.25rem] tabular-nums leading-none text-[var(--km-ink)]">
                          {row.rice.sweetness.toFixed(1)}
                        </span>
                        <span className="mt-1 block text-[11px] leading-snug text-[var(--km-ink-soft)]">
                          {row.rice.sweetness_label}
                        </span>
                      </div>
                      <div>
                        <span className="block text-[10px] tracking-wide text-[var(--km-muted)]">
                          粒感
                        </span>
                        <span className="mt-1 block font-serif text-[1.25rem] tabular-nums leading-none text-[var(--km-ink)]">
                          {row.rice.hardness.toFixed(1)}
                        </span>
                        <span className="mt-1 block text-[11px] leading-snug text-[var(--km-ink-soft)]">
                          {row.rice.texture_label}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-2 py-4 align-top text-[13px] leading-[1.65] break-words text-[var(--km-ink-soft)]">
                    {row.suitedFor}
                  </td>
                  <td className="py-4 pr-0 pl-2 align-top text-[13px] leading-[1.65] break-words text-[var(--km-ink-soft)]">
                    {row.caution}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
