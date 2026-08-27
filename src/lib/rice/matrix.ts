import type {
  RiceDisplayPoint,
  RiceMatchResult,
  RiceProfileV2,
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
  return ((hash % 1000) / 1000 - 0.5) * 0.18;
}

/** Minimum axis-unit gap after jitter, so integer-scored brands do not pile up. */
const SEPARATION = 0.15;
const SEPARATION_ITERS = 12;
const GOLDEN_ANGLE = Math.PI * (3 - Math.sqrt(5));

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

export function calculateMatrixDisplayPoint(rice: RiceProfileV2): RiceDisplayPoint {
  const baseX = normalizeTasteValue(rice.sweetness);
  const baseY = hardnessToDisplayY(rice.hardness);

  const offsetX =
    (normalizeTasteValue(rice.umami) - 3) * 0.08 +
    (normalizeTasteValue(rice.richness) - 3) * 0.04 +
    stableNoise(rice.id, "x");

  const offsetY =
    (normalizeTasteValue(rice.stickiness) - 3) * 0.08 +
    (normalizeTasteValue(rice.grain_size) - 3) * -0.06 +
    stableNoise(rice.id, "y");

  return {
    ...rice,
    display_x: Number(clamp(baseX + offsetX).toFixed(3)),
    display_y: Number(clamp(baseY + offsetY).toFixed(3)),
  };
}

/**
 * Spreads brands that share a hardness / sweetness cell, then nudges leftover overlaps.
 *
 * A sunflower spiral (stable by id) is the initial layout so integer scores do not start
 * in a pile. A few damped repulsion steps then separate neighbouring cells. Ranking uses
 * these same coordinates, so No.1 stays the nearest visible dot.
 */
function separateDisplayPoints(points: RiceDisplayPoint[]): RiceDisplayPoint[] {
  const xs = points.map((point) => point.display_x);
  const ys = points.map((point) => point.display_y);
  const groups = new Map<string, number[]>();

  points.forEach((point, index) => {
    const key = `${Math.round(normalizeTasteValue(point.hardness))}:${Math.round(normalizeTasteValue(point.sweetness))}`;
    const members = groups.get(key);
    if (members) members.push(index);
    else groups.set(key, [index]);
  });

  for (const [key, indexes] of groups) {
    indexes.sort((a, b) => points[a].id.localeCompare(points[b].id));
    if (indexes.length <= 1) continue;

    const cx = indexes.reduce((sum, index) => sum + xs[index], 0) / indexes.length;
    const cy = indexes.reduce((sum, index) => sum + ys[index], 0) / indexes.length;
    const rot = (stableHash(key) % 360) * (Math.PI / 180);

    indexes.forEach((index, i) => {
      const radius = SEPARATION * Math.sqrt(i);
      const angle = rot + i * GOLDEN_ANGLE;
      xs[index] = clamp(cx + Math.cos(angle) * radius);
      ys[index] = clamp(cy + Math.sin(angle) * radius);
    });
  }

  const minSq = SEPARATION * SEPARATION;

  for (let iter = 0; iter < SEPARATION_ITERS; iter += 1) {
    for (let i = 0; i < points.length; i += 1) {
      for (let j = i + 1; j < points.length; j += 1) {
        let dx = xs[j] - xs[i];
        let dy = ys[j] - ys[i];
        let distSq = dx * dx + dy * dy;

        if (distSq < 1e-8) {
          const angle = (stableHash(`${points[i].id}|${points[j].id}`) % 360) * (Math.PI / 180);
          dx = Math.cos(angle) * 0.002;
          dy = Math.sin(angle) * 0.002;
          distSq = dx * dx + dy * dy;
        }

        if (distSq >= minSq) continue;

        const dist = Math.sqrt(distSq);
        const push = ((SEPARATION - dist) / 2) * 0.6;
        const ux = dx / dist;
        const uy = dy / dist;
        xs[i] -= ux * push;
        ys[i] -= uy * push;
        xs[j] += ux * push;
        ys[j] += uy * push;
      }
    }

    for (let i = 0; i < points.length; i += 1) {
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

export function toDisplayPoints(riceList: RiceProfileV2[]): RiceDisplayPoint[] {
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
  rice: RiceProfileV2 | RiceDisplayPoint
): rice is RiceDisplayPoint {
  return "display_x" in rice && "display_y" in rice;
}

/**
 * Measures against the coordinates the user can actually see.
 *
 * `display_x` is sweetness. `display_y` is left inverted from stored hardness
 * so the top of the map is soft. The probe stores raw hardness / sweetness.
 */
export function calculateCoordinateDistance(
  target: TasteCoordinate,
  rice: RiceProfileV2 | RiceDisplayPoint
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

export function generateCoordinateReason(
  target: TasteCoordinate,
  rice: RiceProfileV2
) {
  const hardnessDelta = normalizeTasteValue(rice.hardness) - target.hardness;
  const sweetnessDelta = normalizeTasteValue(rice.sweetness) - target.sweetness;

  const highSweet = rice.sweetness >= 4;
  const highHard = rice.hardness >= 4;
  const soft = rice.hardness <= 2;
  const light = rice.sweetness <= 2;

  if (Math.abs(hardnessDelta) < 0.5 && Math.abs(sweetnessDelta) < 0.5) {
    return "選んだ粒感と甘みに最も近い、今日の食卓に静かに寄り添う一膳です。";
  }

  if (highSweet && highHard) {
    return "粒立ちのよさとふくよかな甘みが重なり、満足感のある一膳です。";
  }

  if (highSweet && soft) {
    return "やわらかな口当たりと豊かな甘みで、ほっとしたい日に向いています。";
  }

  if (highHard && light) {
    return "すっきりとした後味と粒立ちがあり、料理の輪郭を引き立てます。";
  }

  if (highHard) {
    return "粒立ちのよさで、丼ものや肉料理にも負けない存在感があります。";
  }

  if (light) {
    return "重たさを抑えた軽やかな味わいで、和食や魚料理に合わせやすい一膳です。";
  }

  return "甘みと口当たりのバランスがよく、毎日の食卓に合わせやすい一膳です。";
}

/**
 * Local, synchronous coordinate ranking.
 *
 * Runs entirely on the client so map clicks, probe drags and slider moves respond
 * instantly and never trigger an embedding or vector-search request.
 */
export function calculateTopCoordinateMatches(
  riceList: Array<RiceProfileV2 | RiceDisplayPoint>,
  target: TasteCoordinate,
  limit = 4
): RiceMatchResult[] {
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
] as const satisfies ReadonlyArray<keyof RiceProfileV2>;

const MAX_NEIGHBOUR_DISTANCE = Math.sqrt(NEIGHBOUR_DIMENSIONS.length) * 4;

/**
 * "Similar brands" over all twelve taste dimensions.
 *
 * Runs locally on the taste scores rather than fetching stored embeddings: the whole
 * catalogue of vectors would be megabytes of transfer for a panel that only needs three
 * names, and the taste scores are what the comparison is actually about.
 */
export function calculateTasteNeighbours(
  riceList: RiceProfileV2[],
  reference: RiceProfileV2,
  limit = 3
): RiceMatchResult[] {
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
        reason: `${rice.texture_label}・${rice.sweetness_label}の傾向が近い一膳です。`,
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
