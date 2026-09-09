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
 * Stacked compare rows — no wide table, no horizontal scroll, no card shell.
 */
export function ComparisonTable({ rows }: { rows: ComparisonRow[] }) {
  if (rows.length === 0) return null;

  return (
    <div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="font-serif text-[1.25rem] font-semibold tracking-tight text-[var(--km-ink)]">
            比較表
          </h2>
          <p className="mt-1 text-[12px] text-[var(--km-muted)]">
            甘み・粒感と、向いている人・気をつける点を銘柄ごとに並べています。
          </p>
        </div>
        <AffiliateDisclosure variant="pr" />
      </div>

      <ul className="mt-5 divide-y divide-[var(--km-border)] border-y border-[var(--km-border)]">
        {rows.map((row, index) => (
          <li key={row.rice.id} className="py-4">
            <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1">
              <Link
                href={`/library/${row.rice.id}`}
                className={`font-serif text-[1.05rem] font-semibold text-[var(--km-ink)] hover:text-[var(--km-brown)] ${FOCUS}`}
              >
                {row.rice.name}
              </Link>
              <span className="text-[11px] text-[var(--km-muted)]">
                {row.rice.prefecture}
                {index === 0 ? " · いちばん近い" : null}
              </span>
            </div>

            <p className="mt-2 text-[13px] tabular-nums text-[var(--km-ink-soft)]">
              <span className="text-[var(--km-muted)]">甘み</span>{" "}
              {row.rice.sweetness_label}
              <span className="text-[var(--km-muted)]"> {row.rice.sweetness.toFixed(1)}</span>
              <span className="mx-2 text-[var(--km-border)]" aria-hidden>
                ·
              </span>
              <span className="text-[var(--km-muted)]">粒感</span>{" "}
              {row.rice.texture_label}
              <span className="text-[var(--km-muted)]"> {row.rice.hardness.toFixed(1)}</span>
            </p>

            <dl className="mt-3 space-y-2 text-[13px] leading-relaxed">
              <div>
                <dt className="text-[11px] tracking-wide text-[var(--km-muted)]">向いている人</dt>
                <dd className="mt-0.5 text-[var(--km-ink-soft)]">{row.suitedFor}</dd>
              </div>
              <div>
                <dt className="text-[11px] tracking-wide text-[var(--km-muted)]">気をつける点</dt>
                <dd className="mt-0.5 text-[var(--km-ink-soft)]">{row.caution}</dd>
              </div>
            </dl>

            <p className="mt-3">
              <a
                href={shopHref(row.rice)}
                target="_blank"
                rel={AFFILIATE_LINK_REL}
                className={`text-[13px] text-[var(--km-brown)] underline-offset-2 hover:underline ${FOCUS}`}
              >
                お店で価格を見る
              </a>
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
