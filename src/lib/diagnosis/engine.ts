import { listMatchesAliases } from "@/lib/editorial/pairRank";
import type { RiceProfileV2 } from "@/types/rice";
import {
  DELTA_PHRASES,
  DIAGNOSIS_CONFLICTS,
  HEADLINE_KEYS,
  cookerOption,
  dishOption,
  textureOption,
  type ConflictId,
  type DiagnosisAnswers,
  type IndicatorKey,
  type SlotKey,
  type TasteTarget,
} from "@/lib/diagnosis/questions";

/**
 * Pure diagnosis engine (spec v2-diagnosis-spec §2–§3).
 * No IO, no randomness, no Date: the same answers over the same catalogue
 * always produce the same three picks — that is what makes a result URL
 * reproducible.
 */

export const DIAGNOSIS_WEIGHTS: Record<IndicatorKey, number> = {
  sweetness: 1.2,
  hardness: 1.2,
  stickiness: 1.0,
  cold_rice_quality: 1.4,
  oil_compatibility: 1.3,
  clarity: 1.0,
  sauce_absorption: 1.1,
  umami: 1.0,
  richness: 1.0,
  aroma: 0.8,
  aftertaste: 0.8,
  grain_size: 0.7,
};

const EPS = 1e-9;

/** Fallback base when a code names the site average (§1 Q2). */
export const DEFAULT_BASE_ID = "koshihikari-bl";

const NOVELTY_KEYS: IndicatorKey[] = [
  "sweetness",
  "hardness",
  "stickiness",
  "umami",
  "richness",
  "cold_rice_quality",
  "clarity",
];

/** Weighted mean absolute deviation from the target; lower is closer. */
export function diagnosisFitScore(
  rice: RiceProfileV2,
  target: TasteTarget,
): number {
  let sum = 0;
  let weight = 0;
  for (const key of Object.keys(target) as IndicatorKey[]) {
    const goal = target[key];
    if (goal == null) continue;
    const w = DIAGNOSIS_WEIGHTS[key];
    sum += w * Math.abs(rice[key] - goal);
    weight += w;
  }
  return weight === 0 ? 0 : sum / weight;
}

/** Weighted Euclidean distance from the base rice over the frame keys. */
export function noveltyOf(rice: RiceProfileV2, base: RiceProfileV2): number {
  let sum = 0;
  let weight = 0;
  for (const key of NOVELTY_KEYS) {
    const w = DIAGNOSIS_WEIGHTS[key];
    sum += w * (rice[key] - base[key]) ** 2;
    weight += w;
  }
  return Math.sqrt(sum / weight);
}

/** Sum of |Δ| over the six headline keys — the "readable change" tiebreak. */
export function headlineDiffSum(
  rice: RiceProfileV2,
  base: RiceProfileV2,
): number {
  let total = 0;
  for (const key of HEADLINE_KEYS) total += Math.abs(rice[key] - base[key]);
  return total;
}

export type ConflictMatch = {
  id: ConflictId;
  warning: string;
  /** True when this conflict's target adjustment was actually applied. */
  applied: boolean;
};

type ConflictInput = {
  dish: DiagnosisAnswers["dish"];
  tex: DiagnosisAnswers["tex"];
  cooker: DiagnosisAnswers["cooker"];
  base: Pick<RiceProfileV2, "stickiness" | "sweetness">;
};

const CONFLICT_CONDITIONS: Record<ConflictId, (input: ConflictInput) => boolean> = {
  C1: (i) => i.dish === "sushi" && i.tex === "mochi",
  C2: (i) => i.dish === "curry" && i.tex === "mochi",
  C3: (i) => i.dish === "sashimi" && i.tex === "mochi",
  C4: (i) => i.dish === "nabe" && i.tex === "tsubu",
  C5: (i) => i.dish === "bento" && i.tex === "tsubu",
  C6: (i) => i.cooker === "pressure" && i.tex === "mochi",
  C7: (i) =>
    i.dish === "sushi" && i.base.stickiness >= 4 && i.base.sweetness >= 4,
};

/** Conflicts carry target adjustments except C7, which is copy-only. */
const ADJUSTING_CONFLICTS: ReadonlySet<ConflictId> = new Set([
  "C1",
  "C2",
  "C3",
  "C4",
  "C5",
  "C6",
]);

/**
 * All conflicts the answers trigger, in priority order. At most the first
 * two adjusting conflicts are applied to the target (§3 stacking rule).
 */
export function findConflicts(input: ConflictInput): ConflictMatch[] {
  const matched = DIAGNOSIS_CONFLICTS.filter((row) =>
    CONFLICT_CONDITIONS[row.id](input),
  );
  let appliedCount = 0;
  return matched.map((row) => {
    const applied =
      ADJUSTING_CONFLICTS.has(row.id) && appliedCount < 2
        ? (appliedCount += 1, true)
        : false;
    return { id: row.id, warning: row.warning, applied };
  });
}

function clampTarget(target: TasteTarget): TasteTarget {
  const out: TasteTarget = {};
  for (const key of Object.keys(target) as IndicatorKey[]) {
    const value = target[key];
    if (value != null) out[key] = Math.min(5, Math.max(1, value));
  }
  return out;
}

function capKey(target: TasteTarget, key: IndicatorKey, cap: number): void {
  const value = target[key];
  if (value != null && value > cap) target[key] = cap;
}

function floorKey(target: TasteTarget, key: IndicatorKey, floor: number): void {
  const value = target[key];
  if (value != null && value < floor) target[key] = floor;
}

/**
 * Target synthesis, in the fixed order of §2.2:
 * F1 bias swap → Q1⊕Q3 merge → conflict adjustments → Q4 adjustment (+C6).
 */
export function buildTarget(
  answers: DiagnosisAnswers,
  base: Pick<RiceProfileV2, "stickiness" | "sweetness">,
): { target: TasteTarget; conflicts: ConflictMatch[] } {
  const conflicts = findConflicts({
    dish: answers.dish,
    tex: answers.tex,
    cooker: answers.cooker,
    base,
  });
  const applied = new Set(
    conflicts.filter((row) => row.applied).map((row) => row.id),
  );

  const dish = dishOption(answers.dish);
  const q1: TasteTarget =
    answers.dish === "tkg" && answers.tex === "tsubu" && dish.biasAlt
      ? dish.biasAlt
      : dish.bias;
  const q3 = textureOption(answers.tex).target;

  // Step 2: merge. Q1 is the hard constraint (weight 1.0), Q3 the leaning
  // (0.8); under an applied C1 the two mochi keys merge at half weight (0.4).
  const target: TasteTarget = {};
  const keys = new Set<IndicatorKey>([
    ...(Object.keys(q1) as IndicatorKey[]),
    ...(Object.keys(q3) as IndicatorKey[]),
  ]);
  for (const key of keys) {
    const a = q1[key];
    const b = q3[key];
    if (a != null && b != null) {
      const w3 =
        applied.has("C1") && (key === "stickiness" || key === "sweetness")
          ? 0.4
          : 0.8;
      target[key] = (1.0 * a + w3 * b) / (1.0 + w3);
    } else {
      target[key] = a ?? b;
    }
  }

  // Step 3: conflict adjustments, in priority order.
  for (const row of conflicts) {
    if (!row.applied) continue;
    switch (row.id) {
      case "C1":
        capKey(target, "stickiness", 2.6);
        break;
      case "C2":
        capKey(target, "stickiness", 3.0);
        capKey(target, "sweetness", 3.4);
        break;
      case "C3":
        capKey(target, "sweetness", 3.0);
        break;
      case "C4":
        capKey(target, "hardness", 3.6);
        break;
      case "C5":
        floorKey(target, "cold_rice_quality", 4.2);
        break;
      default:
        break;
    }
    Object.assign(target, clampTarget(target));
  }

  // Step 4: cooker adjustment; C6 adds its extra tightening afterwards.
  const adjust = cookerOption(answers.cooker).adjust;
  for (const key of Object.keys(adjust) as IndicatorKey[]) {
    const delta = adjust[key];
    if (delta != null && target[key] != null) {
      target[key] = (target[key] as number) + delta;
    }
  }
  Object.assign(target, clampTarget(target));
  if (applied.has("C6") && target.stickiness != null) {
    target.stickiness = Math.min(
      5,
      Math.max(1, (target.stickiness as number) - 0.3),
    );
  }

  return { target, conflicts };
}

function bandOf(delta: number): "p2" | "p1" | "m1" | "m2" {
  if (delta >= 2) return "p2";
  if (delta === 1) return "p1";
  if (delta === -1) return "m1";
  return "m2";
}

/**
 * First sentence of a pick's reason: the base-rice delta, in words (§2.6).
 * `baseLabel` is the display name of the base ("ものさしのコシヒカリ" when
 * the base is the default, the brand name otherwise).
 */
export function deltaReason(
  rice: RiceProfileV2,
  base: RiceProfileV2,
  baseIsDefault: boolean,
): string {
  const ranked = HEADLINE_KEYS.map((key, order) => ({
    key,
    order,
    delta: rice[key] - base[key],
  }))
    .filter((row) => Math.abs(row.delta) >= 1)
    .sort(
      (a, b) => Math.abs(b.delta) - Math.abs(a.delta) || a.order - b.order,
    )
    .slice(0, 2);

  if (ranked.length === 0) {
    return baseIsDefault
      ? "ものさしのコシヒカリと味の位置はほぼ同じです。産地と香りの違いを楽しむ一席としてどうぞ。"
      : `いつもの${base.name}と味の位置はほぼ同じです。産地と香りの違いを楽しむ一席としてどうぞ。`;
  }

  const prefix = baseIsDefault
    ? "ものさしのコシヒカリと比べると、"
    : `いつもの${base.name}と比べると、`;
  const phrases = ranked.map((row) => {
    const entry = DELTA_PHRASES[row.key]?.[bandOf(row.delta)];
    if (!entry) throw new Error(`missing delta phrase: ${row.key}`);
    return entry;
  });
  if (phrases.length === 1) return `${prefix}${phrases[0].single}。`;
  return `${prefix}${phrases[0].conn}、${phrases[1].single}。`;
}

export type DiagnosisPick = {
  slot: SlotKey;
  rice: RiceProfileV2;
  score: number;
  /** Delta sentence (first) and scene sentence (second) of the reason. */
  reason: string;
  sceneLine: string;
};

export type DiagnosisOutcome = {
  answers: DiagnosisAnswers;
  base: RiceProfileV2;
  target: TasteTarget;
  picks: [DiagnosisPick, DiagnosisPick, DiagnosisPick];
  conflicts: ConflictMatch[];
  /** Highest-priority matched conflict, or null. */
  warning: ConflictMatch | null;
  poolFallback: boolean;
  anaFallback: boolean;
  preferenceTag: string;
};

export type Scored = { rice: RiceProfileV2; score: number; headline: number };

function compareScored(a: Scored, b: Scored): number {
  if (Math.abs(a.score - b.score) > EPS) return a.score - b.score;
  if (Math.abs(a.headline - b.headline) > EPS) return b.headline - a.headline;
  return a.rice.id.localeCompare(b.rice.id);
}

function buildPool(
  answers: DiagnosisAnswers,
  profiles: RiceProfileV2[],
): { pool: RiceProfileV2[]; fallback: boolean } {
  const dish = dishOption(answers.dish);
  const afterR0 = profiles.filter((rice) => rice.id !== answers.baseId);
  const excluded = new Set<string>(dish.topExcludeIds);
  if (dish.avoidAliases.length > 0) {
    for (const rice of afterR0) {
      if (listMatchesAliases(rice.avoid_pairings, dish.avoidAliases)) {
        excluded.add(rice.id);
      }
    }
  }
  const clean = afterR0.filter((rice) => !excluded.has(rice.id));
  const main =
    dish.poolAliases.length > 0
      ? clean.filter((rice) =>
          listMatchesAliases(rice.best_match_dishes, dish.poolAliases),
        )
      : clean;
  if (main.length >= 3) return { pool: main, fallback: false };
  if (clean.length >= 3) return { pool: clean, fallback: true };
  // L3: relax R1/R2, keep only R0 — unreachable with the current catalogue.
  return { pool: afterR0, fallback: true };
}

/** The candidate pool after R0–R2, scored and sorted (the list "S" of §2.4). */
export function rankPool(
  answers: DiagnosisAnswers,
  profiles: RiceProfileV2[],
  target: TasteTarget,
  base: RiceProfileV2,
): { scored: Scored[]; poolFallback: boolean } {
  const { pool, fallback } = buildPool(answers, profiles);
  const scored = pool
    .map((rice) => ({
      rice,
      score: diagnosisFitScore(rice, target),
      headline: headlineDiffSum(rice, base),
    }))
    .sort(compareScored);
  return { scored, poolFallback: fallback };
}

export function runDiagnosis(
  answers: DiagnosisAnswers,
  profiles: RiceProfileV2[],
): DiagnosisOutcome {
  const base =
    profiles.find((rice) => rice.id === answers.baseId) ??
    profiles.find((rice) => rice.id === DEFAULT_BASE_ID);
  if (!base) throw new Error("catalogue has no base rice");

  const { target, conflicts } = buildTarget(answers, base);
  const { scored, poolFallback } = rankPool(answers, profiles, target, base);

  const honmei = scored[0];
  const directionDiffers = (row: Scored): boolean =>
    row.rice.quadrant !== honmei.rice.quadrant ||
    Math.hypot(
      row.rice.sweetness - honmei.rice.sweetness,
      row.rice.hardness - honmei.rice.hardness,
    ) >= 1.2;
  const taikou =
    scored.find((row) => row.rice.id !== honmei.rice.id && directionDiffers(row)) ??
    scored.find((row) => row.rice.id !== honmei.rice.id) ??
    honmei;

  const taken = new Set([honmei.rice.id, taikou.rice.id]);
  const eligible = scored.filter(
    (row, index) =>
      !taken.has(row.rice.id) &&
      index >= 5 &&
      row.score <= honmei.score + 0.9 &&
      noveltyOf(row.rice, base) >= 1.0,
  );
  let ana: Scored | undefined;
  let anaFallback = false;
  if (eligible.length > 0) {
    ana = [...eligible].sort((a, b) => {
      const na = noveltyOf(a.rice, base);
      const nb = noveltyOf(b.rice, base);
      if (Math.abs(na - nb) > EPS) return nb - na;
      return compareScored(a, b);
    })[0];
  } else {
    ana = scored.find((row) => !taken.has(row.rice.id));
    anaFallback = true;
  }
  if (!ana) ana = honmei;

  const dish = dishOption(answers.dish);
  const toPick = (slot: SlotKey, row: Scored): DiagnosisPick => ({
    slot,
    rice: row.rice,
    score: row.score,
    reason: deltaReason(row.rice, base, answers.baseIsDefault),
    sceneLine: dish.sceneLine,
  });

  return {
    answers,
    base,
    target,
    picks: [toPick("honmei", honmei), toPick("taikou", taikou), toPick("ana", ana)],
    conflicts,
    warning: conflicts[0] ?? null,
    poolFallback,
    anaFallback,
    preferenceTag: textureOption(answers.tex).tag,
  };
}
