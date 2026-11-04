import type {
  MapDisplayPoint,
  MapProfile,
  RiceMatchResult,
  TasteCoordinate,
} from "@/types/rice";

export const AXIS_MIN = 1;
export const AXIS_MAX = 5;

const MAX_DISTANCE = Math.SQRT2 * (AXIS_MAX - AXIS_MIN);

export function clamp(value: number, min = AXIS_MIN, max = AXIS_MAX) {
  return Math.max(min, Math.min(max, value));
}

/** Falls back to the neutral centre so a missing score never breaks placement. */
export function normalizeTasteValue(value: number | null | undefined): number {
  if (typeof value !== "number" || !Number.isFinite(value)) return 3;
  return clamp(value);
}

function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function stableNoise(id: string, axis: "x" | "y") {
  const hash = stableHash(`${id}:${axis}`);
  return ((hash % 1000) / 1000 - 0.5) * 0.06;
}

/**
 * Maximum distance (axis units) the spreading below may move a point from
 * its decimal taste position. Tuned with the owner (2026-11-04): the
 * original unbounded spread drifted up to 1.03 and put taste neighbours
 * 2.5 units apart; a 0.3 cap kept positions honest but collapsed the map
 * into clumps.
 */
const MAX_DRIFT = 0.75;

/**
 * Reach of the soft repulsion in the layout relaxation below. Inside this
 * range points push each other gently (linear falloff), so a crowded area
 * expands smoothly into the space around it instead of stopping at a
 * fixed gap.
 */
const SPREAD_RANGE = 0.34;
const SPREAD_ITERS = 220;

/**
 * Spreads brands that share the same hardness / sweetness pair.
 *
 * Secondary taste dimensions plus a deterministic per-id noise term keep the map from
 * looking like a rigid grid, while staying stable across renders and reloads. The
 * database stores pure taste data only; display coordinates are computed here.
 */

/**
 * Chart Y: bottom = firm (hardness 5), top = soft (hardness 1).
 * X is sweetness as stored: left = すっきり澄む, right = 甘みふくらむ.
 */
export function hardnessToDisplayY(hardness: number) {
  return AXIS_MAX + AXIS_MIN - normalizeTasteValue(hardness);
}

export function displayYToHardness(displayY: number) {
  return AXIS_MAX + AXIS_MIN - normalizeTasteValue(displayY);
}

export function calculateMatrixDisplayPoint(rice: MapProfile): MapDisplayPoint {
  const baseX = normalizeTasteValue(rice.sweetness);
  const baseY = hardnessToDisplayY(rice.hardness);

  // Decimal refinement: the stored scores are integers, so dozens of brands
  // share one cell. Within the cell, a brand's own secondary ratings decide
  // where it leans — umami/richness/aftertaste/aroma deepen the sweetness
  // side, stickiness softens, grain size and clarity firm up. The offset is
  // capped at ±0.45 so a point never crosses into the neighbouring score's
  // half of the axis: the integer score stays the position's headline.
  const clampOffset = (value: number) => Math.max(-0.45, Math.min(0.45, value));

  const offsetX =
    clampOffset(
      (normalizeTasteValue(rice.umami) - 3) * 0.1 +
        (normalizeTasteValue(rice.richness) - 3) * 0.07 +
        (normalizeTasteValue(rice.aftertaste) - 3) * 0.045 +
        (normalizeTasteValue(rice.aroma) - 3) * 0.035,
    ) + stableNoise(rice.id, "x");

  const offsetY =
    clampOffset(
      (normalizeTasteValue(rice.stickiness) - 3) * 0.11 +
        (normalizeTasteValue(rice.grain_size) - 3) * -0.08 +
        (normalizeTasteValue(rice.clarity) - 3) * -0.04,
    ) + stableNoise(rice.id, "y");

  return {
    ...rice,
    display_x: Number(clamp(baseX + offsetX).toFixed(3)),
    display_y: Number(clamp(baseY + offsetY).toFixed(3)),
  };
}

/**
 * Spreads the brands so the map stays readable, starting from their
 * decimal taste positions.
 *
 * One global relaxation over the whole map: a soft, long-reach repulsion
 * (SPREAD_RANGE, linear falloff) lets crowded areas expand smoothly into
 * the space around them, while a gentle spring holds every point near its
 * decimal position and MAX_DRIFT caps the total move. An earlier per-cell
 * sunflower-spiral layout was replaced after the owner spotted its
 * geometric artifact — the dense centre read as a beaded ring (and a
 * jittered variant settled into a honeycomb). The relaxation has no
 * per-cell structure, so density simply follows the data: measured on the
 * catalogue it keeps the original map's airiness (mean neighbour distance
 * 0.22) with a 0.137 minimum gap, worst drift 0.78 from a brand's integer
 * cell, and taste neighbours (tsubuzoroi × yumeobako) 1.07 apart against
 * a true axis distance of 1.01. Ranking uses these same coordinates, so
 * No.1 stays the nearest visible dot.
 */
function separateDisplayPoints(points: MapDisplayPoint[]): MapDisplayPoint[] {
  const xs = points.map((point) => point.display_x);
  const ys = points.map((point) => point.display_y);
  const baseXs = [...xs];
  const baseYs = [...ys];

  /** Pull point i back onto its MAX_DRIFT circle when spreading overshoots. */
  const capDrift = (i: number) => {
    const dx = xs[i] - baseXs[i];
    const dy = ys[i] - baseYs[i];
    const drift = Math.hypot(dx, dy);
    if (drift > MAX_DRIFT) {
      xs[i] = baseXs[i] + (dx / drift) * MAX_DRIFT;
      ys[i] = baseYs[i] + (dy / drift) * MAX_DRIFT;
    }
  };

  for (let iter = 0; iter < SPREAD_ITERS; iter += 1) {
    const damp = 1 - iter / 300;

    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        let dx = xs[j] - xs[i];
        let dy = ys[j] - ys[i];
        let distSq = dx * dx + dy * dy;

        if (distSq < 1e-8) {
          const angle =
            (stableHash(`${points[i].id}|${points[j].id}`) % 360) *
            (Math.PI / 180);
          dx = Math.cos(angle) * 0.002;
          dy = Math.sin(angle) * 0.002;
          distSq = dx * dx + dy * dy;
        }

        const dist = Math.sqrt(distSq);
        if (dist >= SPREAD_RANGE) continue;

        const force = (1 - dist / SPREAD_RANGE) * 0.034 * damp;
        const ux = dx / dist;
        const uy = dy / dist;
        xs[i] -= ux * force;
        ys[i] -= uy * force;
        xs[j] += ux * force;
        ys[j] += uy * force;
      }
    }

    for (let i = 0; i < points.length; i += 1) {
      xs[i] += (baseXs[i] - xs[i]) * 0.016;
      ys[i] += (baseYs[i] - ys[i]) * 0.016;
      capDrift(i);
      xs[i] = clamp(xs[i]);
      ys[i] = clamp(ys[i]);
    }
  }

  return points.map((point, index) => ({
    ...point,
    display_x: Number(xs[index].toFixed(3)),
    display_y: Number(ys[index].toFixed(3)),
  }));
}

export function toDisplayPoints(
  riceList: readonly MapProfile[],
): MapDisplayPoint[] {
  return separateDisplayPoints(riceList.map(calculateMatrixDisplayPoint));
}

export function getQuadrant(hardness: number, sweetness: number) {
  if (hardness < 3 && sweetness >= 3) return "もちもちで甘い";
  if (hardness >= 3 && sweetness >= 3) return "かためで甘い";
  if (hardness < 3 && sweetness < 3) return "もちもちであっさり";
  return "かためであっさり";
}

export function getTextureLabel(hardness: number) {
  if (hardness < 2) return "もちもち";
  if (hardness < 3) return "やわらかめ";
  if (hardness < 4) return "ほどよい";
  if (hardness < 4.6) return "かため";
  return "しっかり";
}

export function getSweetnessLabel(sweetness: number) {
  if (sweetness < 2) return "あっさり";
  if (sweetness < 3) return "さっぱり";
  if (sweetness < 4) return "ほどよい甘み";
  if (sweetness < 4.6) return "甘い";
  return "ふくよか";
}

/** Probe / slider state that sits on a brand's visible map position. */
export function coordinateFromDisplayPoint(point: {
  display_x: number;
  display_y: number;
}): TasteCoordinate {
  return {
    sweetness: clamp(point.display_x),
    hardness: displayYToHardness(point.display_y),
  };
}

function hasDisplayCoordinates(
  rice: MapProfile & { display_x?: number; display_y?: number },
): rice is MapDisplayPoint {
  return (
    typeof rice.display_x === "number" && typeof rice.display_y === "number"
  );
}

/**
 * Measures against the coordinates the user can actually see.
 *
 * `display_x` is sweetness. `display_y` is left inverted from stored hardness
 * so the top of the map is soft. The probe stores raw hardness / sweetness.
 */
export function calculateCoordinateDistance(
  target: TasteCoordinate,
  rice: MapProfile & { display_x?: number; display_y?: number },
) {
  const targetX = normalizeTasteValue(target.sweetness);
  const targetY = hardnessToDisplayY(target.hardness);

  const point = hasDisplayCoordinates(rice)
    ? { x: rice.display_x, y: rice.display_y }
    : {
        x: normalizeTasteValue(rice.sweetness),
        y: hardnessToDisplayY(rice.hardness),
      };

  const dx = point.x - targetX;
  const dy = point.y - targetY;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Consumer-facing affinity score in the 45-100 range.
 *
 * Kept deliberately soft so the closest brand still reads as a real suggestion even
 * when the probe sits in an empty part of the map.
 */
export function calculateDisplayScore(distance: number) {
  const normalized = Math.min(distance / MAX_DISTANCE, 1);
  const score = 100 - normalized * 55;
  return Math.max(0, Math.min(100, Math.round(score)));
}

function withPeriod(text: string) {
  const trimmed = text.trim();
  if (!trimmed) return "";
  return trimmed.endsWith("。") ? trimmed : `${trimmed}。`;
}

/**
 * Copy for a coordinate match. The score already says it is close to the probe —
 * do not repeat "いちばん近い". Prefer the brand's own short line.
 */
export function generateCoordinateReason(
  _target: TasteCoordinate,
  rice: MapProfile,
) {
  const short = withPeriod(rice.short_ ?? "");
  if (short) return short;

  const dish = rice.best_match_dishes.find(Boolean)?.trim();
  const highSweet = rice.sweetness >= 4;
  const highHard = rice.hardness >= 4;
  const soft = rice.hardness <= 2;
  const light = rice.sweetness <= 2;

  if (highSweet && highHard) {
    return dish
      ? `粒立ちと甘みがしっかりしていて、${dish}にも向きます。`
      : "粒立ちと甘みがしっかりした一膳です。";
  }

  if (highSweet && soft) {
    return dish
      ? `やわらかく甘みがあり、${dish}の日に向きます。`
      : "やわらかく、甘みのある一膳です。";
  }

  if (highHard && light) {
    return dish
      ? `粒が立って後味がすっきりし、${dish}を引き立てます。`
      : "粒が立って、後味がすっきりした一膳です。";
  }

  if (highHard) {
    return dish
      ? `粒立ちがあり、${dish}や丼ものにも負けにくいです。`
      : "粒立ちがあり、丼ものにも負けにくい一膳です。";
  }

  if (light) {
    return dish
      ? `重たくなく、${dish}や和食に合わせやすいです。`
      : "重たくなく、和食に合わせやすい一膳です。";
  }

  return dish
    ? `${dish}など、いつもの食卓に合わせやすい一膳です。`
    : "いつもの食卓に合わせやすい一膳です。";
}

/**
 * Local, synchronous coordinate ranking.
 *
 * Runs entirely on the client so map clicks, probe drags and slider moves respond
 * instantly and never trigger an embedding or vector-search request.
 */
export function calculateTopCoordinateMatches<T extends MapProfile>(
  riceList: readonly T[],
  target: TasteCoordinate,
  limit = 4,
): Array<RiceMatchResult<T>> {
  return riceList
    .map((rice) => {
      const distance = calculateCoordinateDistance(target, rice);
      return {
        rice,
        distance,
        score: calculateDisplayScore(distance),
        reason: generateCoordinateReason(target, rice),
      };
    })
    .sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      return a.rice.name.localeCompare(b.rice.name, "ja");
    })
    .slice(0, limit);
}

const NEIGHBOUR_DIMENSIONS = [
  "sweetness",
  "hardness",
  "stickiness",
  "aroma",
  "umami",
  "aftertaste",
  "grain_size",
  "clarity",
  "richness",
  "cold_rice_quality",
  "sauce_absorption",
  "oil_compatibility",
] as const satisfies ReadonlyArray<keyof MapProfile>;

const MAX_NEIGHBOUR_DISTANCE = Math.sqrt(NEIGHBOUR_DIMENSIONS.length) * 4;

/**
 * "Similar brands" over all twelve taste dimensions.
 *
 * Runs locally on the taste scores rather than fetching stored embeddings: the whole
 * catalogue of vectors would be megabytes of transfer for a panel that only needs three
 * names, and the taste scores are what the comparison is actually about.
 */
export function calculateTasteNeighbours<T extends MapProfile>(
  riceList: readonly T[],
  reference: MapProfile,
  limit = 3,
): Array<RiceMatchResult<T>> {
  return riceList
    .filter((rice) => rice.id !== reference.id)
    .map((rice) => {
      let sum = 0;
      for (const dimension of NEIGHBOUR_DIMENSIONS) {
        const delta =
          normalizeTasteValue(rice[dimension] as number) -
          normalizeTasteValue(reference[dimension] as number);
        sum += delta * delta;
      }
      const distance = Math.sqrt(sum);
      const normalized = Math.min(distance / MAX_NEIGHBOUR_DISTANCE, 1);

      return {
        rice,
        distance,
        score: Math.round(100 - normalized * 55),
        reason:
          rice.short_?.trim() ||
          `${rice.texture_label}・${rice.sweetness_label}な一膳です。`,
      };
    })
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);
}

/** Axis value to a percentage position, with an inset so edge points stay readable. */
export function valueToPosition(value: number, inset: number) {
  const band = 100 - inset * 2;
  const ratio = (clamp(value) - AXIS_MIN) / (AXIS_MAX - AXIS_MIN);
  return inset + ratio * band;
}

/** Pointer fraction (0-1) back to an axis value. */
export function positionToValue(fraction: number, inset: number) {
  const band = 100 - inset * 2;
  const ratio = (fraction * 100 - inset) / band;
  return clamp(AXIS_MIN + ratio * (AXIS_MAX - AXIS_MIN));
}
