"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { TASTE_DISCLAIMER_DETAIL } from "@/lib/affiliate";
import { AXIS_POLES, FOCUS } from "@/components/matrix/shared";
import { TastePips } from "@/components/matrix/TastePips";
import { BrandThumb } from "@/components/editorial/BrandThumb";
import { ShopLinksStrip } from "@/components/ShopLinksStrip";
import { BuyingTips } from "@/components/diagnosis/BuyingTips";
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
      <p className="text-[12.5px] font-medium tracking-[0.04em] text-[var(--km-brown)]">
        {prefix}
      </p>
      <ul className="mt-2.5 space-y-2">
        {rows.map((row) => (
          <li
            key={row.key}
            className="flex items-center gap-2.5 text-[14px] leading-[1.7] text-[var(--km-ink-soft)]"
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
 * Mini taste map — same axes as the home map (X: 甘み, right is sweeter;
 * Y: 粒立ち inverted the site's way, firm at the bottom, soft at the top).
 * SVG attributes carry literal hex only: presentation attributes do not
 * resolve CSS var() and silently fall back to black.
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
      fill: "#FFFDF7",
      stroke: "#766658",
      dy: 16,
    },
    {
      key: "honmei",
      label: SLOT_DEFS.honmei.title,
      rice: picks[0].rice,
      r: 7.5,
      fill: "#D49A2A",
      stroke: "#FFFDF7",
      dy: -9,
    },
    {
      key: "taikou",
      label: SLOT_DEFS.taikou.title,
      rice: picks[1].rice,
      r: 6,
      fill: "#704522",
      stroke: "#FFFDF7",
      dy: 16,
    },
    {
      key: "ana",
      label: SLOT_DEFS.ana.title,
      rice: picks[2].rice,
      r: 6,
      fill: "#E56B3F",
      stroke: "#FFFDF7",
      dy: -9,
    },
  ];

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
          fill="#FFF9EE"
          stroke="#DCCBA6"
          strokeWidth="1"
        />
        <line
          x1={px(3)}
          y1={padT}
          x2={px(3)}
          y2={padT + plotH}
          stroke="#E7D9BE"
          strokeWidth="1"
          strokeDasharray="3 4"
        />
        <line
          x1={padL}
          y1={py(3)}
          x2={padL + plotW}
          y2={py(3)}
          stroke="#E7D9BE"
          strokeWidth="1"
          strokeDasharray="3 4"
        />
        <text x={padL + 6} y={padT + 13} fontSize="10" fill="#766658">
          {AXIS_POLES.softShort}
        </text>
        <text x={padL + 6} y={padT + plotH - 7} fontSize="10" fill="#766658">
          {AXIS_POLES.firmShort}
        </text>
        <text x={padL} y={H - 8} fontSize="10" fill="#766658">
          {AXIS_POLES.sweetLowShort}
        </text>
        <text
          x={padL + plotW}
          y={H - 8}
          fontSize="10"
          fill="#766658"
          textAnchor="end"
        >
          {AXIS_POLES.sweetHighShort}
        </text>
        {points.map((point) => {
          const cx = px(point.rice.sweetness);
          const cy = py(point.rice.hardness);
          const toLeft = cx > W * 0.6;
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
                x={cx + (toLeft ? -(point.r + 4) : point.r + 4)}
                y={cy + point.dy}
                fontSize="11"
                fontWeight="700"
                fill="#302820"
                textAnchor={toLeft ? "end" : "start"}
                paintOrder="stroke"
                stroke="#FFFDF7"
                strokeWidth="3"
                className="font-serif"
              >
                {point.label}
              </text>
            </g>
          );
        })}
      </svg>
      <figcaption className="mt-1.5 text-[11.5px] leading-[1.7] text-[var(--km-muted)]">
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
      className={`mt-2 inline-block text-[13.5px] font-medium text-[var(--km-brown)] underline-offset-2 hover:underline ${FOCUS}`}
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

  return (
    <div>
      <p className="text-[12px] tracking-[0.14em] text-[var(--km-brown)]">
        {DIAGNOSIS_COPY.resultEyebrow}
      </p>
      <div className="mt-2 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-[2rem] font-semibold leading-[1.25] tracking-tight text-[var(--km-ink)]">
          {DIAGNOSIS_COPY.resultTitle}
        </h1>
        <span
          aria-label={`${DIAGNOSIS_COPY.tagAriaPrefix}：${preferenceTag}`}
          className="inline-flex rotate-[-2deg] items-center rounded-md border-2 border-[var(--km-accent)] px-2.5 py-1 font-serif text-[13px] font-semibold text-[var(--km-accent)]"
        >
          {preferenceTag}
        </span>
      </div>
      <p className="mt-3 text-[14.5px] leading-[1.9] text-[var(--km-ink-soft)]">
        {subtitle}
      </p>

      {warning ? (
        <section
          aria-label={DIAGNOSIS_COPY.warningTitle}
          className="mt-7 rounded-xl border border-[var(--km-border)] border-l-4 border-l-[var(--km-gold)] bg-[var(--km-surface-warm)] px-5 py-4"
        >
          <h2 className="font-serif text-[15px] font-semibold text-[var(--km-brown)]">
            {DIAGNOSIS_COPY.warningTitle}
          </h2>
          <p className="mt-2 text-[14px] leading-[1.95] text-[var(--km-ink-soft)]">
            {warning.warning}
          </p>
        </section>
      ) : null}

      <section aria-label="ものさし" className="mt-9">
        <h2 className="text-[13px] font-medium tracking-[0.06em] text-[var(--km-muted)]">
          {DIAGNOSIS_COPY.baseBarPrefix}：{base.name}（{base.prefecture}）
        </h2>
        <dl className="mt-4 grid grid-cols-2 gap-x-6 gap-y-3 sm:grid-cols-3 md:grid-cols-4">
          {COMPARISON_INDICATORS.map(({ key, label }) => (
            <div key={key} className="flex items-center justify-between gap-2">
              <dt className="text-[11.5px] text-[var(--km-muted)]">{label}</dt>
              <dd>
                <TastePips value={base[key]} size="sm" />
              </dd>
            </div>
          ))}
        </dl>
        {answers.baseIsDefault ? (
          <p className="mt-3 text-[12.5px] leading-[1.8] text-[var(--km-muted)]">
            {DIAGNOSIS_COPY.fallbackNote}
          </p>
        ) : null}
      </section>

      <div className="mt-10">
        <article
          aria-label={`${honmeiDef.title} ${honmei.rice.name}`}
          className="overflow-hidden rounded-2xl border border-[var(--km-border)] bg-[var(--km-surface)] shadow-[0_2px_10px_rgba(48,40,32,0.07)]"
        >
          <BrandThumb
            id={honmei.rice.id}
            name={honmei.rice.name}
            region={honmei.rice.region}
            prefecture={honmei.rice.prefecture}
            className="h-44 w-full sm:h-52"
            sizes="(min-width: 768px) 40rem, 100vw"
            priority
          />
          <div className="p-5 sm:p-6">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
              <h2 className="inline-flex rotate-[-2deg] items-center rounded-md bg-[var(--km-gold)] px-3 py-1 font-serif text-[15px] font-bold tracking-[0.14em] text-white shadow-[0_1px_3px_rgba(112,69,34,0.35)]">
                {honmeiDef.title}
              </h2>
              <p className="text-[12.5px] text-[var(--km-muted)]">
                {honmeiDef.note}
              </p>
            </div>
            <p className="mt-4 font-serif text-[1.55rem] font-semibold leading-[1.35] text-[var(--km-ink)]">
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
                <p className="mt-4 text-[14.5px] leading-[1.95] text-[var(--km-ink-soft)]">
                  {honmei.sceneLine}
                </p>
              </>
            ) : (
              <p className="mt-4 text-[14.5px] leading-[1.95] text-[var(--km-ink-soft)]">
                {honmei.reason}
                {honmei.sceneLine}
              </p>
            )}
            <MiniTasteMap base={base} picks={picks} />
            <div className="mt-6">
              <ShopLinksStrip rice={honmei.rice} variant="compact" disclosure="pr" />
            </div>
            <BuyingTips riceId={honmei.rice.id} />
          </div>
        </article>

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
                <p className="mt-1 text-[11.5px] leading-[1.6] text-[var(--km-muted)]">
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
                    <p className="font-serif text-[1.12rem] font-semibold leading-[1.4] text-[var(--km-ink)]">
                      {pick.rice.name}
                    </p>
                    <p className="mt-0.5 text-[12px] text-[var(--km-muted)]">
                      {pick.rice.prefecture}
                    </p>
                    <PickDetailLink pick={pick} />
                  </div>
                </div>
                <p className="mt-3.5 text-[13.5px] leading-[1.9] text-[var(--km-ink-soft)]">
                  {pick.reason}
                  {pick.sceneLine}
                </p>
                <div className="mt-4">
                  <ShopLinksStrip rice={pick.rice} variant="compact" disclosure="pr" />
                </div>
                <BuyingTips riceId={pick.rice.id} />
              </article>
            );
          })}
        </div>
      </div>

      <section aria-label={DIAGNOSIS_COPY.shareTitle} className="mt-12">
        <h2 className="font-serif text-[1.15rem] font-semibold tracking-tight text-[var(--km-ink)]">
          {DIAGNOSIS_COPY.shareTitle}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2.5">
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
        </div>
      </section>

      <p className="mt-10">
        <Link
          href="/shindan"
          className={`text-[14px] font-medium text-[var(--km-brown)] underline-offset-2 hover:underline ${FOCUS}`}
        >
          {DIAGNOSIS_COPY.retryLink}
        </Link>
      </p>

      <p className="mt-10 border-t border-[var(--km-border)] pt-4 text-[12px] leading-[1.8] text-[var(--km-muted)]">
        {TASTE_DISCLAIMER_DETAIL}
      </p>
    </div>
  );
}
