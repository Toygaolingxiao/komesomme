"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/analytics";
import { FOCUS } from "@/components/matrix/shared";
import {
  normalizeBrandQuery,
  resolveCompareBrandId,
  type FreeBrand,
} from "@/lib/editorial/freeCompare";
import { encodeDiagnosisCode } from "@/lib/diagnosis/code";
import { findConflicts } from "@/lib/diagnosis/engine";
import {
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
 */
const COOKER_V1: CookerKey = "ih";
const RAW_BASE_STORAGE_KEY = "km-shindan-base-raw";
const DEFAULT_BASE_ID = "koshihikari-bl";

type Step = "intro" | "q1" | "q2" | "q3";

type BaseChoice =
  | { kind: "resolved"; id: string }
  | { kind: "avg" }
  | { kind: "skipped" };

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
  const [input, setInput] = useState("");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [failedRaw, setFailedRaw] = useState<string | null>(null);

  const suggestions = useMemo(() => {
    const query = normalizeBrandQuery(input);
    if (!query) return [];
    return brands
      .filter(
        (brand) =>
          normalizeBrandQuery(brand.name).includes(query) ||
          normalizeBrandQuery(brand.id).includes(query) ||
          brand.searchTerms.some((term) =>
            normalizeBrandQuery(term).includes(query),
          ),
      )
      .slice(0, 6);
  }, [brands, input]);

  const start = () => {
    track("diagnosis_start");
    setStep("q1");
  };

  const answerQ1 = (key: DishKey) => {
    setDish(key);
    track("diagnosis_answer", { q: "q1", key });
    setStep("q2");
  };

  const submitQ2 = (choice: BaseChoice, rawForNote: string | null) => {
    setBaseChoice(choice);
    setFailedRaw(rawForNote);
    track("diagnosis_answer", { q: "q2", key: choice.kind });
    setStep("q3");
  };

  const submitQ2FromForm = () => {
    if (pickedId) {
      submitQ2({ kind: "resolved", id: pickedId }, null);
      return;
    }
    const raw = input.trim();
    if (!raw) {
      submitQ2({ kind: "skipped" }, null);
      return;
    }
    const resolved = resolveCompareBrandId(raw, brands);
    if (resolved) {
      submitQ2({ kind: "resolved", id: resolved }, null);
    } else {
      // The raw wording never enters analytics; it is kept (truncated) in
      // session storage only so the result page can show the fallback note.
      submitQ2({ kind: "avg" }, raw.slice(0, 24));
    }
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

    const code = encodeDiagnosisCode(answers);
    if (failedRaw) {
      try {
        window.sessionStorage.setItem(
          RAW_BASE_STORAGE_KEY,
          JSON.stringify({ code, raw: failedRaw }),
        );
      } catch {
        /* session storage may be unavailable; the note is a nicety */
      }
    }
    router.push(`/shindan/r/${code}`);
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
        <div className="mt-6">
          <label htmlFor="km-shindan-base" className="sr-only">
            {DIAGNOSIS_COPY.q2Title}
          </label>
          <input
            id="km-shindan-base"
            type="text"
            value={input}
            onChange={(event) => {
              setInput(event.target.value);
              setPickedId(null);
            }}
            placeholder={DIAGNOSIS_COPY.q2Placeholder}
            autoComplete="off"
            className={`min-h-[56px] w-full rounded-xl border border-[var(--km-border)] bg-[var(--km-surface)] px-4 text-[16px] text-[var(--km-ink)] placeholder:text-[var(--km-muted)] ${FOCUS}`}
          />
          {suggestions.length > 0 ? (
            <ul className="mt-2 divide-y divide-[var(--km-border)] rounded-xl border border-[var(--km-border)] bg-[var(--km-surface)]">
              {suggestions.map((brand) => (
                <li key={brand.id}>
                  <button
                    type="button"
                    onClick={() => submitQ2({ kind: "resolved", id: brand.id }, null)}
                    className={`flex min-h-[48px] w-full items-center justify-between gap-3 px-4 py-2 text-left transition hover:bg-[var(--km-surface-warm)] ${FOCUS}`}
                  >
                    <span className="font-serif text-[15px] font-medium text-[var(--km-ink)]">
                      {brand.name}
                    </span>
                    <span className="text-[12px] text-[var(--km-muted)]">
                      {brand.prefecture}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <button
            type="button"
            onClick={submitQ2FromForm}
            className={`mt-4 inline-flex min-h-[56px] w-full items-center justify-center rounded-xl bg-[var(--km-brown)] px-8 text-[15px] font-medium text-white transition hover:opacity-90 ${FOCUS}`}
          >
            {DIAGNOSIS_COPY.q2Next}
          </button>
          <button
            type="button"
            onClick={() => submitQ2({ kind: "avg" }, null)}
            className={`mt-3 block min-h-[44px] w-full text-center text-[13.5px] text-[var(--km-brown)] underline-offset-2 hover:underline ${FOCUS}`}
          >
            {DIAGNOSIS_COPY.q2Unknown}
          </button>
        </div>
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
