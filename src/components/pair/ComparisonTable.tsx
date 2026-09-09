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
 * Dense compare surface under the magazine Top list.
 * First row carries a warm wash so the nearest brand reads first.
 */
export function ComparisonTable({ rows }: { rows: ComparisonRow[] }) {
  if (rows.length === 0) return null;

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-[1.25rem] font-semibold tracking-tight text-[var(--km-ink)]">
            比較表
          </h2>
          <p className="mt-1 text-[12px] text-[var(--km-muted)]">
            甘み・粒感と、向いている人・気をつける点を横に並べています。
          </p>
        </div>
        <AffiliateDisclosure variant="pr" />
      </div>
      <div className="overflow-x-auto border border-[var(--km-border)] bg-[var(--km-surface)] shadow-[inset_0_1px_0_rgba(255,253,247,0.8)]">
        <table className="min-w-[42rem] w-full border-collapse text-left text-[13px]">
          <thead className="bg-[var(--km-surface-warm)] text-[11px] tracking-wide text-[var(--km-muted)]">
            <tr>
              <th className="px-3 py-3 font-medium sm:px-4">銘柄</th>
              <th className="px-3 py-3 font-medium">甘み</th>
              <th className="px-3 py-3 font-medium">粒感</th>
              <th className="px-3 py-3 font-medium">向いている人</th>
              <th className="px-3 py-3 font-medium">気をつける点</th>
              <th className="px-3 py-3 font-medium sm:px-4">お店で探す</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[var(--km-border)]">
            {rows.map((row, index) => (
              <tr
                key={row.rice.id}
                className={index === 0 ? "bg-[var(--km-surface-warm)]" : undefined}
              >
                <td className="px-3 py-3.5 align-top sm:px-4">
                  <Link
                    href={`/library/${row.rice.id}`}
                    className={`font-serif text-[15px] font-semibold text-[var(--km-ink)] hover:text-[var(--km-brown)] ${FOCUS}`}
                  >
                    {row.rice.name}
                  </Link>
                  <span className="mt-0.5 block text-[11px] text-[var(--km-muted)]">
                    {row.rice.prefecture}
                    {index === 0 ? " · いちばん近い" : null}
                  </span>
                </td>
                <td className="px-3 py-3.5 align-top text-[var(--km-ink-soft)]">
                  {row.rice.sweetness_label}
                  <span className="mt-0.5 block tabular-nums text-[11px] text-[var(--km-muted)]">
                    {row.rice.sweetness.toFixed(1)}
                  </span>
                </td>
                <td className="px-3 py-3.5 align-top text-[var(--km-ink-soft)]">
                  {row.rice.texture_label}
                  <span className="mt-0.5 block tabular-nums text-[11px] text-[var(--km-muted)]">
                    {row.rice.hardness.toFixed(1)}
                  </span>
                </td>
                <td className="max-w-[14rem] px-3 py-3.5 align-top leading-relaxed text-[var(--km-ink-soft)]">
                  {row.suitedFor}
                </td>
                <td className="max-w-[12rem] px-3 py-3.5 align-top leading-relaxed text-[var(--km-ink-soft)]">
                  {row.caution}
                </td>
                <td className="px-3 py-3.5 align-top sm:px-4">
                  <a
                    href={shopHref(row.rice)}
                    target="_blank"
                    rel={AFFILIATE_LINK_REL}
                    className={`inline-block border border-[var(--km-border)] bg-[var(--km-surface-warm)] px-2.5 py-1.5 text-[12px] text-[var(--km-brown)] hover:border-[var(--km-brown)]/40 ${FOCUS}`}
                  >
                    お店で価格を見る
                  </a>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
