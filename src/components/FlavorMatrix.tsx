"use client";

/**
 * FlavorMatrix orchestration.
 *
 * Desktop: map + sliders on the left, recommendations on the right, language
 * consultation full-width below. Mobile: recommendation first, then an inline
 * tasting map with sliders (no separate fullscreen mode). On the phone map,
 * first tap moves the probe (Top 4 glow); the same grain again opens the panel.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, useMotionValue, useReducedMotion } from "motion/react";
import { track } from "@/lib/analytics";
import { fetchRiceCatalog } from "@/lib/rice/fetchRiceProfiles";
import { RICE_REGIONS, type RiceRegionRecord } from "@/lib/rice/regions";
import {
  calculateTasteNeighbours,
  calculateTopCoordinateMatches,
  clamp,
  coordinateFromDisplayPoint,
  toDisplayPoints,
  hardnessToDisplayY,
  valueToPosition,
} from "@/lib/rice/matrix";
import type {
  RecommendationMode,
  RiceProfileV2,
  TasteCoordinate,
} from "@/types/rice";
import { ShopLinksStrip } from "@/components/ShopLinksStrip";
import { SITE_COLUMN } from "@/components/siteChrome";
import { readBrandQuery, writeBrandQuery } from "@/lib/navigation/brandQuery";
import { BrandDetailPanel } from "./matrix/BrandDetailPanel";
import { prefetchBrandArt } from "@/lib/editorial/prefetchArt";
import { ConsultForm } from "./matrix/ConsultForm";
import { RecommendationRail } from "./matrix/RecommendationRail";
import { TasteControls } from "./matrix/TasteControls";
import { TasteMap } from "./matrix/TasteMap";
import { MobileTodayCard } from "./matrix/MobileCards";
import {
  FOCUS,
  INSET,
  MATCH_LIMIT,
  NEIGHBOUR_LIMIT,
  type RailMatch,
} from "./matrix/shared";
import { ErrorPanel } from "./matrix/states";

type LoadState = "loading" | "ready" | "error";
type SemanticState = "idle" | "pending" | "error";

const INITIAL_COORDINATE: TasteCoordinate = { hardness: 3, sweetness: 3 };
const HINT_KEY = "km-map-hint-seen";
const AXIS_PICK = [2, 3, 4] as const;

/** Session-level start away from the exact center (avoids a dull default). */
function randomInitialCoordinate(): TasteCoordinate {
  let hardness = 3;
  let sweetness = 3;
  do {
    hardness = AXIS_PICK[Math.floor(Math.random() * AXIS_PICK.length)];
    sweetness = AXIS_PICK[Math.floor(Math.random() * AXIS_PICK.length)];
  } while (hardness === 3 && sweetness === 3);
  return { hardness, sweetness };
}

function MapFirstHint({
  visible,
  onDismiss,
}: {
  visible: boolean;
  onDismiss: () => void;
}) {
  if (!visible) return null;

  return (
    <p className="mt-1.5 flex items-start justify-between gap-2 rounded-lg bg-[var(--km-surface-warm)] px-2.5 py-1.5 text-[11px] leading-relaxed text-[var(--km-ink-soft)]">
      色の点は銘柄です。触ると今日の一膳が変わります。
      <button
        type="button"
        onClick={onDismiss}
        className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] text-[var(--km-muted)] hover:text-[var(--km-ink)] ${FOCUS}`}
      >
        閉じる
      </button>
    </p>
  );
}

function useLgUp() {
  const [lg, setLg] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const sync = () => setLg(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  return lg;
}

function probeLeftOf(coordinate: TasteCoordinate) {
  return `${valueToPosition(coordinate.sweetness, INSET)}%`;
}

function probeTopOf(coordinate: TasteCoordinate) {
  return `${100 - valueToPosition(hardnessToDisplayY(coordinate.hardness), INSET)}%`;
}

export function FlavorMatrix() {
  const reduceMotion = useReducedMotion() ?? false;
  const isLg = useLgUp();

  const [profiles, setProfiles] = useState<RiceProfileV2[]>([]);
  const [regions, setRegions] = useState<RiceRegionRecord[]>(RICE_REGIONS);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);

  const [coordinate, setCoordinate] = useState<TasteCoordinate>(INITIAL_COORDINATE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [showMapHint, setShowMapHint] = useState(false);

  const [recommendationMode, setRecommendationMode] =
    useState<RecommendationMode>("coordinate");
  const [semanticState, setSemanticState] = useState<SemanticState>("idle");
  const [semanticMatches, setSemanticMatches] = useState<RailMatch[]>([]);
  const [semanticReply, setSemanticReply] = useState<string | null>(null);

  const probeLeft = useMotionValue(probeLeftOf(INITIAL_COORDINATE));
  const probeTop = useMotionValue(probeTopOf(INITIAL_COORDINATE));

  const loadProfiles = useCallback(async () => {
    setLoadState("loading");
    setLoadError(null);
    try {
      const catalog = await fetchRiceCatalog();
      setProfiles(catalog.profiles);
      setRegions(catalog.regions);
      setLoadState("ready");
    } catch (cause) {
      setLoadError(cause instanceof Error ? cause.message : String(cause));
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  useEffect(() => {
    setCoordinate(randomInitialCoordinate());
  }, []);

  useEffect(() => {
    try {
      setShowMapHint(window.localStorage.getItem(HINT_KEY) !== "1");
    } catch {
      setShowMapHint(true);
    }
  }, []);

  useEffect(() => {
    probeLeft.set(probeLeftOf(coordinate));
    probeTop.set(probeTopOf(coordinate));
  }, [coordinate.hardness, coordinate.sweetness, probeLeft, probeTop]);

  const points = useMemo(() => toDisplayPoints(profiles), [profiles]);

  const coordinateMatches = useMemo(
    () => calculateTopCoordinateMatches(points, coordinate, MATCH_LIMIT),
    [points, coordinate]
  );

  const railMatches: RailMatch[] = useMemo(() => {
    if (recommendationMode === "semantic") return semanticMatches;
    return coordinateMatches.map((match) => ({
      rice: match.rice,
      score: match.score,
      reason: match.reason,
    }));
  }, [recommendationMode, semanticMatches, coordinateMatches]);

  const selected = useMemo(
    () => profiles.find((rice) => rice.id === selectedId) ?? null,
    [profiles, selectedId]
  );

  const neighbours = useMemo(
    () =>
      selected
        ? calculateTasteNeighbours(profiles, selected, NEIGHBOUR_LIMIT)
        : [],
    [profiles, selected]
  );

  const bestMatchId = railMatches[0]?.rice.id ?? null;
  const runnerUpIds = useMemo(
    () => new Set(railMatches.slice(1).map((match) => match.rice.id)),
    [railMatches]
  );

  const dismissMapHint = useCallback(() => {
    setShowMapHint(false);
    try {
      window.localStorage.setItem(HINT_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const handleHover = useCallback(
    (id: string | null) => {
      setHoveredId(id);
      if (!id) return;
      const rice = profiles.find((row) => row.id === id);
      if (rice) prefetchBrandArt(rice.id, rice.region, rice.prefecture);
    },
    [profiles]
  );

  const openDetail = useCallback(
    (id: string, opts?: { syncUrl?: boolean; history?: "push" | "replace" }) => {
      const rice = profiles.find((row) => row.id === id);
      if (rice) prefetchBrandArt(rice.id, rice.region, rice.prefecture);
      setSelectedId(id);
      setDetailOpen(true);
      if (opts?.syncUrl === false) return;
      writeBrandQuery(id, opts?.history ?? "push");
    },
    [profiles]
  );

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setSelectedId(null);
    writeBrandQuery(null, "replace");
  }, []);

  /** Restore panel from `/?brand=` after catalog load; honor Back/Forward. */
  useEffect(() => {
    if (loadState !== "ready" || profiles.length === 0) return;

    const applyFromUrl = () => {
      const id = readBrandQuery();
      if (id && profiles.some((row) => row.id === id)) {
        const rice = profiles.find((row) => row.id === id)!;
        prefetchBrandArt(rice.id, rice.region, rice.prefecture);
        setSelectedId(id);
        setDetailOpen(true);
        return;
      }
      setDetailOpen(false);
      setSelectedId(null);
    };

    applyFromUrl();
    window.addEventListener("popstate", applyFromUrl);
    return () => window.removeEventListener("popstate", applyFromUrl);
  }, [loadState, profiles]);

  const resetSemantic = useCallback(() => {
    setRecommendationMode("coordinate");
    setSemanticState("idle");
    setSemanticMatches([]);
    setSemanticReply(null);
  }, []);

  const commitCoordinate = useCallback(
    (next: TasteCoordinate) => {
      setCoordinate({
        hardness: clamp(next.hardness),
        sweetness: clamp(next.sweetness),
      });
      if (recommendationMode === "semantic") resetSemantic();
    },
    [recommendationMode, resetSemantic]
  );

  const inspectOnMap = useCallback(
    (id: string) => {
      dismissMapHint();
      setSelectedId(id);
      const placed = points.find((point) => point.id === id);
      if (!placed) return;
      const next = coordinateFromDisplayPoint(placed);
      probeLeft.set(probeLeftOf(next));
      probeTop.set(probeTopOf(next));
      commitCoordinate(next);
    },
    [points, commitCoordinate, probeLeft, probeTop, dismissMapHint]
  );

  const pickOnMap = useCallback(
    (id: string) => {
      track("map_marker_click", { id });
      inspectOnMap(id);
      openDetail(id);
    },
    [inspectOnMap, openDetail]
  );

  /** Mobile: first tap moves the probe (Top 4 glow). Same grain again opens the panel. */
  const tapOnMap = useCallback(
    (id: string) => {
      track("map_marker_click", { id });
      if (selectedId === id) {
        openDetail(id);
        return;
      }
      inspectOnMap(id);
    },
    [selectedId, inspectOnMap, openDetail]
  );

  const setAxis = useCallback(
    (axis: keyof TasteCoordinate, value: number) => {
      closeDetail();
      setCoordinate((previous) => {
        const next = { ...previous, [axis]: clamp(value) };
        probeLeft.set(probeLeftOf(next));
        probeTop.set(probeTopOf(next));
        return next;
      });
      track("slider_change", { axis, value });
      if (recommendationMode === "semantic") resetSemantic();
    },
    [closeDetail, probeLeft, probeTop, recommendationMode, resetSemantic]
  );

  const moveProbe = useCallback(
    (hardness: number, sweetness: number) => {
      closeDetail();
      commitCoordinate({ hardness, sweetness });
    },
    [closeDetail, commitCoordinate]
  );

  const runSemantic = useCallback(async () => {
    const trimmed = query.trim();
    if (!trimmed) return;

    setRecommendationMode("semantic");
    setSemanticState("pending");

    try {
      const response = await fetch("/api/rice/semantic-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, matchCount: MATCH_LIMIT }),
      });

      const body = (await response.json().catch(() => null)) as {
        matches?: Array<{ rice?: RiceProfileV2; score?: number; reason?: string }>;
        reply?: string;
        message?: string;
      } | null;

      if (!body) {
        setSemanticMatches([]);
        setSemanticReply(
          "相談に失敗しました。しばらくしてから、もう一度お試しください。"
        );
        setSemanticState("error");
        return;
      }

      if (!response.ok) {
        setSemanticMatches([]);
        setSemanticReply(
          typeof body.message === "string" && body.message.trim()
            ? body.message.trim()
            : "相談に失敗しました。味わいの地図から銘柄を探してみてください。"
        );
        setSemanticState("error");
        return;
      }

      const matches: RailMatch[] = (body.matches ?? [])
        .map((match) => {
          const id = match.rice?.id;
          if (!id) return null;
          const rice = profiles.find((profile) => profile.id === id) ?? match.rice;
          if (!rice) return null;
          return {
            rice,
            score: typeof match.score === "number" ? match.score : 0,
            reason: match.reason ?? rice.pairing_reason,
          };
        })
        .filter((match): match is RailMatch => match !== null);

      setSemanticMatches(matches);
      setSemanticReply(typeof body.reply === "string" ? body.reply.trim() : null);
      const top = matches[0]?.rice;
      if (top) {
        const placed = points.find((point) => point.id === top.id);
        const next = placed
          ? coordinateFromDisplayPoint(placed)
          : {
              hardness: clamp(top.hardness),
              sweetness: clamp(top.sweetness),
            };
        setCoordinate(next);
        probeLeft.set(probeLeftOf(next));
        probeTop.set(probeTopOf(next));
      }
      setSemanticState("idle");
    } catch (cause) {
      console.error("Semantic recommend failed:", cause);
      setSemanticMatches([]);
      setSemanticReply(null);
      setSemanticState("error");
    }
  }, [query, profiles, points, probeLeft, probeTop]);

  const mapShared = {
    points,
    regions,
    bestMatchId,
    selectedId,
    highlightId: hoveredId,
    bestCaption:
      recommendationMode === "semantic" ? "今日の一膳" : "いちばん近い一膳",
    probeLeft,
    probeTop,
    probeKey: `${coordinate.hardness}-${coordinate.sweetness}`,
    interactive: loadState === "ready",
    loading: loadState === "loading",
    reduceMotion,
    onProbeMove: moveProbe,
    onHover: handleHover,
  };

  const consult = (
    <ConsultForm
      query={query}
      pending={semanticState === "pending"}
      failed={semanticState === "error"}
      reply={recommendationMode === "semantic" ? semanticReply : null}
      onQueryChange={setQuery}
      onSubmit={() => void runSemantic()}
      onResetMode={recommendationMode === "semantic" ? resetSemantic : undefined}
      layout={isLg ? "wide" : "stack"}
    />
  );

  return (
    <section className="w-full min-w-0 overflow-x-clip lg:h-full lg:min-h-0">
      {isLg ? (
        <div className={`${SITE_COLUMN} grid h-full min-h-0 grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)] grid-rows-[minmax(0,1fr)_auto] gap-4 py-2`}>
          <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[1.25rem] border border-[var(--km-border)] bg-[var(--km-surface)] shadow-[0_18px_48px_-40px_rgba(112,69,34,0.4)]">
            <div className="shrink-0 px-4 pt-3.5 sm:px-5">
              <h2 className="font-serif text-[1.2rem] font-semibold tracking-tight text-[var(--km-ink)] sm:text-[1.35rem]">
                味わいの地図
              </h2>
              <MapFirstHint visible={showMapHint} onDismiss={dismissMapHint} />
            </div>

            {loadState === "error" ? (
              <div className="px-5 py-4">
                <ErrorPanel message={loadError} onRetry={() => void loadProfiles()} />
              </div>
            ) : (
              <div className="min-h-0 min-w-0 flex-1 px-2 pb-1 pt-1">
                <TasteMap
                  {...mapShared}
                  variant="desktop"
                  runnerUpIds={runnerUpIds}
                  onSelect={pickOnMap}
                />
              </div>
            )}

            <div className="shrink-0 px-4 sm:px-5">
              <TasteControls coordinate={coordinate} onAxisChange={setAxis} />
            </div>
          </div>

          <aside className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[1.25rem] border border-[var(--km-border)] bg-[var(--km-surface-warm)]/80 px-4 py-3 shadow-[0_18px_48px_-40px_rgba(112,69,34,0.35)] sm:px-5">
            <RecommendationRail
              matches={railMatches}
              mode={recommendationMode}
              loading={loadState === "loading"}
              pending={semanticState === "pending"}
              selectedId={selectedId}
              highlightId={hoveredId}
              reduceMotion={reduceMotion}
              onSelect={(id) => {
                if (recommendationMode === "coordinate") inspectOnMap(id);
                openDetail(id);
              }}
              onHover={handleHover}
            />
          </aside>

          <div className="col-span-2 min-w-0">{consult}</div>
        </div>
      ) : (
        <div className={`${SITE_COLUMN} flex flex-col gap-4 pb-[max(5.5rem,calc(env(safe-area-inset-bottom)+3.5rem))] pt-3`}>
          <MobileTodayCard
            match={railMatches[0] ?? null}
            loading={loadState === "loading" || semanticState === "pending"}
            semantic={recommendationMode === "semantic"}
            onOpen={openDetail}
          />

          <div className="flex min-w-0 flex-col gap-3 overflow-x-clip rounded-[1.25rem] border border-[var(--km-border)] bg-[var(--km-surface)] px-4 py-3.5 shadow-[0_16px_40px_-36px_rgba(112,69,34,0.35)]">
            <MapFirstHint visible={showMapHint} onDismiss={dismissMapHint} />
            {loadState === "error" ? (
              <ErrorPanel message={loadError} onRetry={() => void loadProfiles()} />
            ) : (
              <>
                <div
                  data-taste-map-preview
                  className="mx-auto aspect-square w-full min-h-[240px] max-h-[min(58svh,380px)] min-w-0"
                >
                  <TasteMap
                    {...mapShared}
                    variant="preview"
                    runnerUpIds={runnerUpIds}
                    onSelect={tapOnMap}
                  />
                </div>
                <TasteControls coordinate={coordinate} onAxisChange={setAxis} />
              </>
            )}
          </div>

          {/* After map: quick path to shops (collapsed). Consult stays a second path below. */}
          {railMatches[0] && loadState !== "loading" && semanticState !== "pending" ? (
            <ShopLinksStrip
              rice={railMatches[0].rice}
              variant="compact"
              expandMode="disclosure"
              disclosure="pr"
              className="overflow-visible rounded-[1.25rem] border border-[var(--km-border)] bg-[var(--km-surface)] px-4 py-3"
            />
          ) : null}

          <div className="min-w-0 rounded-[1.25rem] border border-[var(--km-border)] bg-[var(--km-surface)] px-4 pb-4 pt-3.5 shadow-[0_16px_40px_-36px_rgba(112,69,34,0.3)]">
            {consult}
          </div>
        </div>
      )}

      <AnimatePresence>
        {selected && detailOpen ? (
          <BrandDetailPanel
            rice={selected}
            neighbours={neighbours}
            reduceMotion={reduceMotion}
            onSelect={openDetail}
            onClose={closeDetail}
          />
        ) : null}
      </AnimatePresence>
    </section>
  );
}

export default FlavorMatrix;
