import { GrainMark } from "@/components/compare/GrainMark";
import {
  COMPARISON_INDICATORS,
  type ComparisonIndicatorKey,
} from "@/lib/editorial/comparisons";
import { regionColor } from "@/lib/rice/regions";
import type { RiceProfileV2 } from "@/types/rice";

type BrandValues = Pick<
  RiceProfileV2,
  "name" | "region" | ComparisonIndicatorKey
>;

function Dots({ value }: { value: number }) {
  return (
    <span className="inline-flex items-center gap-[3px]" aria-hidden="true">
      {Array.from({ length: 5 }, (_, i) => (
        <span
          key={i}
          className={`h-[10px] w-[10px] rounded-full ${
            i < value
              ? "bg-[var(--km-gold)] shadow-[inset_0_-2px_3px_rgba(112,69,34,0.3)]"
              : "bg-[#E9DFC9]"
          }`}
        />
      ))}
    </span>
  );
}

/** The 12-indicator side-by-side table, shared by curated pages and the free tool. */
export function IndicatorTable({ a, b }: { a: BrandValues; b: BrandValues }) {
  return (
    <div className="overflow-hidden rounded-lg border border-[var(--km-border)] bg-white">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[540px] border-collapse text-[14px]">
          <thead>
            <tr className="bg-[#FBF6EC] text-left text-[12.5px] text-[var(--km-muted)]">
              <th className="border-b border-[var(--km-border)] px-3 py-2.5 font-semibold">
                指標
              </th>
              {[a, b].map((brand) => (
                <th
                  key={brand.name}
                  className="border-b border-[var(--km-border)] px-3 py-2.5 font-semibold"
                >
                  <span className="inline-flex items-center gap-2 text-[13.5px] text-[var(--km-ink)]">
                    <GrainMark
                      color={regionColor(brand.region)}
                      width={13}
                      height={17}
                    />
                    {brand.name}
                  </span>
                </th>
              ))}
              <th className="border-b border-[var(--km-border)] px-3 py-2.5 font-semibold">
                差
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPARISON_INDICATORS.map(({ key, label }) => {
              const va = a[key] as number;
              const vb = b[key] as number;
              const d = va - vb;
              const leader = d > 0 ? a : b;
              return (
                <tr key={key} className={d !== 0 ? "bg-[#FFF6E6]" : undefined}>
                  <td
                    className={`border-b border-[var(--km-border)] px-3 py-[9px] ${
                      d !== 0
                        ? "font-semibold text-[var(--km-ink)]"
                        : "text-[var(--km-ink-soft)]"
                    }`}
                  >
                    {label}
                  </td>
                  {[
                    { brand: a, value: va, wins: d > 0 },
                    { brand: b, value: vb, wins: d < 0 },
                  ].map(({ brand, value, wins }) => (
                    <td
                      key={brand.name}
                      className="border-b border-[var(--km-border)] px-3 py-[9px]"
                    >
                      <Dots value={value} />
                      <span
                        className={`ml-2 text-[13.5px] ${
                          wins
                            ? "font-bold text-[var(--km-accent-ink)]"
                            : "font-semibold text-[var(--km-ink-soft)]"
                        }`}
                      >
                        {value}
                      </span>
                    </td>
                  ))}
                  <td className="border-b border-[var(--km-border)] px-3 py-[9px] text-[12.5px]">
                    {d === 0 ? (
                      <span className="text-[var(--km-muted)]">同点</span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full bg-white px-2.5 py-[3px] font-bold text-[var(--km-accent-ink)] ring-1 ring-[var(--km-border)]">
                        <span
                          aria-hidden="true"
                          className="h-[7px] w-[7px] rounded-full"
                          style={{ background: regionColor(leader.region) }}
                        />
                        {leader.name} +{Math.abs(d)}
                      </span>
                    )}
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
