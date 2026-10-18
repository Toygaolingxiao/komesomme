import type { TasteCoordinate } from "@/types/rice";
import { hardnessToDisplayY, normalizeTasteValue } from "@/lib/rice/matrix";

export const GRAIN_ENTER_KEY = "km-map-grain-enter";
export const GRAIN_ENTER_MAX_DELAY_MS = 240;
export const GRAIN_ENTER_DURATION_S = 0.28;
export const GRAIN_SCALE_DURATION_S = 0.18;
export const GRAIN_MOTION_EASE = [0.23, 1, 0.32, 1] as const;

/** Axis-space diagonal from 1..5 to 1..5. */
const MAX_AXIS_DISTANCE = Math.SQRT2 * 4;

export function grainEntranceDelayMs(
  displayX: number,
  displayY: number,
  probe: TasteCoordinate,
  maxDelayMs = GRAIN_ENTER_MAX_DELAY_MS
): number {
  const dx = displayX - normalizeTasteValue(probe.sweetness);
  const dy = displayY - hardnessToDisplayY(probe.hardness);
  const t = Math.min(1, Math.hypot(dx, dy) / MAX_AXIS_DISTANCE);
  return Math.round(t * maxDelayMs);
}

export function readGrainEnterPlayed(): boolean {
  if (typeof window === "undefined") return true;
  try {
    return window.sessionStorage.getItem(GRAIN_ENTER_KEY) === "1";
  } catch {
    return true;
  }
}

export function markGrainEnterPlayed(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(GRAIN_ENTER_KEY, "1");
  } catch {
    /* quota / private mode */
  }
}
