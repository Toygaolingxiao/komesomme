"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";
import { FOCUS } from "@/components/matrix/shared";
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
  type TextureKey,
} from "@/lib/diagnosis/questions";

/**
 * Three-question wizard (v1). The cooker question exists in the engine and
 * in the result code, but the v1 UI always submits the default — adding the
 * question later only touches this component.
 *
 * Q2 is tap-to-pick (v1.30.1): a grid of the base brands households most
 * commonly keep, plus the "no fixed brand" fallback. Free-text input was
 * retired — the engine still keys on the catalogue id, so older result
 * codes keep decoding exactly as before.
 */
const COOKER_V1: CookerKey = "ih";
const DEFAULT_BASE_ID = "koshihikari-bl";

type Step = "intro" | "q1" | "q2" | "q3";

type BaseChoice = { kind: "resolved"; id: string } | { kind: "avg" };

const OPTION_BUTTON =
  "block w-full rounded-xl border border-[var(--km-border)] bg-[var(--km-surface)] px-4 py-3 text-left transition hover:border-[var(--km-brown)]/40 hover:bg-[var(--km-surface-warm)]";

function Progress({ remaining }: { remaining: number }) {
  return (
    <p className="text-[12px] tracking-[0.08em] text-[var(--km-muted)]">
      あと{remaining}問
    </p>
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

export function DiagnosisWizard({ brands }: { brands: FreeBrand[] }) {
  const router = useRouter();
  const [step, setStep] = useState<Step>("intro");
  const [dish, setDish] = useState<DishKey | null>(null);
  const [baseChoice, setBaseChoice] = useState<BaseChoice | null>(null);

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

  if (step === "intro") {
    return (
      <div>
        <h1 className="font-serif text-[1.9rem] font-semibold leading-[1.3] tracking-tight text-[var(--km-ink)]">
          {DIAGNOSIS_COPY.wizardTitle}
        </h1>
        <p className="mt-4 text-[15px] leading-[2] text-[var(--km-ink-soft)]">
          {DIAGNOSIS_COPY.wizardLead}
        </p>
        <button
          type="button"
          onClick={start}
          className={`mt-8 inline-flex min-h-[56px] items-center justify-center rounded-xl bg-[var(--km-brown)] px-8 text-[15px] font-medium text-white transition hover:opacity-90 ${FOCUS}`}
        >
          {DIAGNOSIS_COPY.startButton}
        </button>
      </div>
    );
  }

  if (step === "q1") {
    return (
      <section aria-label="質問1">
        <Progress remaining={3} />
        <QuestionTitle title={DIAGNOSIS_COPY.q1Title} sub={DIAGNOSIS_COPY.q1Sub} />
        <div className="mt-6 space-y-2.5">
          {DISH_OPTIONS.map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => answerQ1(option.key)}
              className={`${OPTION_BUTTON} min-h-[56px] ${FOCUS}`}
            >
              <span className="font-serif text-[16px] font-semibold text-[var(--km-ink)]">
                {option.label}
              </span>
              <span className="mt-0.5 block text-[12.5px] text-[var(--km-muted)]">
                {option.note}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => setStep("intro")}
          className={`mt-6 text-[13px] text-[var(--km-muted)] underline-offset-2 hover:underline ${FOCUS}`}
        >
          {DIAGNOSIS_COPY.back}
        </button>
      </section>
    );
  }

  if (step === "q2") {
    return (
      <section aria-label="質問2">
        <Progress remaining={2} />
        <QuestionTitle title={DIAGNOSIS_COPY.q2Title} sub={DIAGNOSIS_COPY.q2Sub} />
        <div className="mt-6 grid grid-cols-2 gap-2.5">
          {BASE_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => answerQ2({ kind: "resolved", id: option.id })}
              className={`flex min-h-[56px] items-center justify-center rounded-xl border border-[var(--km-border)] bg-[var(--km-surface)] px-3 py-3 text-center transition hover:border-[var(--km-brown)]/40 hover:bg-[var(--km-surface-warm)] ${FOCUS}`}
            >
              <span className="font-serif text-[15.5px] font-semibold text-[var(--km-ink)]">
                {option.label}
              </span>
            </button>
          ))}
        </div>
        <button
          type="button"
          onClick={() => answerQ2({ kind: "avg" })}
          className={`mt-3 block min-h-[44px] w-full text-center text-[13.5px] text-[var(--km-brown)] underline-offset-2 hover:underline ${FOCUS}`}
        >
          {DIAGNOSIS_COPY.q2Unknown}
        </button>
        <button
          type="button"
          onClick={() => setStep("q1")}
          className={`mt-4 text-[13px] text-[var(--km-muted)] underline-offset-2 hover:underline ${FOCUS}`}
        >
          {DIAGNOSIS_COPY.back}
        </button>
      </section>
    );
  }

  return (
    <section aria-label="質問3">
      <Progress remaining={1} />
      <QuestionTitle title={DIAGNOSIS_COPY.q3Title} sub={DIAGNOSIS_COPY.q3Sub} />
      <div className="mt-6 space-y-2.5">
        {TEXTURE_OPTIONS.map((option) => (
          <button
            key={option.key}
            type="button"
            onClick={() => answerQ3(option.key)}
            className={`${OPTION_BUTTON} min-h-[56px] ${FOCUS}`}
          >
            <span className="font-serif text-[16px] font-semibold text-[var(--km-ink)]">
              {option.label}
            </span>
            <span className="mt-0.5 block text-[12.5px] text-[var(--km-muted)]">
              {option.note}
            </span>
          </button>
        ))}
      </div>
      <button
        type="button"
        onClick={() => setStep("q2")}
        className={`mt-6 text-[13px] text-[var(--km-muted)] underline-offset-2 hover:underline ${FOCUS}`}
      >
        {DIAGNOSIS_COPY.back}
      </button>
    </section>
  );
}
