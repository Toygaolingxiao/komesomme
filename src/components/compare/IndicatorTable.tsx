import {
  COMPARISON_INDICATORS,
  type ComparisonIndicatorKey,
} from "@/lib/editorial/comparisons";
import type { RiceProfileV2 } from "@/types/rice";

type BrandValues = Pick<RiceProfileV2, "name" | ComparisonIndicatorKey>;

function Dots({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-[3px]" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`h-[9px] w-[9px] rounded-full ${
            i < value ? "bg-[var(--km-gold)]" : "bg-[#E7DCC8]"
          }`}
        />
      ))}
    </span>
  );
}

/** The 12-indicator side-by-side table, shared by curated pages and the free tool. */
export function IndicatorTable({ a, b }: { a: BrandValues; b: BrandValues }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[520px] border-collapse text-[14px]">
        <thead>
          <tr className="bg-[#FBF6EC] text-left text-[12.5px] text-[var(--km-muted)]">
            <th className="border-b border-[var(--km-border)] px-3 py-2 font-semibold">
              指標
            </th>
            <th className="border-b border-[var(--km-border)] px-3 py-2 font-semibold">
              {a.name}
            </th>
            <th className="border-b border-[var(--km-border)] px-3 py-2 font-semibold">
              {b.name}
            </th>
            <th className="border-b border-[var(--km-border)] px-3 py-2 font-semibold">
              差
            </th>
          </tr>
        </thead>
        <tbody>
          {COMPARISON_INDICATORS.map(({ key, label }) => {
            const va = a[key] as number;
            const vb = b[key] as number;
            const d = va - vb;
            return (
              <tr key={key} className={d !== 0 ? "bg-[#FFF9EE]" : undefined}>
                <td className="border-b border-[var(--km-border)] px-3 py-[9px] text-[var(--km-ink-soft)]">
                  {label}
                </td>
                <td className="border-b border-[var(--km-border)] px-3 py-[9px]">
                  <Dots value={va} />
                  <span className="ml-2 text-[13.5px] font-bold">{va}</span>
                </td>
                <td className="border-b border-[var(--km-border)] px-3 py-[9px]">
                  <Dots value={vb} />
                  <span className="ml-2 text-[13.5px] font-bold">{vb}</span>
                </td>
                <td
                  className={`border-b border-[var(--km-border)] px-3 py-[9px] text-[12.5px] ${
                    d !== 0
                      ? "font-bold text-[var(--km-accent-ink)]"
                      : "text-[var(--km-muted)]"
                  }`}
                >
                  {d === 0
                    ? "同点"
                    : d > 0
                      ? `${a.name} +${d}`
                      : `${b.name} +${-d}`}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
