"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { track } from "@/lib/analytics";
import { TASTE_DISCLAIMER_DETAIL } from "@/lib/affiliate";
import { FOCUS } from "@/components/matrix/shared";
import { TastePips } from "@/components/matrix/TastePips";
import { BrandThumb } from "@/components/editorial/BrandThumb";
import { ShopLinksStrip } from "@/components/ShopLinksStrip";
import { BuyingTips } from "@/components/diagnosis/BuyingTips";
import { COMPARISON_INDICATORS } from "@/lib/editorial/comparisons";
import type { DiagnosisOutcome } from "@/lib/diagnosis/engine";
import { DIAGNOSIS_COPY, SLOT_DEFS } from "@/lib/diagnosis/questions";

function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\{(\w+)\}/g, (match, key: string) =>
    key in values ? values[key] : match,
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

  const shareButtonClass = `inline-flex min-h-[48px] items-center justify-center rounded-xl border border-[var(--km-border)] bg-[var(--km-surface)] px-5 text-[14px] font-medium text-[var(--km-ink)] transition hover:bg-[var(--km-surface-warm)] ${FOCUS}`;

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
          className="mt-7 rounded-xl border border-[var(--km-gold)]/50 bg-[var(--km-surface-warm)] px-5 py-4"
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

      <div className="mt-10 space-y-8">
        {picks.map((pick) => {
          const def = SLOT_DEFS[pick.slot];
          return (
            <article
              key={pick.slot}
              aria-label={`${def.title} ${pick.rice.name}`}
              className="rounded-2xl border border-[var(--km-border)] bg-[var(--km-surface)] p-5 shadow-[0_1px_3px_rgba(48,40,32,0.06)]"
            >
              <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                <h2 className="font-serif text-[1.4rem] font-semibold tracking-tight text-[var(--km-ink)]">
                  {def.title}
                </h2>
                <p className="text-[12.5px] text-[var(--km-muted)]">{def.note}</p>
              </div>
              <div className="mt-4 flex gap-4">
                <BrandThumb
                  id={pick.rice.id}
                  name={pick.rice.name}
                  region={pick.rice.region}
                  prefecture={pick.rice.prefecture}
                  className="h-20 w-24 flex-none rounded-lg sm:h-24 sm:w-32"
                  sizes="8rem"
                />
                <div className="min-w-0">
                  <p className="font-serif text-[1.25rem] font-semibold leading-[1.4] text-[var(--km-ink)]">
                    {pick.rice.name}
                  </p>
                  <p className="mt-0.5 text-[12.5px] text-[var(--km-muted)]">
                    {pick.rice.prefecture}
                  </p>
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
                </div>
              </div>
              <p className="mt-4 text-[14.5px] leading-[1.95] text-[var(--km-ink-soft)]">
                {pick.reason}
                {pick.sceneLine}
              </p>
              <div className="mt-5">
                <ShopLinksStrip rice={pick.rice} variant="compact" disclosure="pr" />
              </div>
              <BuyingTips riceId={pick.rice.id} />
            </article>
          );
        })}
      </div>

      <section aria-label={DIAGNOSIS_COPY.shareTitle} className="mt-12">
        <h2 className="font-serif text-[1.15rem] font-semibold tracking-tight text-[var(--km-ink)]">
          {DIAGNOSIS_COPY.shareTitle}
        </h2>
        <div className="mt-4 flex flex-wrap gap-2.5">
          <button type="button" onClick={copyLink} className={shareButtonClass}>
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
