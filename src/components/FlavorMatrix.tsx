"use client";

/**
 * FlavorMatrix
 *
 * KomeSomme's tasting instrument. One glass surface holds the matrix, an
 * editorial rail beside it carries the readout, the ranked matches, and the
 * semantic query.
 *
 * Axes: X = hardness (grain definition), Y = sweetness (richness).
 *
 * Ranking has two honest paths:
 *  - A probe coordinate cannot be projected into embedding space on the client,
 *    so probe ranking uses weighted flavour distance.
 *  - Brand to brand ranking uses real cosine similarity over the stored vectors,
 *    which are fetched lazily and fall back to flavour distance when absent.
 *  - Free text ranking is delegated to /api/recommend, which embeds server-side.
 *
 * Visual system: warm charcoal, dark ceramic, rice white, restrained straw-gold,
 * subtle glassmorphism, and quiet spring motion.
 * Radius rule: instrument surface 24px, inputs 12px, interactive pills full.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  motion,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
} from "motion/react";
import {
  ArrowUpRight,
  Drop,
  Sparkle,
  Warning,
  X,
} from "@phosphor-icons/react";
import { createBrowserClient } from "@/lib/supabase/client";

/* ------------------------------------------------------------------ types */

export interface RiceProfile {
  id: string;
  name: string;
  prefecture: string;
  sweetness: number;
  hardness: number;
  stickiness: number;
  best_match_dishes: string[] | null;
  description: string;
  rakuten_search_keyword: string | null;
}

export interface TasteCoordinate {
  hardness: number;
  sweetness: number;
}

export type SimilarityMethod = "cosine" | "flavour-distance";

export interface MatchResult {
  profile: RiceProfile;
  score: number;
  method: SimilarityMethod;
}

export interface SemanticMatch {
  id: string;
  name: string;
  prefecture: string;
  similarity: number;
}

interface PlacedProfile extends RiceProfile {
  left: number;
  top: number;
}

type SimilarityTarget =
  | { kind: "coordinate"; coordinate: TasteCoordinate }
  | { kind: "vector"; vector: number[]; coordinate: TasteCoordinate };

type LoadState = "loading" | "ready" | "error";
type RequestState = "idle" | "pending" | "error";
type RecommendationMode = "coordinate" | "semantic";

/* -------------------------------------------------------------- constants */

const AXIS_MIN = 1;
const AXIS_MAX = 5;
/** Percent inset so extreme values never touch the frame. */
const INSET = 10;
const BAND = 100 - INSET * 2;
const MATCH_LIMIT = 4;
const NEIGHBOUR_LIMIT = 3;
const ICON_WEIGHT = "bold" as const;
const ACCENT = "#b98b32";

const LAYER = { grid: 0, node: 10, probe: 20, bestNode: 30, overlay: 40 } as const;

const HARDNESS_SCALE = ["やわらか", "やわらか", "ほどよい", "粒立ち", "しっかり"];
const SWEETNESS_SCALE = ["すっきり", "すっきり", "ほの甘い", "甘み豊か", "ふくよか"];

const SELECT_COLUMNS =
  "id,name,prefecture,sweetness,hardness,stickiness,best_match_dishes,description,rakuten_search_keyword";

const SURFACE =
  "rounded-[2rem] border border-[var(--km-border)] bg-[var(--km-surface)]/90 shadow-[inset_0_1px_0_rgba(255,255,255,0.82),0_28px_70px_-46px_rgba(83,65,48,0.42)]";

const FOCUS =
  "focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--km-accent)]";

const REGION_STYLES = [
  {
    id: "hokkaido-tohoku",
    label: "北海道・東北",
    color: "#82977a",
    prefectures: ["北海道", "青森", "岩手", "宮城", "秋田", "山形", "福島"],
  },
  {
    id: "kanto-koshinetsu",
    label: "関東・甲信越",
    color: "#b29350",
    prefectures: ["茨城", "栃木", "群馬", "埼玉", "千葉", "東京", "神奈川", "新潟", "山梨", "長野"],
  },
  {
    id: "tokai-hokuriku",
    label: "東海・北陸",
    color: "#aa765e",
    prefectures: ["富山", "石川", "福井", "岐阜", "静岡", "愛知", "三重"],
  },
  {
    id: "kansai",
    label: "近畿",
    color: "#bea27e",
    prefectures: ["滋賀", "京都", "大阪", "兵庫", "奈良", "和歌山"],
  },
  {
    id: "chugoku-shikoku",
    label: "中国・四国",
    color: "#789693",
    prefectures: ["鳥取", "島根", "岡山", "広島", "山口", "徳島", "香川", "愛媛", "高知"],
  },
  {
    id: "kyushu-okinawa",
    label: "九州・沖縄",
    color: "#b77b72",
    prefectures: ["福岡", "佐賀", "長崎", "熊本", "大分", "宮崎", "鹿児島", "沖縄"],
  },
] as const;

/* ---------------------------------------------------------------- helpers */

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

export function normalizeTasteValue(value: number | null | undefined): number {
  return clamp(typeof value === "number" && Number.isFinite(value) ? value : 3, AXIS_MIN, AXIS_MAX);
}

/** Axis value to percent along the padded tasting surface. */
export function valueToPosition(
  value: number,
  min: number = AXIS_MIN,
  max: number = AXIS_MAX
): number {
  return INSET + ((clamp(value, min, max) - min) / (max - min)) * BAND;
}

/** Normalized pointer fraction back to an axis value. */
export function positionToValue(
  fraction: number,
  min: number = AXIS_MIN,
  max: number = AXIS_MAX
): number {
  return clamp(min + ((fraction * 100 - INSET) / BAND) * (max - min), min, max);
}

export function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length === 0 || a.length !== b.length) return 0;
  let dot = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dot / (Math.sqrt(normA) * Math.sqrt(normB));
}

export function calculateCoordinateDistance(
  target: TasteCoordinate,
  profile: RiceProfile
): number {
  const displayedHardness =
    "left" in profile && typeof profile.left === "number"
      ? positionToValue(profile.left / 100)
      : normalizeTasteValue(profile.hardness);
  const displayedSweetness =
    "top" in profile && typeof profile.top === "number"
      ? positionToValue(1 - profile.top / 100)
      : normalizeTasteValue(profile.sweetness);

  return Math.hypot(
    displayedHardness - target.hardness,
    displayedSweetness - target.sweetness
  );
}

export function calculateCoordinateScore(distance: number): number {
  const normalizedDistance = Math.max(0, distance) / 1.35;
  return clamp(1 / (1 + normalizedDistance ** 1.65), 0, 1);
}

function flavourDistanceScore(profile: RiceProfile, coordinate: TasteCoordinate): number {
  return calculateCoordinateScore(calculateCoordinateDistance(coordinate, profile));
}

export function calculateSimilarity(
  profile: RiceProfile,
  target: SimilarityTarget,
  vectors?: ReadonlyMap<string, number[]>
): MatchResult {
  if (target.kind === "vector") {
    const candidate = vectors?.get(profile.id);
    if (candidate && candidate.length === target.vector.length) {
      return {
        profile,
        score: (cosineSimilarity(target.vector, candidate) + 1) / 2,
        method: "cosine",
      };
    }
  }
  return {
    profile,
    score: flavourDistanceScore(profile, target.coordinate),
    method: "flavour-distance",
  };
}

function rankMatches(
  profiles: RiceProfile[],
  target: SimilarityTarget,
  limit: number,
  vectors?: ReadonlyMap<string, number[]>
): MatchResult[] {
  return profiles
    .map((profile) => calculateSimilarity(profile, target, vectors))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Several brands occupy the same integer cell (five sit on hardness 4 and
 * sweetness 4), so co-located brands fan out on a deterministic ring.
 */
function ringOffset(index: number, total: number): { dx: number; dy: number } {
  if (total <= 1) return { dx: 0, dy: 0 };
  const angle = index * 2.399963 + total * 0.31;
  const radius = (total <= 4 ? 2.4 : 3.1) + (index % 3) * 0.55;
  return { dx: Math.cos(angle) * radius, dy: Math.sin(angle) * radius };
}

/** Stable, small drift keeps integer taste values from looking mechanically plotted. */
function organicOffset(profile: RiceProfile): { dx: number; dy: number } {
  const seed = `${profile.id}:${profile.name}`;
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index++) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  const angle = ((hash >>> 0) / 4294967295) * Math.PI * 2;
  const radius = 0.7 + (((hash >>> 8) & 255) / 255) * 1.15;
  return { dx: Math.cos(angle) * radius, dy: Math.sin(angle) * radius };
}

function placeProfiles(profiles: RiceProfile[]): PlacedProfile[] {
  const cells = new Map<string, RiceProfile[]>();
  for (const profile of profiles) {
    const key = `${profile.hardness}:${profile.sweetness}`;
    const bucket = cells.get(key);
    if (bucket) bucket.push(profile);
    else cells.set(key, [profile]);
  }

  return profiles.map((profile) => {
    const key = `${profile.hardness}:${profile.sweetness}`;
    const bucket = cells.get(key) ?? [profile];
    const ring = ringOffset(bucket.indexOf(profile), bucket.length);
    const drift = organicOffset(profile);
    return {
      ...profile,
      left: valueToPosition(profile.hardness) + ring.dx + drift.dx,
      top: 100 - valueToPosition(profile.sweetness) + ring.dy + drift.dy,
    };
  });
}

/** pgvector arrives as a JSON string over PostgREST, or already parsed. */
function parseVector(raw: unknown): number[] | null {
  if (Array.isArray(raw) && raw.every((v) => typeof v === "number")) return raw;
  if (typeof raw === "string") {
    try {
      const parsed: unknown = JSON.parse(raw);
      if (Array.isArray(parsed) && parsed.every((v) => typeof v === "number")) return parsed;
    } catch {
      return null;
    }
  }
  return null;
}

function rakutenUrl(keyword: string): string {
  return `https://search.rakuten.co.jp/search/mall/${encodeURIComponent(keyword)}/`;
}

function scaleLabel(scale: string[], value: number): string {
  return scale[clamp(Math.round(value), AXIS_MIN, AXIS_MAX) - 1];
}

function regionColor(prefecture: string): string {
  const region = REGION_STYLES.find(({ prefectures }) =>
    prefectures.some((name) => prefecture.includes(name))
  );
  return region?.color ?? "#998a74";
}

function formatScore(score: number): string {
  return String(Math.round(clamp(score, 0, 1) * 100));
}

function getMatchReason(
  profile: RiceProfile,
  coordinate: TasteCoordinate,
  mode: RecommendationMode
): string {
  if (mode === "semantic") {
    return "料理や気分の言葉に、味わいの特徴がよく重なる一膳です。";
  }
  const hardnessDelta = profile.hardness - coordinate.hardness;
  const sweetnessDelta = profile.sweetness - coordinate.sweetness;
  if (Math.abs(hardnessDelta) < 0.55 && Math.abs(sweetnessDelta) < 0.55) {
    return "選んだ粒感と甘みに最も近い、今日の食卓に静かに寄り添う一膳です。";
  }
  if (hardnessDelta > 0.6) return "今の味わいを保ちながら、もう少し粒立ちを感じたいときに。";
  if (hardnessDelta < -0.6) return "今の味わいを保ちながら、やわらかな口当たりを楽しみたいときに。";
  if (sweetnessDelta > 0.6) return "今の粒感に、ふくよかな甘みを添えたい食卓に。";
  if (sweetnessDelta < -0.6) return "甘みを少し抑え、すっきりと味わいたい食卓に。";
  return "現在の味わいに近い候補です。";
}

/* ------------------------------------------------------------- component */

export function FlavorMatrix() {
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);
  const [profiles, setProfiles] = useState<RiceProfile[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const [coordinate, setCoordinate] = useState<TasteCoordinate>({ hardness: 3, sweetness: 3 });
  const [engaged, setEngaged] = useState(false);

  const [vectors, setVectors] = useState<Map<string, number[]> | null>(null);
  const [vectorState, setVectorState] = useState<RequestState>("idle");

  const [query, setQuery] = useState("");
  const [recommendationMode, setRecommendationMode] =
    useState<RecommendationMode>("coordinate");
  const [semanticState, setSemanticState] = useState<RequestState>("idle");
  const [semanticMatches, setSemanticMatches] = useState<SemanticMatch[] | null>(null);

  const reduceMotion = Boolean(useReducedMotion());
  const canvasRef = useRef<HTMLDivElement>(null);
  const frameRef = useRef<number | null>(null);

  // Continuous pointer values stay outside React so dragging never re-renders.
  const hardnessMV = useMotionValue(3);
  const sweetnessMV = useMotionValue(3);
  const spring = reduceMotion
    ? { duration: 0 }
    : { stiffness: 300, damping: 32, mass: 0.55 };
  const hardnessSmooth = useSpring(hardnessMV, spring);
  const sweetnessSmooth = useSpring(sweetnessMV, spring);
  const probeLeft = useTransform(hardnessSmooth, (v: number) => `${valueToPosition(v)}%`);
  const probeTop = useTransform(sweetnessSmooth, (v: number) => `${100 - valueToPosition(v)}%`);

  /**
   * Read both latest motion values inside the frame. A click updates hardness
   * and sweetness sequentially; capturing either event's arguments can pair a
   * new axis value with the previous value from the other axis.
   */
  const commitCoordinate = useCallback(() => {
    if (frameRef.current !== null) return;
    frameRef.current = requestAnimationFrame(() => {
      frameRef.current = null;
      const hardness = hardnessMV.get();
      const sweetness = sweetnessMV.get();
      setCoordinate({
        hardness: Math.round(hardness * 25) / 25,
        sweetness: Math.round(sweetness * 25) / 25,
      });
    });
  }, [hardnessMV, sweetnessMV]);

  useMotionValueEvent(hardnessMV, "change", commitCoordinate);
  useMotionValueEvent(sweetnessMV, "change", commitCoordinate);

  useEffect(() => {
    return () => {
      if (frameRef.current !== null) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  const loadProfiles = useCallback(async () => {
    setLoadState("loading");
    setLoadError(null);
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase
        .from("rice_brands")
        .select(SELECT_COLUMNS)
        .order("name", { ascending: true });

      if (error) throw new Error(error.message);
      setProfiles((data ?? []) as RiceProfile[]);
      setLoadState("ready");
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : "不明なエラーが発生しました");
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  /** Vectors are large, so they load only when brand to brand similarity is requested. */
  const loadVectors = useCallback(async () => {
    if (vectors || vectorState === "pending") return;
    setVectorState("pending");
    try {
      const supabase = createBrowserClient();
      const { data, error } = await supabase.from("rice_brands").select("id,embedding");
      if (error) throw new Error(error.message);

      const map = new Map<string, number[]>();
      for (const row of data ?? []) {
        const parsed = parseVector(row.embedding);
        if (parsed) map.set(row.id, parsed);
      }
      setVectors(map);
      setVectorState(map.size > 0 ? "idle" : "error");
    } catch {
      setVectorState("error");
    }
  }, [vectors, vectorState]);

  const placed = useMemo(() => placeProfiles(profiles), [profiles]);

  const probeTarget = useMemo<SimilarityTarget>(
    () => ({ kind: "coordinate", coordinate }),
    [coordinate]
  );

  const probeMatches = useMemo(
    () => rankMatches(placed, probeTarget, MATCH_LIMIT),
    [placed, probeTarget]
  );

  const scoreById = useMemo(() => {
    const map = new Map<string, number>();
    for (const profile of placed) {
      map.set(profile.id, flavourDistanceScore(profile, coordinate));
    }
    return map;
  }, [placed, coordinate]);

  const railMatches = useMemo<MatchResult[]>(() => {
    if (recommendationMode === "coordinate") return probeMatches;
    if (!semanticMatches?.length) return [];
    const byId = new Map(placed.map((profile) => [profile.id, profile]));
    return semanticMatches.flatMap((match) => {
      const profile = byId.get(match.id);
      return profile
        ? [{ profile, score: match.similarity, method: "cosine" as SimilarityMethod }]
        : [];
    });
  }, [recommendationMode, semanticMatches, placed, probeMatches]);

  const selected = useMemo(
    () => placed.find((profile) => profile.id === selectedId) ?? null,
    [placed, selectedId]
  );

  const neighbours = useMemo<MatchResult[]>(() => {
    if (!selected) return [];
    const pool = placed.filter((profile) => profile.id !== selected.id);
    const reference = vectors?.get(selected.id);
    const target: SimilarityTarget = reference
      ? {
          kind: "vector",
          vector: reference,
          coordinate: { hardness: selected.hardness, sweetness: selected.sweetness },
        }
      : {
          kind: "coordinate",
          coordinate: { hardness: selected.hardness, sweetness: selected.sweetness },
        };
    return rankMatches(pool, target, NEIGHBOUR_LIMIT, vectors ?? undefined);
  }, [selected, placed, vectors]);

  const moveProbe = useCallback(
    (clientX: number, clientY: number) => {
      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect || rect.width === 0 || rect.height === 0) return;
      setRecommendationMode("coordinate");
      hardnessMV.set(positionToValue((clientX - rect.left) / rect.width));
      sweetnessMV.set(positionToValue(1 - (clientY - rect.top) / rect.height));
    },
    [hardnessMV, sweetnessMV]
  );

  const setAxis = useCallback(
    (axis: keyof TasteCoordinate, value: number) => {
      const next = clamp(value, AXIS_MIN, AXIS_MAX);
      setRecommendationMode("coordinate");
      if (axis === "hardness") hardnessMV.set(next);
      else sweetnessMV.set(next);
      setCoordinate((prev) => ({ ...prev, [axis]: next }));
    },
    [hardnessMV, sweetnessMV]
  );

  const runSemantic = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setRecommendationMode("semantic");
    setSemanticMatches(null);
    setSemanticState("pending");
    try {
      const response = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, matchCount: MATCH_LIMIT }),
      });
      const payload = (await response.json()) as {
        matches?: SemanticMatch[];
        message?: string;
      };
      if (!response.ok) {
        throw new Error(payload.message ?? `推薦に失敗しました (${response.status})`);
      }
      setSemanticMatches(payload.matches ?? []);
      setSemanticState("idle");
    } catch (cause) {
      console.error("Semantic recommendation failed:", cause);
      setSemanticState("error");
    }
  }, [query]);

  const resetSemantic = useCallback(() => {
    setRecommendationMode("coordinate");
    setSemanticMatches(null);
    setSemanticState("idle");
    setQuery("");
  }, []);

  const topMatches = railMatches;
  const primaryMatch = topMatches[0] ?? null;
  const runnerUpMatches = topMatches.slice(1, MATCH_LIMIT);

  return (
    <section
      className="relative mx-auto w-full max-w-[1400px] overflow-hidden rounded-[1.5rem] px-3 py-5 text-[var(--km-ink)] sm:px-5 sm:py-7 lg:rounded-[2.5rem] lg:px-6 lg:py-4"
      style={{
        ["--km-accent" as string]: ACCENT,
        background:
          "radial-gradient(circle at 14% 0%, rgba(255,255,255,0.72), transparent 32%), radial-gradient(circle at 88% 82%, rgba(185,139,50,0.11), transparent 38%), linear-gradient(145deg, #f3eadb 0%, #e9dcc8 100%)",
      }}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.055] mix-blend-multiply"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 180 180' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.82' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='.38'/%3E%3C/svg%3E\")",
        }}
      />
      <div className="relative grid gap-5 lg:grid-cols-[minmax(0,680px)_1fr] lg:items-stretch xl:grid-cols-[minmax(0,720px)_1fr] xl:gap-6">
        {/* Instrument surface */}
        <div className={`relative flex w-full min-h-0 flex-col overflow-hidden ${SURFACE}`}>
          <div
            aria-hidden
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                "radial-gradient(110% 80% at 15% 0%, rgba(255,255,255,0.58), transparent 58%), radial-gradient(90% 70% at 92% 100%, rgba(185,139,50,0.08), transparent 62%)",
            }}
          />

          <div className="relative shrink-0 px-5 pt-6 sm:px-7 sm:pt-7 lg:px-7 lg:pt-5 xl:px-9 xl:pt-7">
            <h2 className="text-2xl font-semibold leading-tight tracking-tighter text-[var(--km-ink)] sm:text-3xl xl:text-4xl">
              風味マトリクス
            </h2>
            <p className="mt-2 max-w-[44ch] text-xs leading-relaxed text-[var(--km-ink-soft)] sm:text-sm">
              探針を置くと、味わいの近い銘柄が静かに浮かび上がります。
            </p>
          </div>

          {loadState === "error" ? (
            <ErrorPanel message={loadError} onRetry={() => void loadProfiles()} />
          ) : (
            <div className="relative px-4 pb-4 pt-4 sm:px-7 sm:pb-5 lg:px-7 lg:pb-4 lg:pt-3 xl:px-8 xl:pb-4">
              <div className="flex gap-3 sm:gap-4">
                <AxisLegend orientation="vertical" low="すっきり" high="ふくよか" name="甘み" />

                <div className="flex min-w-0 flex-1 flex-col">
                  <div
                    ref={canvasRef}
                    onPointerDown={(event) => {
                      if (loadState !== "ready") return;
                      event.currentTarget.setPointerCapture(event.pointerId);
                      setEngaged(true);
                      moveProbe(event.clientX, event.clientY);
                    }}
                    onPointerMove={(event) => {
                      if (engaged) moveProbe(event.clientX, event.clientY);
                    }}
                    onPointerUp={(event) => {
                      event.currentTarget.releasePointerCapture(event.pointerId);
                      setEngaged(false);
                    }}
                    onPointerCancel={() => setEngaged(false)}
                    className="relative aspect-square w-full touch-none select-none overflow-hidden rounded-[1.25rem] border border-[var(--km-border)] bg-[#f8f1e4] shadow-[inset_0_1px_0_rgba(255,255,255,0.85),inset_0_0_80px_rgba(185,139,50,0.06)] sm:rounded-[1.5rem]"
                  >
                    <MatrixGrid />
                    <QuadrantHints />

                    {loadState === "loading" ? (
                      <MatrixSkeleton />
                    ) : profiles.length === 0 ? (
                      <EmptyPanel />
                    ) : (
                      <>
                        {placed.map((profile, index) => {
                          const isBestMatch = topMatches[0]?.profile.id === profile.id;
                          const isRunnerUp = topMatches
                            .slice(1, 4)
                            .some((match) => match.profile.id === profile.id);

                          return (
                            <ProfileNode
                              key={profile.id}
                              profile={profile}
                              index={index}
                              reduceMotion={reduceMotion}
                              isBestMatch={isBestMatch}
                              isRunnerUp={isRunnerUp}
                              active={profile.id === selectedId}
                              onSelect={() => setSelectedId(profile.id)}
                            />
                          );
                        })}

                        <motion.div
                          aria-hidden
                          style={{ left: probeLeft, top: probeTop, zIndex: LAYER.probe }}
                          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2"
                        >
                          <div className="relative grid h-20 w-20 place-items-center rounded-full bg-[var(--km-ink)]/[0.025] md:h-24 md:w-24">
                            <motion.span
                              key={`${coordinate.hardness}-${coordinate.sweetness}`}
                              className="absolute inset-0 rounded-full border border-[var(--km-ink)]/15"
                              animate={
                                reduceMotion || engaged
                                  ? { scale: 1, opacity: 0.36 }
                                  : { scale: [0.45, 2.05], opacity: [0.45, 0] }
                              }
                              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
                            />
                            <span className="grid h-5 w-5 place-items-center rounded-full border border-[var(--km-ink)]/20 bg-[var(--km-ink)] shadow-[0_6px_18px_rgba(83,65,48,0.22)]">
                              <Drop size={10} weight="fill" className="text-[#f4dfb2]" />
                            </span>
                          </div>
                        </motion.div>
                      </>
                    )}
                  </div>

                  <AxisLegend
                    orientation="horizontal"
                    low="やわらか"
                    high="しっかり"
                    name="粒感"
                  />
                </div>
              </div>
            </div>
          )}

          <TasteControls coordinate={coordinate} onAxisChange={setAxis} />
        </div>

        <aside className="flex h-full min-h-0 flex-col divide-y divide-[var(--km-border)] rounded-[2rem] border border-[var(--km-border)] bg-[var(--km-surface)]/92 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.78),0_28px_70px_-46px_rgba(83,65,48,0.38)] sm:p-6 lg:p-5 xl:p-6">
          <div className="flex flex-1 flex-col pb-5 lg:pb-5 xl:pb-6">
            <div className="flex items-baseline justify-between gap-4">
              <h3 className="text-base font-semibold tracking-tight text-[var(--km-ink)]">
                侍米師のおすすめ
              </h3>
              {recommendationMode === "semantic" ? (
                <button
                  type="button"
                  onClick={resetSemantic}
                  className={`whitespace-nowrap rounded-full px-2 py-1 text-xs text-[var(--km-muted)] transition hover:text-[var(--km-gold)] ${FOCUS}`}
                >
                  座標に戻す
                </button>
              ) : null}
            </div>

            <div className="mt-5 lg:mt-4 xl:mt-5">
              {loadState === "loading" ? (
                <RailSkeleton />
              ) : semanticState === "pending" ? (
                <SemanticReading reduceMotion={reduceMotion} />
              ) : railMatches.length === 0 ? (
                <p className="py-6 text-sm text-[var(--km-muted)]">
                  該当する銘柄が見つかりませんでした。
                </p>
              ) : (
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`${recommendationMode}-${primaryMatch?.profile.id ?? "empty"}`}
                    initial={reduceMotion ? false : { opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: -6 }}
                    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
                  >
                    {primaryMatch ? (
                      <BestMatchCard
                        match={primaryMatch}
                        reason={getMatchReason(
                          primaryMatch.profile,
                          coordinate,
                          recommendationMode
                        )}
                        active={primaryMatch.profile.id === selectedId}
                        onSelect={() => setSelectedId(primaryMatch.profile.id)}
                      />
                    ) : null}
                    {runnerUpMatches.length > 0 ? (
                      <RunnerUpList
                        matches={runnerUpMatches}
                        coordinate={coordinate}
                        mode={recommendationMode}
                        activeId={selectedId}
                        reduceMotion={reduceMotion}
                        onSelect={setSelectedId}
                      />
                    ) : null}
                  </motion.div>
                </AnimatePresence>
              )}
            </div>
          </div>

          <div className="mt-auto shrink-0 pt-5 lg:pt-5 xl:pt-6">
            <h3 className="text-base font-semibold tracking-tight text-[var(--km-ink)]">
              侍米師に相談
            </h3>
            <p className="mt-2 text-sm leading-relaxed text-[var(--km-ink-soft)]">
              料理や気分から、今日の一膳を探します。
            </p>
            <form
              className="mt-5 flex flex-col gap-2"
              onSubmit={(event) => {
                event.preventDefault();
                void runSemantic();
              }}
            >
              <label htmlFor="km-query" className="text-xs text-[var(--km-ink-soft)]">
                料理や好み
              </label>
              <input
                id="km-query"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="例：刺身に合う、冷めても美味しい"
                className="w-full rounded-xl border border-[var(--km-border)] bg-white/65 px-3.5 py-3 text-sm text-[var(--km-ink)] placeholder:text-[var(--km-muted)] focus:border-[var(--km-gold)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--km-gold)]/20"
              />
              <button
                type="submit"
                disabled={semanticState === "pending" || query.trim().length === 0}
                className={`mt-2 inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[var(--km-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--km-gold-strong)] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-40 ${FOCUS}`}
              >
                <Sparkle size={15} weight={ICON_WEIGHT} />
                {semanticState === "pending"
                  ? "味わいを読み解いています"
                  : "一膳を提案してもらう"}
              </button>
            </form>

            {semanticState === "error" ? (
              <p className="mt-4 flex items-start gap-2 text-xs leading-relaxed text-rose-700">
                <Warning size={13} weight={ICON_WEIGHT} className="mt-0.5 shrink-0" />
                うまく読み取れませんでした。少し言葉を変えて、もう一度お試しください。
              </p>
            ) : (
              <p className="mt-4 max-w-[40ch] text-xs leading-relaxed text-[var(--km-muted)]">
                料理や好みの言葉から、味わいの近い銘柄を探します。
              </p>
            )}
          </div>
        </aside>
      </div>

      <AnimatePresence>
        {selected ? (
          <DetailPanel
            profile={selected}
            score={scoreById.get(selected.id) ?? 0}
            neighbours={neighbours}
            vectorState={vectorState}
            hasVectors={Boolean(vectors?.has(selected.id))}
            reduceMotion={reduceMotion}
            onLoadVectors={() => void loadVectors()}
            onSelect={(id) => setSelectedId(id)}
            onClose={() => setSelectedId(null)}
          />
        ) : null}
      </AnimatePresence>
    </section>
  );
}

/* ----------------------------------------------------------- sub surfaces */

function MatrixGrid() {
  const ticks = [0, 1, 2, 3, 4];
  return (
    <div aria-hidden className="absolute inset-0" style={{ zIndex: LAYER.grid }}>
      {ticks.map((tick) => {
        const pos = INSET + (tick / 4) * BAND;
        return (
          <div key={tick}>
            <div
              className={`absolute top-0 h-full w-px ${
                tick === 2 ? "bg-[var(--km-ink)]/18" : "bg-[var(--km-grid)]"
              }`}
              style={{ left: `${pos}%` }}
            />
            <div
              className={`absolute left-0 h-px w-full ${
                tick === 2 ? "bg-[var(--km-ink)]/18" : "bg-[var(--km-grid)]"
              }`}
              style={{ top: `${pos}%` }}
            />
          </div>
        );
      })}
    </div>
  );
}

function QuadrantHints() {
  const hints = [
    { className: "bottom-5 left-5", first: "軽やかで", second: "すっきり" },
    { className: "left-5 top-5", first: "やわらかく", second: "甘み豊か" },
    { className: "bottom-5 right-5 text-right", first: "しっかり", second: "淡麗" },
    { className: "right-5 top-5 text-right", first: "粒立ちよく", second: "甘み豊か" },
  ];
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0">
      {hints.map((hint) => (
        <p
          key={hint.first}
          className={`absolute max-w-24 text-[10px] leading-relaxed tracking-[0.08em] text-[var(--km-ink-soft)]/60 ${hint.className}`}
        >
          {hint.first}
          <br />
          {hint.second}
        </p>
      ))}
    </div>
  );
}

function AxisLegend({
  orientation,
  low,
  high,
  name,
}: {
  orientation: "horizontal" | "vertical";
  low: string;
  high: string;
  name: string;
}) {
  if (orientation === "vertical") {
    return (
      <div className="flex w-5 shrink-0 flex-col items-center justify-between py-1 text-[11px] text-[var(--km-muted)]">
        <span className="whitespace-nowrap [writing-mode:vertical-rl]">{high}</span>
        <span className="whitespace-nowrap font-medium text-[var(--km-ink)] [writing-mode:vertical-rl]">
          {name}
        </span>
        <span className="whitespace-nowrap [writing-mode:vertical-rl]">{low}</span>
      </div>
    );
  }

  return (
    <div className="mt-3 flex items-center justify-between text-[11px] text-[var(--km-muted)]">
      <span>{low}</span>
      <span className="font-medium text-[var(--km-ink)]">{name}</span>
      <span>{high}</span>
    </div>
  );
}

function ProfileNode({
  profile,
  index,
  isBestMatch,
  isRunnerUp,
  active,
  reduceMotion,
  onSelect,
}: {
  profile: PlacedProfile;
  index: number;
  isBestMatch: boolean;
  isRunnerUp: boolean;
  active: boolean;
  reduceMotion: boolean;
  onSelect: () => void;
}) {
  const baseSize = 10 + profile.stickiness * 2;
  const size = isBestMatch ? baseSize + 10 : isRunnerUp ? baseSize + 4 : baseSize;
  const grainShape =
    index % 3 === 0
      ? "rounded-[58%_42%_52%_48%]"
      : index % 3 === 1
        ? "rounded-[46%_54%_43%_57%]"
        : "rounded-[52%_48%_60%_40%]";
  const nodeShape = isBestMatch ? "rounded-full" : grainShape;

  return (
    <motion.button
      type="button"
      onPointerDown={(event) => event.stopPropagation()}
      onClick={onSelect}
      aria-label={`${profile.name} ${profile.prefecture} 粒感 ${profile.hardness} 甘み ${profile.sweetness}`}
      initial={reduceMotion ? false : { opacity: 0, scale: 0.55 }}
      animate={{
        opacity: isBestMatch ? 1 : isRunnerUp ? 0.95 : active ? 1 : 0.78,
        scale: active && !isBestMatch ? 1.16 : 1,
      }}
      transition={{
        duration: 0.55,
        delay: reduceMotion ? 0 : Math.min(index * 0.022, 0.44),
        ease: [0.16, 1, 0.3, 1],
      }}
      style={{
        left: `${profile.left}%`,
        top: `${profile.top}%`,
        width: size,
        height: size,
        ["--node-color" as string]: regionColor(profile.prefecture),
        zIndex: isBestMatch
          ? LAYER.bestNode
          : isRunnerUp
            ? LAYER.node + 5
            : LAYER.node + (active ? 3 : 0),
      }}
      className={`group absolute -translate-x-1/2 -translate-y-1/2 rounded-full ${FOCUS}`}
    >
      <span
        className={`absolute inset-0 ${nodeShape} border transition-colors duration-500 ${
          isBestMatch
            ? "border-[#8e6822]/30 bg-[var(--km-gold-strong)] ring-2 ring-[var(--km-gold)]/30 shadow-[0_0_0_5px_rgba(185,139,50,0.10),0_8px_20px_rgba(83,65,48,0.20)]"
            : isRunnerUp
              ? "border-[var(--km-gold)]/35 bg-[var(--km-gold)]/72 ring-1 ring-[var(--km-gold)]/15"
              : active
                ? "border-[var(--km-ink)]/40 bg-[var(--node-color)] ring-2 ring-[var(--km-ink)]/15"
                : "border-[var(--km-ink)]/20 bg-[var(--node-color)] group-hover:border-[var(--km-ink)]/40"
        }`}
      />
      {isBestMatch && !reduceMotion ? (
        <motion.span
          className="absolute inset-0 rounded-full border border-[var(--km-gold)]/45"
          animate={{ scale: [1, 2.05], opacity: [0.45, 0] }}
          transition={{
            duration: 2.4,
            repeat: Infinity,
            ease: "easeOut",
            delay: 0.25,
          }}
        />
      ) : null}
      <span
        className={`pointer-events-none absolute left-1/2 top-full mt-3 -translate-x-1/2 whitespace-nowrap rounded-md border bg-[var(--km-surface)]/95 px-2.5 py-1 text-[10px] tracking-tight shadow-[0_8px_20px_rgba(83,65,48,0.16)] backdrop-blur-xl transition-opacity duration-200 ${
          isBestMatch
            ? "border-[var(--km-gold)]/35 bg-[#f2e4c8]/95 px-3 py-1.5 text-[11px] font-medium text-[var(--km-ink)] opacity-100"
            : isRunnerUp
              ? "border-[var(--km-border)] text-[var(--km-ink-soft)] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
              : "border-[var(--km-border)] text-[var(--km-ink)] opacity-0 group-hover:opacity-100 group-focus-visible:opacity-100"
        }`}
      >
        {isBestMatch ? `最も近い一膳｜${profile.name}` : profile.name}
      </span>
    </motion.button>
  );
}

function ReadoutRow({
  label,
  value,
  scale,
}: {
  label: string;
  value: number;
  scale: string[];
}) {
  return (
    <div className="flex items-end justify-between gap-4">
      <div>
        <p className="text-xs text-[var(--km-muted)]">{label}</p>
        <p className="mt-1 text-sm text-[var(--km-ink-soft)]">{scaleLabel(scale, value)}</p>
      </div>
      <p className="font-mono text-2xl leading-none tracking-tight text-[var(--km-ink)]">
        {value.toFixed(2)}
      </p>
    </div>
  );
}

function AxisControl({
  id,
  label,
  value,
  readout,
  onChange,
}: {
  id: string;
  label: string;
  value: number;
  readout: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={id} className="text-xs text-[var(--km-muted)]">
        {label}
      </label>
      <input
        id={id}
        type="range"
        min={AXIS_MIN}
        max={AXIS_MAX}
        step={0.04}
        value={value}
        aria-valuetext={readout}
        onChange={(event) => onChange(Number(event.target.value))}
        className={`h-1 w-full cursor-pointer appearance-none rounded-full bg-[var(--km-ink)]/15 accent-[var(--km-accent)] ${FOCUS}`}
      />
    </div>
  );
}

function TasteControls({
  coordinate,
  onAxisChange,
}: {
  coordinate: TasteCoordinate;
  onAxisChange: (axis: keyof TasteCoordinate, value: number) => void;
}) {
  return (
    <section className="relative shrink-0 border-t border-[var(--km-border)] bg-[var(--km-surface-warm)]/55 px-5 py-3 sm:px-7 lg:px-7 xl:px-8">
      <div className="mb-3 flex items-center justify-between gap-4">
        <h3 className="text-sm font-semibold tracking-tight text-[var(--km-ink)]">
          現在の味わい
        </h3>
        <RegionLegend />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-xl border border-[var(--km-border)] bg-white/45 p-3">
          <ReadoutRow label="粒感" value={coordinate.hardness} scale={HARDNESS_SCALE} />
          <div className="mt-3">
            <AxisControl
              id="km-hardness"
              label="粒感を選ぶ"
              value={coordinate.hardness}
              readout={scaleLabel(HARDNESS_SCALE, coordinate.hardness)}
              onChange={(value) => onAxisChange("hardness", value)}
            />
          </div>
        </div>
        <div className="rounded-xl border border-[var(--km-border)] bg-white/45 p-3">
          <ReadoutRow label="甘み" value={coordinate.sweetness} scale={SWEETNESS_SCALE} />
          <div className="mt-3">
            <AxisControl
              id="km-sweetness"
              label="甘みを選ぶ"
              value={coordinate.sweetness}
              readout={scaleLabel(SWEETNESS_SCALE, coordinate.sweetness)}
              onChange={(value) => onAxisChange("sweetness", value)}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

function RegionLegend() {
  return (
    <ul
      aria-label="産地域の色分け"
      className="hidden flex-wrap justify-end gap-x-3 gap-y-1.5 text-[10px] text-[var(--km-muted)] md:flex"
    >
      {REGION_STYLES.map((region) => (
        <li key={region.id} className="inline-flex items-center gap-1.5 whitespace-nowrap">
          <span
            aria-hidden
            className="h-2 w-2 rounded-[55%_45%_50%_50%]"
            style={{ backgroundColor: region.color }}
          />
          {region.label}
        </li>
      ))}
    </ul>
  );
}

function BestMatchCard({
  match,
  reason,
  active,
  onSelect,
}: {
  match: MatchResult;
  reason: string;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={`group w-full rounded-2xl border p-5 text-left transition duration-300 active:scale-[0.99] ${FOCUS} ${
        active
          ? "border-[var(--km-gold)]/45 bg-[#f1e2c5]"
          : "border-[var(--km-border)] bg-[var(--km-surface-warm)]/58 hover:border-[var(--km-gold)]/40"
      } shadow-[inset_0_1px_0_rgba(255,255,255,0.72),0_20px_48px_-34px_rgba(83,65,48,0.30)]`}
    >
      <span className="flex items-start justify-between gap-5">
        <span>
          <span className="block text-[11px] tracking-[0.12em] text-[var(--km-accent)]">
            侍米師の一膳
          </span>
          <span className="mt-3 block text-xl font-semibold tracking-tight text-[var(--km-ink)] transition-colors group-hover:text-[var(--km-gold)]">
            {match.profile.name}
          </span>
          <span className="mt-1 block text-xs text-[var(--km-muted)]">
            {match.profile.prefecture}
          </span>
        </span>
        <span className="shrink-0 text-right">
          <span className="block text-[10px] text-[var(--km-muted)]">相性</span>
          <span className="mt-1 block font-mono text-2xl tabular-nums text-[var(--km-accent)]">
            {formatScore(match.score)}
          </span>
        </span>
      </span>
      <span className="mt-4 block border-t border-[var(--km-border)] pt-3 text-xs leading-relaxed text-[var(--km-ink-soft)]">
        {reason}
      </span>
      <span className="mt-3 flex items-center gap-4 text-[11px] text-[var(--km-muted)]">
        <span>粒感 {match.profile.hardness}</span>
        <span>甘み {match.profile.sweetness}</span>
        <span>粘り {match.profile.stickiness}</span>
      </span>
    </button>
  );
}

function RunnerUpList({
  matches,
  coordinate,
  mode,
  activeId,
  reduceMotion,
  onSelect,
}: {
  matches: MatchResult[];
  coordinate: TasteCoordinate;
  mode: RecommendationMode;
  activeId: string | null;
  reduceMotion: boolean;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="mt-5">
      <p className="mb-2 text-xs font-medium text-[var(--km-ink-soft)]">近い味わいの銘柄</p>
      <ol className="divide-y divide-[var(--km-border)]">
        {matches.map((match, index) => (
          <motion.li
            key={match.profile.id}
            layout={!reduceMotion}
            initial={reduceMotion ? false : { opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.32,
              delay: index * 0.05,
              ease: [0.22, 1, 0.36, 1],
            }}
          >
            <button
              type="button"
              onClick={() => onSelect(match.profile.id)}
              className={`group grid w-full grid-cols-[2rem_minmax(0,1fr)_auto] items-center gap-3 py-3.5 text-left ${FOCUS}`}
            >
              <span className="font-mono text-xs text-[var(--km-muted)]">0{index + 2}</span>
              <span className="min-w-0">
                <span
                  className={`block truncate text-sm transition-colors ${
                    activeId === match.profile.id
                      ? "text-[var(--km-accent)]"
                      : "text-[var(--km-ink)] group-hover:text-[var(--km-accent)]"
                  }`}
                >
                  {match.profile.name}
                </span>
                <span className="mt-1 block truncate text-[11px] text-[var(--km-muted)]">
                  {getMatchReason(match.profile, coordinate, mode)}
                </span>
              </span>
              <span className="font-mono text-xs tabular-nums text-[var(--km-ink-soft)]">
                相性 {formatScore(match.score)}
              </span>
            </button>
          </motion.li>
        ))}
      </ol>
    </div>
  );
}

function SemanticReading({ reduceMotion }: { reduceMotion: boolean }) {
  return (
    <div className="flex items-center gap-3 border-y border-[var(--km-border)] py-6">
      <motion.span
        className="h-3 w-2 rounded-[55%_45%_50%_50%] bg-[var(--km-accent)]/70"
        animate={reduceMotion ? undefined : { opacity: [0.35, 1, 0.35], scale: [0.9, 1.08, 0.9] }}
        transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
      />
      <p className="text-sm text-[var(--km-ink-soft)]">料理に合う一膳を探しています</p>
    </div>
  );
}

function DetailPanel({
  profile,
  score,
  neighbours,
  vectorState,
  hasVectors,
  reduceMotion,
  onLoadVectors,
  onSelect,
  onClose,
}: {
  profile: PlacedProfile;
  score: number;
  neighbours: MatchResult[];
  vectorState: RequestState;
  hasVectors: boolean;
  reduceMotion: boolean;
  onLoadVectors: () => void;
  onSelect: (id: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const dishes = profile.best_match_dishes ?? [];
  const method = neighbours[0]?.method ?? "flavour-distance";

  return (
    <div className="fixed inset-0" style={{ zIndex: LAYER.overlay }}>
      <motion.button
        type="button"
        aria-label="閉じる"
        onClick={onClose}
        initial={reduceMotion ? false : { opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.3 }}
        className="absolute inset-0 h-full w-full bg-[var(--km-ink)]/28 backdrop-blur-sm"
      />

      <motion.aside
        role="dialog"
        aria-modal="true"
        aria-label={`${profile.name} の詳細`}
        initial={reduceMotion ? false : { y: "100%", opacity: 0.5 }}
        animate={{ y: 0, opacity: 1 }}
        exit={reduceMotion ? { opacity: 0 } : { y: "100%", opacity: 0.5 }}
        transition={{ type: "spring", stiffness: 240, damping: 30 }}
        className="absolute inset-x-0 bottom-0 max-h-[88dvh] overflow-y-auto border-t border-[var(--km-border)] bg-[var(--km-surface)]/97 px-6 py-8 text-[var(--km-ink)] backdrop-blur-2xl md:inset-y-0 md:left-auto md:right-0 md:w-[480px] md:max-h-none md:border-l md:border-t-0 md:px-10 md:py-12"
      >
        <div className="flex items-start justify-between gap-6">
          <div>
            <h3 className="text-3xl font-semibold leading-tight tracking-tighter text-[var(--km-ink)]">
              {profile.name}
            </h3>
            <p className="mt-2 text-xs text-[var(--km-muted)]">{profile.prefecture}</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="閉じる"
            className={`grid h-9 w-9 shrink-0 place-items-center rounded-full border border-[var(--km-border)] text-[var(--km-muted)] transition hover:border-[var(--km-gold)]/40 hover:text-[var(--km-ink)] ${FOCUS}`}
          >
            <X size={15} weight={ICON_WEIGHT} />
          </button>
        </div>

        <p className="mt-7 max-w-[42ch] text-sm leading-[1.85] text-[var(--km-ink-soft)]">
          {profile.description}
        </p>

        <dl className="mt-9 flex divide-x divide-[var(--km-border)] border-y border-[var(--km-border)] py-5">
          {(
            [
              ["粒感", profile.hardness],
              ["甘み", profile.sweetness],
              ["粘り", profile.stickiness],
            ] as const
          ).map(([label, value]) => (
            <div key={label} className="flex-1 px-4 first:pl-0 last:pr-0">
              <dt className="text-[11px] text-[var(--km-muted)]">{label}</dt>
              <dd className="mt-1.5 font-mono text-2xl leading-none text-[var(--km-ink)]">{value}</dd>
            </div>
          ))}
        </dl>

        {dishes.length > 0 ? (
          <div className="mt-8">
            <p className="text-xs text-[var(--km-muted)]">相性の良い料理</p>
            <ul className="mt-3 flex flex-wrap gap-2">
              {dishes.map((dish) => (
                <li
                  key={dish}
                  className="rounded-full border border-[var(--km-border)] bg-[var(--km-surface-warm)]/55 px-3 py-1 text-xs text-[var(--km-ink-soft)]"
                >
                  {dish}
                </li>
              ))}
            </ul>
          </div>
        ) : null}

        <div className="mt-9">
          <div className="flex items-baseline justify-between gap-4">
            <p className="text-xs text-[var(--km-muted)]">似ている銘柄</p>
            {!hasVectors ? (
              <button
                type="button"
                onClick={onLoadVectors}
                disabled={vectorState === "pending"}
                className={`whitespace-nowrap rounded-full border border-[var(--km-border)] px-3 py-1 text-[11px] text-[var(--km-ink-soft)] transition hover:border-[var(--km-gold)]/40 hover:text-[var(--km-ink)] disabled:opacity-45 ${FOCUS}`}
              >
                {vectorState === "pending" ? "比べています" : "味わいを深く比べる"}
              </button>
            ) : null}
          </div>

          {neighbours.length > 0 ? (
            <ul className="mt-3 divide-y divide-[var(--km-border)]">
              {neighbours.map((neighbour) => (
                <li key={neighbour.profile.id}>
                  <button
                    type="button"
                    onClick={() => onSelect(neighbour.profile.id)}
                    className={`group flex w-full items-baseline justify-between gap-4 py-3 text-left ${FOCUS}`}
                  >
                    <span className="truncate text-sm text-[var(--km-ink-soft)] transition-colors group-hover:text-[var(--km-accent)]">
                      {neighbour.profile.name}
                    </span>
                    <span className="inline-flex items-center gap-1.5 font-mono text-xs tabular-nums text-[var(--km-muted)]">
                      {formatScore(neighbour.score)}
                      <ArrowUpRight size={12} weight={ICON_WEIGHT} />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <p className="mt-3 text-[11px] text-[var(--km-muted)]">
            {vectorState === "error"
              ? "保存された味わいを読み込めないため、粒感と甘みで比べています。"
              : method === "cosine"
                ? "蓄積した味わいの近さで比べています。"
                : "粒感と甘みの近さで比べています。"}
          </p>
        </div>

        <p className="mt-8 text-[11px] text-[var(--km-muted)]">
          現在の探針との一致度 {formatScore(score)}
        </p>

        {profile.rakuten_search_keyword ? (
          <a
            href={rakutenUrl(profile.rakuten_search_keyword)}
            target="_blank"
            rel="noopener noreferrer"
            className={`mt-6 inline-flex w-full items-center justify-center gap-2 whitespace-nowrap rounded-full bg-[var(--km-accent)] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[var(--km-gold-strong)] active:scale-[0.98] ${FOCUS}`}
          >
            楽天で探す
            <ArrowUpRight size={15} weight={ICON_WEIGHT} />
          </a>
        ) : null}
      </motion.aside>
    </div>
  );
}

/* --------------------------------------------------------------- states */

function MatrixSkeleton() {
  const seeds: Array<[number, number]> = [
    [26, 32],
    [44, 60],
    [63, 27],
    [72, 66],
    [35, 74],
    [54, 46],
    [81, 50],
    [19, 56],
  ];
  return (
    <div
      role="status"
      aria-label="銘柄を読み込んでいます"
      className="absolute inset-0"
      style={{ zIndex: LAYER.node }}
    >
      {seeds.map(([left, top], index) => (
        <span
          key={`${left}-${top}`}
          aria-hidden
          className="absolute h-3 w-2 -translate-x-1/2 -translate-y-1/2 animate-pulse rounded-[60%_40%_55%_45%] bg-[var(--km-ink)]/12"
          style={{ left: `${left}%`, top: `${top}%`, animationDelay: `${index * 120}ms` }}
        />
      ))}
      <p className="absolute inset-x-0 bottom-8 text-center text-xs text-[var(--km-muted)]">
        銘柄を読み込んでいます
      </p>
    </div>
  );
}

function RailSkeleton() {
  return (
    <div role="status" className="flex items-center gap-3 border-y border-[var(--km-border)] py-6">
      <span className="h-3 w-2 animate-pulse rounded-[60%_40%_55%_45%] bg-[var(--km-accent)]/55" />
      <p className="text-sm text-[var(--km-muted)]">銘柄を読み込んでいます</p>
    </div>
  );
}

function EmptyPanel() {
  return (
    <div className="absolute inset-0 grid place-items-center px-8 text-center">
      <div>
        <p className="text-sm text-[var(--km-ink)]">まだ銘柄が登録されていません。</p>
        <p className="mt-2 text-xs text-[var(--km-muted)]">
          味わいの地図に表示するお米を追加してください。
        </p>
      </div>
    </div>
  );
}

function ErrorPanel({
  message,
  onRetry,
}: {
  message: string | null;
  onRetry: () => void;
}) {
  return (
    <div className="relative px-6 pb-12 pt-8 md:px-10">
      <div className="border-y border-rose-700/15 py-7">
        <p className="flex items-center gap-2 text-sm text-rose-800">
          <Warning size={15} weight={ICON_WEIGHT} />
          銘柄を読み込めませんでした。
        </p>
        <p className="mt-2.5 max-w-[46ch] text-xs leading-relaxed text-rose-700/80">
          時間をおいてもう一度お試しください。
        </p>
        {process.env.NODE_ENV === "development" && message ? (
          <p className="mt-2 max-w-[46ch] font-mono text-[10px] leading-relaxed text-rose-700/60">
            {message}
          </p>
        ) : null}
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex items-center whitespace-nowrap rounded-full border border-rose-700/30 px-4 py-2 text-sm text-rose-800 transition hover:bg-rose-700/5 active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-rose-700"
        >
          再読み込み
        </button>
      </div>
    </div>
  );
}

export default FlavorMatrix;
