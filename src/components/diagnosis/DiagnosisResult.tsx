"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { TASTE_DISCLAIMER_DETAIL } from "@/lib/affiliate";
import { AXIS_POLES, FOCUS } from "@/components/matrix/shared";
import { TastePips } from "@/components/matrix/TastePips";
import { BrandThumb } from "@/components/editorial/BrandThumb";
import { ShopLinksStrip } from "@/components/ShopLinksStrip";
import { BuyingTipsPanel } from "@/components/diagnosis/BuyingTips";
import { COMPARISON_INDICATORS } from "@/lib/editorial/comparisons";
import type { RiceProfileV2 } from "@/types/rice";
import type { DiagnosisOutcome, DiagnosisPick } from "@/lib/diagnosis/engine";
import {
  DELTA_PHRASES,
  DIAGNOSIS_COPY,
  HEADLINE_KEYS,
  SLOT_DEFS,
  type DeltaBand,
} from "@/lib/diagnosis/questions";

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? values[key] : match,
  );
}

function bandOf(delta: number): DeltaBand {
  if (delta >= 2) return "p2";
  if (delta === 1) return "p1";
  if (delta === -1) return "m1";
  return "m2";
}

/**
 * The headline deltas behind a pick's reason sentence — the same keys,
 * threshold and ordering the engine uses to compose the prose (§2.6), so
 * the list below and the sentence can never disagree.
 */
function headlineDeltas(rice: RiceProfileV2, base: RiceProfileV2) {
  return HEADLINE_KEYS.map((key, order) => ({
    key,
    order,
    delta: rice[key] - base[key],
  }))
    .filter((row) => Math.abs(row.delta) >= 1)
    .sort((a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.order - b.order);
}

function DeltaList({
  pick,
  base,
  baseIsDefault,
}: {
  pick: DiagnosisPick;
  base: RiceProfileV2;
  baseIsDefault: boolean;
}) {
  const rows = headlineDeltas(pick.rice, base)
    .map((row) => ({
      ...row,
      phrase: DELTA_PHRASES[row.key]?.[bandOf(row.delta)]?.single,
    }))
    .filter((row) => row.phrase != null);
  if (rows.length === 0) return null;
  const prefix = baseIsDefault
    ? DIAGNOSIS_COPY.comparePrefixAvg
    : fill(DIAGNOSIS_COPY.comparePrefixNamed, { base: base.name });
  return (
    <div className="mt-5">
      <p className="text-[12px] font-medium tracking-[0.04em] text-[var(--km-brown)]">
        {prefix}
      </p>
      <ul className="mt-2.5 space-y-2">
        {rows.map((row) => (
          <li
            key={row.key}
            className="flex items-center gap-2.5 text-[14px] leading-[1.85] text-[var(--km-ink-soft)]"
          >
            <span
              aria-hidden
              className={`inline-flex h-6 min-w-9 flex-none items-center justify-center rounded-md px-1.5 font-serif text-[13px] font-bold ${
                row.delta > 0
                  ? "bg-[var(--km-gold)]/15 text-[var(--km-brown)]"
                  : "bg-[var(--km-surface-warm)] text-[var(--km-muted)]"
              }`}
            >
              {row.delta > 0 ? `+${row.delta}` : `${row.delta}`}
            </span>
            <span>{row.phrase}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/**
 * Mini taste map colours. SVG presentation attributes do not resolve CSS
 * var() and silently fall back to black, so the values stay literal hex —
 * collected here once, named after what they mirror. MAP_SURFACE /
 * MAP_MUTED / MAP_GOLD / MAP_BROWN / MAP_ACCENT / MAP_INK are the site
 * tokens (--km-surface / --km-muted / --km-gold / --km-brown / --km-accent
 * / --km-ink) at the same values. The three MAP_PLOT_* / MAP_GRID tints
 * have no exact token: they are intermediate shades of the same paper
 * family, between --km-surface and --km-bg-soft.
 */
const MAP_SURFACE = "#FFFDF7";
const MAP_MUTED = "#766658";
const MAP_GOLD = "#D49A2A";
const MAP_BROWN = "#704522";
const MAP_ACCENT = "#E56B3F";
const MAP_INK = "#302820";
const MAP_PLOT_BG = "#FFF9EE";
const MAP_PLOT_FRAME = "#DCCBA6";
const MAP_GRID = "#E7D9BE";

/**
 * Deterministic de-overlap for the mini map. Scores are integers 1–5, so
 * two seats can land on the exact same point (the live check found the
 * 穴 dot hidden under the 本命）. Points are placed in a fixed priority
 * order — the three picks keep their true position first, the base
 * yields — and each point takes the first offset from a fixed list that
 * keeps it clear of the ones already placed. No randomness: the same
 * result URL renders the same map on every visit.
 */
const MAP_MIN_SEPARATION = 15;
const MAP_NUDGES: ReadonlyArray<readonly [number, number]> = [
  [0, 0],
  [11, -11],
  [-13, -7],
  [13, 9],
  [-11, 13],
  [0, -17],
  [17, 0],
  [-17, 0],
  [0, 17],
  [20, -14],
  [-20, 14],
];

/**
 * Mini taste map — same axes as the home map (X: 甘み, right is sweeter;
 * Y: 粒立ち inverted the site's way, firm at the bottom, soft at the top).
 */
function MiniTasteMap({
  base,
  picks,
}: {
  base: RiceProfileV2;
  picks: DiagnosisOutcome["picks"];
}) {
  const W = 340;
  const H = 216;
  const padL = 36;
  const padR = 36;
  const padT = 18;
  const padB = 28;
  const plotW = W - padL - padR;
  const plotH = H - padT - padB;
  const px = (sweetness: number) => padL + ((sweetness - 1) / 4) * plotW;
  const py = (hardness: number) => padT + ((hardness - 1) / 4) * plotH;

  const points = [
    {
      key: "base",
      label: DIAGNOSIS_COPY.baseBarPrefix,
      rice: base,
      r: 5,
      fill: MAP_SURFACE,
      stroke: MAP_MUTED,
      dy: 16,
    },
    {
      key: "honmei",
      label: SLOT_DEFS.honmei.title,
      rice: picks[0].rice,
      r: 7.5,
      fill: MAP_GOLD,
      stroke: MAP_SURFACE,
      dy: -9,
    },
    {
      key: "taikou",
      label: SLOT_DEFS.taikou.title,
      rice: picks[1].rice,
      r: 6,
      fill: MAP_BROWN,
      stroke: MAP_SURFACE,
      dy: 16,
    },
    {
      key: "ana",
      label: SLOT_DEFS.ana.title,
      rice: picks[2].rice,
      r: 6,
      fill: MAP_ACCENT,
      stroke: MAP_SURFACE,
      dy: -9,
    },
  ];

  const clampToPlot = (value: number, lo: number, hi: number) =>
    Math.min(hi, Math.max(lo, value));
  const placed: Array<{ cx: number; cy: number }> = [];
  const centres = new Map<string, { cx: number; cy: number }>();
  for (const key of ["honmei", "taikou", "ana", "base"]) {
    const point = points.find((row) => row.key === key);
    if (!point) continue;
    const rawX = px(point.rice.sweetness);
    const rawY = py(point.rice.hardness);
    let centre: { cx: number; cy: number } | null = null;
    for (const [dx, dy] of MAP_NUDGES) {
      const cx = clampToPlot(rawX + dx, padL + point.r, padL + plotW - point.r);
      const cy = clampToPlot(rawY + dy, padT + point.r, padT + plotH - point.r);
      if (
        placed.every(
          (other) => Math.hypot(other.cx - cx, other.cy - cy) >= MAP_MIN_SEPARATION,
        )
      ) {
        centre = { cx, cy };
        break;
      }
    }
    centre ??= {
      cx: clampToPlot(rawX, padL + point.r, padL + plotW - point.r),
      cy: clampToPlot(rawY, padT + point.r, padT + plotH - point.r),
    };
    placed.push(centre);
    centres.set(key, centre);
  }

  /**
   * Label placement, same deterministic spirit as the dot de-overlap:
   * separated dots can still collide label-to-label (the live check found
   * 穴's label pressed against 本命's), so each label — in the same
   * priority order — takes the first of four fixed placements whose
   * estimated box (serif bold at fontSize 11, one em per character)
   * clears every label already placed and stays inside the viewBox.
   */
  type LabelBox = { x0: number; y0: number; x1: number; y1: number };
  const labelBoxes: LabelBox[] = [];
  const labelSpots = new Map<
    string,
    { x: number; y: number; anchor: "start" | "middle" | "end" }
  >();
  const boxFor = (
    anchor: "start" | "middle" | "end",
    x: number,
    baseline: number,
    width: number,
  ): LabelBox => ({
    x0: anchor === "start" ? x : anchor === "end" ? x - width : x - width / 2,
    y0: baseline - 9,
    x1: anchor === "start" ? x + width : anchor === "end" ? x : x + width / 2,
    y1: baseline + 2,
  });
  for (const key of ["honmei", "taikou", "ana", "base"]) {
    const point = points.find((row) => row.key === key);
    const centre = centres.get(key);
    if (!point || !centre) continue;
    const { cx, cy } = centre;
    const width = [...point.label].length * 11;
    const toLeft = cx > W * 0.6;
    const side = (left: boolean) => ({
      anchor: (left ? "end" : "start") as "start" | "end",
      x: cx + (left ? -(point.r + 4) : point.r + 4),
      y: cy + point.dy,
    });
    const candidates = [
      side(toLeft),
      side(!toLeft),
      { anchor: "middle" as const, x: cx, y: cy - point.r - 3 },
      { anchor: "middle" as const, x: cx, y: cy + point.r + 12 },
    ];
    let chosen = candidates[0];
    let chosenBox = boxFor(chosen.anchor, chosen.x, chosen.y, width);
    for (const cand of candidates) {
      const box = boxFor(cand.anchor, cand.x, cand.y, width);
      const inside = box.x0 >= 1 && box.x1 <= W - 1 && box.y0 >= 1 && box.y1 <= H - 1;
      const clear = labelBoxes.every(
        (other) =>
          box.x1 + 2 <= other.x0 || other.x1 + 2 <= box.x0 ||
          box.y1 + 2 <= other.y0 || other.y1 + 2 <= box.y0,
      );
      if (inside && clear) {
        chosen = cand;
        chosenBox = box;
        break;
      }
    }
    // Even the fallback (first candidate) is recorded, so later labels
    // still route around it.
    labelBoxes.push(chosenBox);
    labelSpots.set(key, chosen);
  }

  return (
    <figure className="mt-7">
      <p className="text-[12px] font-medium tracking-[0.08em] text-[var(--km-brown)]">
        {DIAGNOSIS_COPY.mapLabel}
      </p>
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="mt-2 h-auto w-full"
        role="img"
        aria-label={`${DIAGNOSIS_COPY.mapLabel}：${DIAGNOSIS_COPY.baseBarPrefix}と三席の味の位置`}
      >
        <rect
          x={padL}
          y={padT}
          width={plotW}
          height={plotH}
          fill={MAP_PLOT_BG}
          stroke={MAP_PLOT_FRAME}
          strokeWidth="1"
        />
        <line
          x1={px(3)}
          y1={padT}
          x2={px(3)}
          y2={padT + plotH}
          stroke={MAP_GRID}
          strokeWidth="1"
          strokeDasharray="3 4"
        />
        <line
          x1={padL}
          y1={py(3)}
          x2={padL + plotW}
          y2={py(3)}
          stroke={MAP_GRID}
          strokeWidth="1"
          strokeDasharray="3 4"
        />
        <text x={padL + 6} y={padT + 13} fontSize="10" fill={MAP_MUTED}>
          {AXIS_POLES.softShort}
        </text>
        <text x={padL + 6} y={padT + plotH - 7} fontSize="10" fill={MAP_MUTED}>
          {AXIS_POLES.firmShort}
        </text>
        <text x={padL} y={H - 8} fontSize="10" fill={MAP_MUTED}>
          {AXIS_POLES.sweetLowShort}
        </text>
        <text
          x={padL + plotW}
          y={H - 8}
          fontSize="10"
          fill={MAP_MUTED}
          textAnchor="end"
        >
          {AXIS_POLES.sweetHighShort}
        </text>
        {points.map((point) => {
          const centre = centres.get(point.key);
          const spot = labelSpots.get(point.key);
          if (!centre || !spot) return null;
          const { cx, cy } = centre;
          return (
            <g key={point.key}>
              <circle
                cx={cx}
                cy={cy}
                r={point.r}
                fill={point.fill}
                stroke={point.stroke}
                strokeWidth="2"
              />
              <text
                x={spot.x}
                y={spot.y}
                fontSize="11"
                fontWeight="700"
                fill={MAP_INK}
                textAnchor={spot.anchor}
                paintOrder="stroke"
                stroke={MAP_SURFACE}
                strokeWidth="3"
                className="font-serif"
              >
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-1.5 text-[12px] leading-[1.7] text-[var(--km-muted)]">
        {DIAGNOSIS_COPY.mapCaption}
      </figcaption>
    </figure>
  );
}

function PickDetailLink({ pick }: { pick: DiagnosisPick }) {
  return (
    <Link
      href={`/library/${pick.rice.id}`}
      onClick={() =>
        track("diagnosis_pick_click", {
          rice_id: pick.rice.id,
          slot: pick.slot,
        })
      }
      className={`mt-2 inline-block text-[13px] font-medium text-[var(--km-brown)] underline-offset-2 hover:underline ${FOCUS}`}
    >
      {DIAGNOSIS_COPY.detailLink}
    </Link>
  );
}

export function DiagnosisResult({
  code,
  outcome,
}: {
  code: string;
  outcome: DiagnosisOutcome;
}) {
  const { base, picks, warning, preferenceTag, answers } = outcome;
  const [pageUrl, setPageUrl] = useState(
    `https://komesomme.jp/shindan/r/${code}`,
  );
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setPageUrl(window.location.href);
  }, []);

  const honmei = picks[0];
  const shareText = fill(DIAGNOSIS_COPY.shareText, {
    name: honmei.rice.name,
    url: pageUrl,
  });
  const subtitle = answers.baseIsDefault
    ? DIAGNOSIS_COPY.subtitleAvg
    : fill(DIAGNOSIS_COPY.subtitleNamed, { base: base.name });
  const honmeiDef = SLOT_DEFS[honmei.slot];
  const honmeiDeltas = headlineDeltas(honmei.rice, base);

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(pageUrl);
      setCopied(true);
      track("diagnosis_share_copy", { code });
    } catch {
      /* clipboard may be blocked; the URL in the address bar still works */
    }
  };

  const openShare = (channel: "x" | "line") => {
    track("diagnosis_share_native", { channel, code });
    const href =
      channel === "x"
        ? `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
        : `https://social-plugins.line.me/lineit/share?url=${encodeURIComponent(pageUrl)}`;
    window.open(href, "_blank", "noopener,noreferrer");
  };

  const shareButtonClass = `inline-flex min-h-[48px] items-center justify-center rounded-full border border-[var(--km-border)] bg-[var(--km-surface)] px-5 text-[14px] font-medium text-[var(--km-ink)] transition hover:border-[var(--km-brown)]/40 hover:bg-[var(--km-surface-warm)] ${FOCUS}`;

  const shareButtons = (
    <>
      <button
        type="button"
        onClick={copyLink}
        className={`${shareButtonClass} ${
          copied
            ? "border-[var(--km-gold)] bg-[var(--km-surface-warm)] text-[var(--km-brown)]"
            : ""
        }`}
      >
        {copied ? DIAGNOSIS_COPY.shareCopied : DIAGNOSIS_COPY.shareCopy}
      </button>
      <button
        type="button"
        onClick={() => openShare("x")}
        className={shareButtonClass}
      >
        {DIAGNOSIS_COPY.shareX}
      </button>
      <button
        type="button"
        onClick={() => openShare("line")}
        className={shareButtonClass}
      >
        {DIAGNOSIS_COPY.shareLine}
      </button>
    </>
  );

  return (
    <div>
      {/* Title row: the result name on the left, share actions on the
          right at desktop width. On phones the share block sits below
          the picks instead (see the lg:hidden section further down). */}
      <div className="lg:flex lg:items-start lg:justify-between lg:gap-10">
        <div className="min-w-0">
          <p className="text-[12px] tracking-[0.14em] text-[var(--km-brown)]">
            {DIAGNOSIS_COPY.resultEyebrow}
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-3">
            <h1 className="font-serif text-[1.85rem] font-semibold leading-[1.12] tracking-tight text-[var(--km-ink)] sm:text-[2.1rem]">
              {DIAGNOSIS_COPY.resultTitle}
            </h1>
            <span
              aria-label={`${DIAGNOSIS_COPY.tagAriaPrefix}：${preferenceTag}`}
              className="inline-flex rotate-[-2deg] items-center rounded-md border-2 border-[var(--km-accent)] px-2.5 py-1 font-serif text-[13px] font-semibold text-[var(--km-accent)]"
            >
              {preferenceTag}
            </span>
          </div>
          <p className="mt-3 max-w-[40rem] text-[14px] leading-[1.85] text-[var(--km-ink-soft)]">
            {subtitle}
          </p>
        </div>
        <div
          role="group"
          aria-label={DIAGNOSIS_COPY.shareTitle}
          className="mt-6 hidden flex-none flex-wrap gap-2.5 lg:mt-2 lg:flex"
        >
          {shareButtons}
        </div>
      </div>

      <section aria-label="ものさし" className="mt-9">
        <h2 className="text-[13px] font-medium tracking-[0.06em] text-[var(--km-muted)]">
          {DIAGNOSIS_COPY.baseBarPrefix}：{base.name}（{base.prefecture}）
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 lg:grid-cols-6">
          {COMPARISON_INDICATORS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-2">
              <dt className="text-[11px] text-[var(--km-muted)]">{label}</dt>
              <dd>
                <TastePips value={base[key]} size="sm" />
              </dd>
            </div>
          ))}
        </dl>
        {answers.baseIsDefault ? (
          <p className="mt-3 text-[12px] leading-[1.8] text-[var(--km-muted)]">
            {DIAGNOSIS_COPY.fallbackNote}
          </p>
        ) : null}
      </section>

      <div className="mt-10">
        <article
          aria-label={`${honmeiDef.title} ${honmei.rice.name}`}
          className="overflow-hidden rounded-2xl border border-[var(--km-border)] bg-[var(--km-surface)] shadow-[0_2px_10px_rgba(48,40,32,0.07)]"
        >
          <div className="lg:grid lg:grid-cols-[46%_1fr]">
            <BrandThumb
              id={honmei.rice.id}
              name={honmei.rice.name}
              region={honmei.rice.region}
              prefecture={honmei.rice.prefecture}
              className="h-44 w-full sm:h-52 lg:h-full lg:min-h-[24rem]"
              sizes="(min-width: 1024px) 42rem, 100vw"
              priority
            />
            <div className="p-5 sm:p-6 lg:p-8">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                <h2 className="inline-flex rotate-[-2deg] items-center rounded-md bg-[var(--km-gold)] px-3 py-1 font-serif text-[15px] font-bold tracking-[0.14em] text-white shadow-[0_1px_3px_rgba(112,69,34,0.35)]">
                  {honmeiDef.title}
                </h2>
                <p className="text-[12px] text-[var(--km-muted)]">
                  {honmeiDef.note}
                </p>
              </div>
              <p className="mt-4 font-serif text-[2.25rem] font-semibold leading-[1.15] text-[var(--km-ink)]">
                {honmei.rice.name}
              </p>
              <p className="mt-1 text-[13px] text-[var(--km-muted)]">
                {honmei.rice.prefecture}
              </p>
              <PickDetailLink pick={honmei} />
              {honmeiDeltas.length > 0 ? (
                <>
                  <DeltaList
                    pick={honmei}
                    base={base}
                    baseIsDefault={answers.baseIsDefault}
                  />
                  <p className="mt-4 text-[14px] leading-[1.85] text-[var(--km-ink-soft)]">
                    {honmei.sceneLine}
                  </p>
                </>
              ) : (
                <p className="mt-4 text-[14px] leading-[1.85] text-[var(--km-ink-soft)]">
                  {honmei.reason}
                  {honmei.sceneLine}
                </p>
              )}
              <MiniTasteMap base={base} picks={picks} />
              <div className="mt-6">
                <ShopLinksStrip rice={honmei.rice} variant="compact" disclosure="pr" />
              </div>
            </div>
          </div>
        </article>

        {warning ? (
          <section
            aria-label={DIAGNOSIS_COPY.warningTitle}
            className="mt-6 rounded-xl border border-[var(--km-border)] border-l-4 border-l-[var(--km-gold)] bg-[var(--km-surface-warm)] px-5 py-4"
          >
            <h2 className="font-serif text-[15px] font-semibold text-[var(--km-brown)]">
              {DIAGNOSIS_COPY.warningTitle}
            </h2>
            <p className="mt-2 text-[14px] leading-[1.85] text-[var(--km-ink-soft)]">
              {warning.warning}
            </p>
          </section>
        ) : null}

        <div className="mt-6 grid gap-6 sm:grid-cols-2">
          {picks.slice(1).map((pick) => {
            const def = SLOT_DEFS[pick.slot];
            return (
              <article
                key={pick.slot}
                aria-label={`${def.title} ${pick.rice.name}`}
                className="rounded-2xl border border-[var(--km-border)] bg-[var(--km-surface)] p-5 shadow-[0_1px_3px_rgba(48,40,32,0.06)]"
              >
                <h2 className="font-serif text-[1.15rem] font-semibold tracking-tight text-[var(--km-brown)]">
                  {def.title}
                </h2>
                <p className="mt-1 text-[12px] leading-[1.6] text-[var(--km-muted)]">
                  {def.note}
                </p>
                <div className="mt-3.5 flex gap-3.5">
                  <BrandThumb
                    id={pick.rice.id}
                    name={pick.rice.name}
                    region={pick.rice.region}
                    prefecture={pick.rice.prefecture}
                    className="h-16 w-20 flex-none rounded-lg sm:h-[4.5rem] sm:w-24"
                    sizes="6rem"
                  />
                  <div className="min-w-0">
                    <p className="font-serif text-[18px] font-semibold leading-[1.4] text-[var(--km-ink)]">
                      {pick.rice.name}
                    </p>
                    <p className="mt-0.5 text-[12px] text-[var(--km-muted)]">
                      {pick.rice.prefecture}
                    </p>
                    <PickDetailLink pick={pick} />
                  </div>
                </div>
                {/* The dish scene sentence belongs to the whole result,
                    not to each seat: the engine hands the same line to all
                    three picks, so it is printed once, on the honmei card.
                    Side seats keep their own delta reason only. */}
                <p className="mt-3.5 text-[13px] leading-[1.9] text-[var(--km-ink-soft)]">
                  {pick.reason}
                </p>
                <div className="mt-4">
                  <ShopLinksStrip rice={pick.rice} variant="compact" disclosure="pr" />
                </div>
              </article>
            );
          })}
        </div>

        <div className="mt-6">
          <BuyingTipsPanel />
        </div>
      </div>

      <section
        aria-label={DIAGNOSIS_COPY.shareTitle}
        className="mt-12 lg:hidden"
      >
        <h2 className="font-serif text-[1.15rem] font-semibold tracking-tight text-[var(--km-ink)]">
          {DIAGNOSIS_COPY.shareTitle}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2.5">{shareButtons}</div>
      </section>

      <div className="mt-12 flex flex-wrap items-center gap-x-7 gap-y-3 border-t border-[var(--km-border)] pt-6">
        <Link
          href="/shindan"
          className={`text-[14px] font-medium text-[var(--km-brown)] underline-offset-2 hover:underline ${FOCUS}`}
        >
          {DIAGNOSIS_COPY.retryLink}
        </Link>
        <Link
          href="/library"
          className={`text-[14px] font-medium text-[var(--km-brown)] underline-offset-2 hover:underline ${FOCUS}`}
        >
          ライブラリ
        </Link>
      </div>

      <p className="mt-6 text-[12px] leading-[1.8] text-[var(--km-muted)]">
        {TASTE_DISCLAIMER_DETAIL}
      </p>
    </div>
  );
}
