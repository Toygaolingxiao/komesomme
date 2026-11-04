"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { IndicatorTable } from "@/components/compare/IndicatorTable";
import { FOCUS } from "@/components/matrix/shared";
import {
  curatedKey,
  summarizeComparison,
  type FreeBrand,
  type FreeCompareDataset,
} from "@/lib/editorial/freeCompare";
import { RICE_REGIONS, regionColor } from "@/lib/rice/regions";

const DEFAULT_A = "yumepirika";
const DEFAULT_B = "milky-queen";

const W = 560;
const H = 300;
const PAD = 26;
const sx = (v: number) => PAD + ((v - 1) / 4) * (W - PAD * 2);
const sy = (v: number) => H - PAD - ((v - 1) / 4) * (H - PAD * 2);

function FreeMap({
  points,
  a,
  b,
}: {
  points: FreeCompareDataset["points"];
  a: FreeBrand;
  b: FreeBrand;
}) {
  const byId = new Map(points.map((point) => [point.id, point]));
  const pa = byId.get(a.id);
  const pb = byId.get(b.id);
  if (!pa || !pb) return null;
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      role="img"
      aria-label={`${a.name}と${b.name}の味わいの地図での位置`}
      className="w-full rounded-lg border border-[var(--km-border)] bg-[var(--km-surface)]"
    >
      {[1, 2, 3, 4, 5].map((v) => (
        <g key={v} stroke="var(--km-grid)" strokeWidth="1">
          <line x1={sx(v)} y1={PAD - 8} x2={sx(v)} y2={H - PAD + 8} />
          <line x1={PAD - 8} y1={sy(v)} x2={W - PAD + 8} y2={sy(v)} />
        </g>
      ))}
      {points.map((point) =>
        point.id === a.id || point.id === b.id ? null : (
          <circle
            key={point.id}
            cx={sx(point.x)}
            cy={sy(point.y)}
            r="3"
            fill="var(--km-brown)"
            opacity="0.16"
          />
        ),
      )}
      <circle
        cx={sx(pa.x)}
        cy={sy(pa.y)}
        r="8"
        fill={regionColor(a.region)}
        stroke="#fff"
        strokeWidth="2"
      />
      <circle
        cx={sx(pb.x)}
        cy={sy(pb.y)}
        r="8"
        fill={regionColor(b.region)}
        stroke="#fff"
        strokeWidth="2"
      />
      <text
        x={Math.min(sx(pa.x) + 14, W - 130)}
        y={sy(pa.y) - 10}
        fontSize="13"
        fontWeight="600"
        fill="var(--km-ink)"
      >
        {a.name}
      </text>
      <text
        x={Math.min(sx(pb.x) + 14, W - 150)}
        y={sy(pb.y) + 22}
        fontSize="13"
        fontWeight="600"
        fill="var(--km-ink)"
      >
        {b.name}
      </text>
      <text x={PAD - 6} y={16} fontSize="11" fill="var(--km-muted)">
        やわらか、ほどける ↑
      </text>
      <text x={PAD - 6} y={H - 6} fontSize="11" fill="var(--km-muted)">
        ↓ 粒立ちしっかり
      </text>
      <text
        x={W - PAD + 6}
        y={16}
        fontSize="11"
        fill="var(--km-muted)"
        textAnchor="end"
      >
        ← すっきり澄む
      </text>
      <text
        x={W - PAD + 6}
        y={H - 6}
        fontSize="11"
        fill="var(--km-muted)"
        textAnchor="end"
      >
        甘みふくらむ →
      </text>
    </svg>
  );
}

function Chips({ items }: { items: string[] }) {
  if (items.length === 0) return null;
  return (
    <div className="flex flex-wrap gap-[7px]">
      {items.map((item) => (
        <span
          key={item}
          className="rounded-full border border-[var(--km-border)] bg-white px-3 py-[3px] text-[13px] text-[var(--km-ink)]"
        >
          {item}
        </span>
      ))}
    </div>
  );
}

export function FreeCompare({ dataset }: { dataset: FreeCompareDataset }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { brands, points, curated } = dataset;
  const byId = useMemo(
    () => new Map(brands.map((brand) => [brand.id, brand])),
    [brands],
  );

  const aId = searchParams.get("a") ?? DEFAULT_A;
  const bId = searchParams.get("b") ?? DEFAULT_B;
  const a = byId.get(aId) ?? byId.get(DEFAULT_A)!;
  const b = byId.get(bId) ?? byId.get(DEFAULT_B)!;

  const summary = useMemo(
    () => (a.id !== b.id ? summarizeComparison(a, b) : null),
    [a, b],
  );
  const curatedSlug = curated[curatedKey(a.id, b.id)];

  const setPair = (nextA: string, nextB: string) => {
    router.replace(`/compare?a=${nextA}&b=${nextB}`, { scroll: false });
  };

  const selectClass =
    "w-full min-w-0 rounded-lg border border-[var(--km-border)] bg-white px-3 py-2.5 font-serif text-[15px] font-semibold text-[var(--km-ink)]";

  const picker = (
    label: string,
    value: string,
    onChange: (id: string) => void,
  ) => (
    <label className="block min-w-0 flex-1">
      <span className="mb-1 block text-[12px] text-[var(--km-muted)]">
        {label}
      </span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${selectClass} ${FOCUS}`}
      >
        {RICE_REGIONS.map((region) => (
          <optgroup key={region.id} label={region.name}>
            {brands
              .filter((brand) => brand.region === region.name)
              .map((brand) => (
                <option key={brand.id} value={brand.id}>
                  {brand.name}（{brand.prefecture}）
                </option>
              ))}
          </optgroup>
        ))}
      </select>
    </label>
  );

  return (
    <div>
      <div className="flex items-end gap-2 sm:gap-3">
        {picker("1つ目", a.id, (id) => setPair(id, b.id))}
        <button
          type="button"
          onClick={() => setPair(b.id, a.id)}
          aria-label="2つの銘柄を入れ替える"
          className={`mb-1 flex-none rounded-full border border-[var(--km-border)] bg-[var(--km-surface-warm)] px-3 py-2 text-[13px] text-[var(--km-brown)] transition-transform duration-150 active:scale-95 ${FOCUS}`}
        >
          ⇄ 入れ替え
        </button>
        {picker("2つ目", b.id, (id) => setPair(a.id, id))}
      </div>

      {a.id === b.id ? (
        <p className="mt-6 rounded-lg border border-[var(--km-border)] bg-[var(--km-surface-warm)] p-4 text-[14px] text-[var(--km-ink-soft)]">
          同じ銘柄が選ばれています。違う銘柄を選ぶと、ここに比べた結果が出ます。
        </p>
      ) : summary ? (
        <div className="mt-6">
          <div className="rounded-lg border border-[var(--km-border)] bg-[var(--km-surface-warm)] p-4">
            <div className="font-serif text-[16.5px] font-semibold text-[var(--km-ink)]">
              {a.name} × {b.name}
            </div>
            <p className="mt-1 text-[14px] leading-[1.85] text-[var(--km-ink-soft)]">
              {summary.verdict}
            </p>
            <p className="mt-1 text-[12.5px] text-[var(--km-muted)]">
              12指標のうち、同点は{summary.equalCount}つ。数値は KomeSomme
              の編集評価（1〜5）です。
            </p>
            {curatedSlug ? (
              <p className="mt-2 text-[13.5px]">
                <Link
                  href={`/compare/${curatedSlug}`}
                  className={`font-semibold text-[var(--km-brown)] underline-offset-4 hover:underline ${FOCUS}`}
                >
                  この組み合わせには、詳しく書いたページがあります →
                </Link>
              </p>
            ) : null}
          </div>

          <div className="mt-4">
            <IndicatorTable a={a} b={b} />
          </div>

          <div className="mt-6 grid items-stretch gap-4 md:grid-cols-[1.15fr_0.85fr]">
            <FreeMap points={points} a={a} b={b} />
            <p className="rounded-lg border border-[var(--km-border)] bg-[#FBF6EC] p-4 text-[13.5px] leading-[1.9] text-[var(--km-ink-soft)]">
              {summary.coordinateNote}
              地図の点は、ホームの味わい地図と同じ決め方で置いています。
            </p>
          </div>

          <div className="mt-6 grid gap-5 sm:grid-cols-2">
            <div>
              <div className="text-[12.5px] text-[var(--km-muted)]">
                {a.name}に向く／向かない
              </div>
              <div className="mt-2">
                <Chips items={[...a.best_match_dishes, ...a.good_with]} />
              </div>
              <p className="mt-2 text-[13px] leading-[1.75] text-[var(--km-ink-soft)]">
                向かない：{a.avoid_pairings.join("／")}
              </p>
            </div>
            <div>
              <div className="text-[12.5px] text-[var(--km-muted)]">
                {b.name}に向く／向かない
              </div>
              <div className="mt-2">
                <Chips items={[...b.best_match_dishes, ...b.good_with]} />
              </div>
              <p className="mt-2 text-[13px] leading-[1.75] text-[var(--km-ink-soft)]">
                向かない：{b.avoid_pairings.join("／")}
              </p>
            </div>
          </div>

          <p className="mt-5 text-[13.5px]">
            <Link
              href={`/library/${a.id}`}
              className={`text-[var(--km-brown)] underline-offset-4 hover:underline ${FOCUS}`}
            >
              {a.name}のページ
            </Link>
            <span className="mx-2 text-[var(--km-muted)]">／</span>
            <Link
              href={`/library/${b.id}`}
              className={`text-[var(--km-brown)] underline-offset-4 hover:underline ${FOCUS}`}
            >
              {b.name}のページ
            </Link>
          </p>
        </div>
      ) : null}
    </div>
  );
}
