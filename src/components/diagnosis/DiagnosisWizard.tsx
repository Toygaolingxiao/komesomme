"use client";

import { Fragment, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";
import { FOCUS } from "@/components/matrix/shared";
import { EditorialArt } from "@/components/editorial/EditorialArt";
import { RiceGrainMark } from "@/components/matrix/RiceGrainMark";
import type { FreeBrand } from "@/lib/editorial/freeCompare";
import { encodeDiagnosisCode } from "@/lib/diagnosis/code";
import { findConflicts } from "@/lib/diagnosis/engine";
import {
  BASE_OPTIONS,
  DIAGNOSIS_COPY,
  DISH_OPTIONS,
  TEXTURE_OPTIONS,
  type CookerKey,
  type DiagnosisAnswers,
  type DishKey,
  type TasteTarget,
  type TextureKey,
} from "@/lib/diagnosis/questions";
import "@/components/diagnosis/diagnosis-motion.css";

/**
 * Three-question wizard (v1). The cooker question exists in the engine and
 * in the result code, but the v1 UI always submits the default — adding the
 * question later only touches this component.
 *
 * Q2 is tap-to-pick (v1.30.1): a grid of the base brands households most
 * commonly keep, plus the "no fixed brand" fallback. Free-text input was
 * retired — the engine still keys on the catalogue id, so older result
 * codes keep decoding exactly as before.
 *
 * v1.31.0 is a design pass only: hero art on the intro, card-style options
 * with a gold picked state (held for a beat so the tap registers before
 * the screen changes), grain-mark progress, and CSS-only step transitions.
 */
const COOKER_V1: CookerKey = "ih";
const DEFAULT_BASE_ID = "koshihikari-bl";
/** How long the picked card's gold state shows before advancing. */
const PICK_HOLD_MS = 170;

type Step = "intro" | "q1" | "q2" | "q3";

type BaseChoice = { kind: "resolved"; id: string } | { kind: "avg" };

function cardClass(isPicked: boolean): string {
  return `block w-full rounded-2xl border px-5 py-4 text-left shadow-[0_1px_2px_rgba(48,40,32,0.05)] transition ${
    isPicked
      ? "border-[var(--km-gold)] bg-[var(--km-surface-warm)] ring-1 ring-[var(--km-gold)]/50"
      : "border-[var(--km-border)] bg-[var(--km-surface)] hover:border-[var(--km-brown)]/40 hover:bg-[var(--km-surface-warm)]"
  } ${FOCUS}`;
}

function Progress({ remaining, current }: { remaining: number; current: number }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex items-end gap-1" aria-hidden>
        {[0, 1, 2].map((index) => (
          <RiceGrainMark
            key={index}
            markId={`shindan-progress-${index}`}
            width={24}
            height={14}
            tilt={[-9, 0, 9][index]}
            fill={index < current ? "#D49A2A" : "#E9DCC2"}
          />
        ))}
      </div>
      <p className="text-[12px] tracking-[0.08em] text-[var(--km-muted)]">
        あと{remaining}問
      </p>
    </div>
  );
}

function QuestionTitle({ title, sub }: { title: string; sub: string }) {
  return (
    <>
      <h2 className="mt-3 font-serif text-[1.35rem] font-semibold leading-[1.5] tracking-tight text-[var(--km-ink)]">
        {title}
      </h2>
      <p className="mt-2 text-[13.5px] leading-[1.8] text-[var(--km-muted)]">
        {sub}
      </p>
    </>
  );
}

/** Mini taste bars for a Q1 option: the same bias vector the engine scores. */
function TasteBars({ bias }: { bias: TasteTarget }) {
  const rows = [
    { label: "甘み", value: bias.sweetness, color: "#D49A2A" },
    { label: "粒立ち", value: bias.hardness, color: "#704522" },
    { label: "粘り", value: bias.stickiness, color: "#E56B3F" },
  ].filter((row) => row.value != null);
  if (rows.length === 0) return null;
  return (
    <span className="mt-3 block space-y-1.5" aria-hidden>
      {rows.map((row) => (
        <span key={row.label} className="flex items-center gap-2">
          <span className="w-9 flex-none text-[10.5px] tracking-[0.04em] text-[var(--km-muted)]">
            {row.label}
          </span>
          <span className="block h-[5px] flex-1 overflow-hidden rounded-full bg-[#EFE5CF]">
            <span
              className="block h-full rounded-full"
              style={{
                width: `${((row.value as number) / 5) * 100}%`,
                backgroundColor: row.color,
              }}
            />
          </span>
        </span>
      ))}
    </span>
  );
}

export function DiagnosisWizard({ brands }: { brands: FreeBrand[] }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [dish, setDish] = useState<DishKey | null>(null);
  const [baseChoice, setBaseChoice] = useState<BaseChoice | null>(null);
  const [picked, setPicked] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timerRef.current != null) window.clearTimeout(timerRef.current);
    },
    [],
  );

  const prefectureById = new Map(
    brands.map((brand) => [brand.id, brand.prefecture]),
  );

  const start = () => {
    track("diagnosis_start");
    setStep("q1");
  };

  const answerQ1 = (key: DishKey) => {
    setDish(key);
    track("diagnosis_answer", { q: "q1", key });
    setStep("q2");
  };

  const answerQ2 = (choice: BaseChoice) => {
    setBaseChoice(choice);
    track("diagnosis_answer", { q: "q2", key: choice.kind });
    setStep("q3");
  };

  const answerQ3 = (tex: TextureKey) => {
    if (!dish || !baseChoice) return;
    track("diagnosis_answer", { q: "q3", key: tex });

    const baseId =
      baseChoice.kind === "resolved" ? baseChoice.id : DEFAULT_BASE_ID;
    const answers: DiagnosisAnswers = {
      dish,
      baseId,
      baseIsDefault: baseChoice.kind !== "resolved",
      tex,
      cooker: COOKER_V1,
    };
    const baseBrand = brands.find((brand) => brand.id === baseId);
    const conflicts = findConflicts({
      dish,
      tex,
      cooker: COOKER_V1,
      base: baseBrand ?? { stickiness: 4, sweetness: 4 },
    });
    track("diagnosis_complete", {
      dish,
      base_id: baseId,
      base_is_default: answers.baseIsDefault,
      tex,
      cooker: COOKER_V1,
      conflicts: conflicts.map((row) => row.id).join(","),
    });

    router.push(`/shindan/r/${encodeDiagnosisCode(answers)}`);
  };

  /** Hold the picked card's gold state for a beat, then run the answer. */
  const choose = (pickKey: string, answer: () => void) => {
    if (picked) return;
    setPicked(pickKey);
    timerRef.current = window.setTimeout(answer, PICK_HOLD_MS);
  };

  const goBack = (to: Step) => {
    if (timerRef.current != null) {
      window.clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setPicked(null);
    setStep(to);
  };

  if (step === "intro") {
    return (
      <div className="shindan-step-enter">
        <EditorialArt
          src="/brand-art/shindan-hero.webp"
          alt="米屋のカウンターと、湯気の立つ炊きたてのご飯"
          className="km-figure-wide rounded-2xl"
          sizes="(min-width: 768px) 40rem, 100vw"
          priority
          objectPosition="50% 82%"
        />
        <p className="mt-9 text-[12.5px] font-semibold tracking-[0.22em] text-[var(--km-gold)]">
          {DIAGNOSIS_COPY.wizardEyebrow}
        </p>
        <h1 className="mt-3 font-serif text-[1.9rem] font-semibold leading-[1.3] tracking-tight text-[var(--km-ink)]">
          {DIAGNOSIS_COPY.wizardTitle}
        </h1>
        <p className="mt-4 text-[15px] leading-[2] text-[var(--km-ink-soft)]">
          {DIAGNOSIS_COPY.wizardLead}
        </p>
        <div className="mt-8 flex flex-wrap items-center gap-x-2 gap-y-2">
          {DIAGNOSIS_COPY.wizardSteps.map((label, index) => (
            <Fragment key={label}>
              {index > 0 ? (
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden
                  className="h-3.5 w-3.5 flex-none text-[var(--km-gold)]"
                >
                  <path
                    d="M9 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2.4"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              ) : null}
              <span className="inline-flex items-center rounded-full border border-[var(--km-border)] bg-[var(--km-surface)] px-3 py-1.5 text-[12px] font-medium text-[var(--km-brown)]">
                {label}
              </span>
            </Fragment>
          ))}
        </div>
        <button
          type="button"
          onClick={start}
          className={`mt-7 inline-flex min-h-[56px] items-center justify-center rounded-xl bg-[var(--km-brown)] px-8 text-[15px] font-medium text-white transition hover:opacity-90 ${FOCUS}`}
        >
          {DIAGNOSIS_COPY.startButton}
        </button>
      </div>
    );
  }

  if (step === "q1") {
    return (
      <section aria-label="質問1" className="shindan-step-enter">
        <Progress remaining={3} current={1} />
        <QuestionTitle title={DIAGNOSIS_COPY.q1Title} sub={DIAGNOSIS_COPY.q1Sub} />
        <div className="mt-6 space-y-2.5">
          {DISH_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => choose(`q1:${option.key}`, () => answerQ1(option.key))}
              className={`${cardClass(picked === `q1:${option.key}`)} min-h-[56px]`}
            >
              <span className="font-serif text-[16px] font-semibold text-[var(--km-ink)]">
                {option.label}
              </span>
              <span className="mt-0.5 block text-[12.5px] text-[var(--km-muted)]">
                {option.note}
              </span>
              <TasteBars bias={option.bias} />
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => goBack("intro")}
          className={`mt-6 text-[13px] text-[var(--km-muted)] underline-offset-2 hover:underline ${FOCUS}`}
        >
          {DIAGNOSIS_COPY.back}
        </button>
      </section>
    );
  }

  if (step === "q2") {
    return (
      <section aria-label="質問2" className="shindan-step-enter">
        <Progress remaining={2} current={2} />
        <QuestionTitle title={DIAGNOSIS_COPY.q2Title} sub={DIAGNOSIS_COPY.q2Sub} />
        <div className="mt-6 grid grid-cols-2 gap-2.5">
          {BASE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() =>
                choose(`q2:${option.id}`, () =>
                  answerQ2({ kind: "resolved", id: option.id }),
                )
              }
              className={`${cardClass(picked === `q2:${option.id}`)} flex min-h-[64px] flex-col justify-center px-4 py-3`}
            >
              <span className="font-serif text-[15.5px] font-semibold leading-[1.4] text-[var(--km-ink)]">
                {option.label}
              </span>
              <span className="mt-0.5 text-[11.5px] text-[var(--km-muted)]">
                {prefectureById.get(option.id) ?? ""}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => choose("q2:avg", () => answerQ2({ kind: "avg" }))}
          className={`mt-3 block min-h-[44px] w-full text-center text-[13.5px] text-[var(--km-brown)] underline-offset-2 hover:underline ${FOCUS}`}
        >
          {DIAGNOSIS_COPY.q2Unknown}
        </button>
        <button
          type="button"
          onClick={() => goBack("q1")}
          className={`mt-4 text-[13px] text-[var(--km-muted)] underline-offset-2 hover:underline ${FOCUS}`}
        >
          {DIAGNOSIS_COPY.back}
        </button>
      </section>
    );
  }

  return (
    <section aria-label="質問3" className="shindan-step-enter">
      <Progress remaining={1} current={3} />
      <QuestionTitle title={DIAGNOSIS_COPY.q3Title} sub={DIAGNOSIS_COPY.q3Sub} />
      <div className="mt-6 space-y-2.5">
        {TEXTURE_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => choose(`q3:${option.key}`, () => answerQ3(option.key))}
            className={`${cardClass(picked === `q3:${option.key}`)} min-h-[56px]`}
          >
            <span className="font-serif text-[17.5px] font-semibold text-[var(--km-ink)]">
              {option.label}
            </span>
            <span className="mt-0.5 block text-[13px] text-[var(--km-muted)]">
              {option.note}
            </span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => goBack("q2")}
        className={`mt-6 text-[13px] text-[var(--km-muted)] underline-offset-2 hover:underline ${FOCUS}`}
      >
        {DIAGNOSIS_COPY.back}
      </button>
    </section>
  );
}
