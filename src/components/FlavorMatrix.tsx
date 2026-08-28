"use client";

/**
 * FlavorMatrix orchestration.
 *
 * Desktop: map + sliders on the left, recommendations on the right, language
 * consultation full-width below. Mobile: recommendation first, compact map,
 * sliders only inside full-screen map exploration.
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
import { BrandDetailPanel } from "./matrix/BrandDetailPanel";
import { ConsultForm } from "./matrix/ConsultForm";
import { RecommendationRail } from "./matrix/RecommendationRail";
import { TasteControls } from "./matrix/TasteControls";
import { TasteMap } from "./matrix/TasteMap";
import {
  MobileSelectedCard,
  MobileTodayCard,
  OpenMapButton,
} from "./matrix/MobileCards";
import {
  FOCUS,
  INSET,
  LAYER,
  MATCH_LIMIT,
  NEIGHBOUR_LIMIT,
  PREVIEW_MATCH_LIMIT,
  type RailMatch,
} from "./matrix/shared";
import { ErrorPanel } from "./matrix/states";
import { X } from "@phosphor-icons/react";

type LoadState = "loading" | "ready" | "error";
type SemanticState = "idle" | "pending" | "error";

const INITIAL_COORDINATE: TasteCoordinate = { hardness: 3, sweetness: 3 };
const HINT_KEY = "km-map-hint-seen";

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
      気になる点を押して、米の性格を見てみましょう。
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
  const [mapOpen, setMapOpen] = useState(false);
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

  const scoreById = useMemo(() => {
    const map = new Map<string, number>();
    for (const match of railMatches) {
      map.set(match.rice.id, match.score);
    }
    return map;
  }, [railMatches]);

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

  const previewIds = useMemo(() => {
    if (recommendationMode === "semantic") {
      return new Set(railMatches.map((match) => match.rice.id));
    }
    return new Set(
      calculateTopCoordinateMatches(points, coordinate, PREVIEW_MATCH_LIMIT).map(
        (match) => match.rice.id
      )
    );
  }, [recommendationMode, railMatches, points, coordinate]);

  const dismissMapHint = useCallback(() => {
    setShowMapHint(false);
    try {
      window.localStorage.setItem(HINT_KEY, "1");
    } catch {
      /* ignore */
    }
  }, []);

  const openDetail = useCallback((id: string) => {
    setSelectedId(id);
    setDetailOpen(true);
  }, []);

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    if (isLg) setSelectedId(null);
  }, [isLg]);

  useEffect(() => {
    if (isLg) setMapOpen(false);
  }, [isLg]);

  useEffect(() => {
    if (!mapOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape" && !detailOpen) setMapOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [mapOpen, detailOpen]);

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

  const tapOnMap = useCallback(
    (id: string) => {
      track("map_marker_click", { id });
      inspectOnMap(id);
    },
    [inspectOnMap]
  );

  const pickOnMap = useCallback(
    (id: string) => {
      inspectOnMap(id);
      if (isLg) openDetail(id);
    },
    [inspectOnMap, isLg, openDetail]
  );

  const setAxis = useCallback(
    (axis: keyof TasteCoordinate, value: number) => {
      setCoordinate((previous) => {
        const next = { ...previous, [axis]: clamp(value) };
        probeLeft.set(probeLeftOf(next));
        probeTop.set(probeTopOf(next));
        return next;
      });
      track("slider_change", { axis, value });
      if (recommendationMode === "semantic") resetSemantic();
    },
    [probeLeft, probeTop, recommendationMode, resetSemantic]
  );

  const moveProbe = useCallback(
    (hardness: number, sweetness: number) => {
      setSelectedId(null);
      commitCoordinate({ hardness, sweetness });
    },
    [commitCoordinate]
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

      const body = (await response.json()) as {
        matches?: Array<{ rice?: RiceProfileV2; score?: number; reason?: string }>;
        reply?: string;
        message?: string;
      };

      if (!response.ok) {
        throw new Error(body.message ?? "semantic recommend failed");
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
    onHover: setHoveredId,
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
    <section className="w-full min-w-0 lg:h-full lg:min-h-0">
      {isLg ? (
        <div className="mx-auto grid h-full min-h-0 w-full max-w-[1440px] grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)] grid-rows-[minmax(0,1fr)_auto] gap-3 px-4 py-2 sm:px-5">
          <div className="flex h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[1.5rem] border border-[var(--km-border)] bg-[var(--km-surface)] shadow-[0_28px_64px_-36px_rgba(112,69,34,0.45)]">
            <div className="shrink-0 px-4 pt-3 sm:px-5">
              <h2 className="font-serif text-lg font-semibold tracking-tight text-[var(--km-ink)] sm:text-xl">
                味わいの地図
              </h2>
              <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--km-muted)]">
                点を選ぶと銘柄を表示。スライダーを動かすと、今日の一膳が変わります。
              </p>
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

          <aside className="h-full min-h-0 min-w-0 overflow-hidden rounded-[1.5rem] border border-[var(--km-border)] bg-[var(--km-surface-warm)]/90 px-4 py-3 shadow-[0_28px_64px_-36px_rgba(112,69,34,0.45)] sm:px-5">
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
              onHover={setHoveredId}
            />
          </aside>

          <div className="col-span-2 min-w-0">{consult}</div>
        </div>
      ) : (
        <div className="mx-auto flex w-full min-w-0 max-w-[1440px] flex-col gap-3 px-4 pb-[max(4rem,calc(env(safe-area-inset-bottom)+2rem))] pt-3">
          <MobileTodayCard
            match={railMatches[0] ?? null}
            loading={loadState === "loading" || semanticState === "pending"}
            onOpen={openDetail}
          />

          <div className="flex min-w-0 flex-col gap-3 rounded-[1.5rem] border border-[var(--km-border)] bg-[var(--km-surface)] px-4 py-3 shadow-[0_28px_64px_-36px_rgba(112,69,34,0.45)]">
            {loadState === "error" ? (
              <ErrorPanel message={loadError} onRetry={() => void loadProfiles()} />
            ) : mapOpen ? null : (
              <div className="-mx-2 h-[min(30svh,200px)] min-h-[140px] w-[calc(100%+1rem)]">
                <TasteMap
                  {...mapShared}
                  variant="preview"
                  runnerUpIds={previewIds}
                  onSelect={tapOnMap}
                />
              </div>
            )}

            {selected && !mapOpen && selected.id !== bestMatchId ? (
              <MobileSelectedCard
                rice={selected}
                isBestMatch={false}
                onOpen={() => openDetail(selected.id)}
              />
            ) : null}

            <OpenMapButton onClick={() => setMapOpen(true)} />
          </div>

          <div className="min-w-0 rounded-[1.5rem] border border-[var(--km-border)] bg-[var(--km-surface)] px-4 pb-4 pt-3 shadow-[0_28px_64px_-36px_rgba(112,69,34,0.45)]">
            {consult}
          </div>
        </div>
      )}

      {mapOpen && !isLg ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="km-map-title"
          className="fixed inset-0 flex flex-col bg-[var(--km-bg)]"
          style={{ zIndex: LAYER.fullscreen }}
        >
          <header className="flex shrink-0 items-start justify-between gap-3 px-4 pb-2 pt-[max(0.75rem,env(safe-area-inset-top))]">
            <div>
              <h2
                id="km-map-title"
                className="font-serif text-xl font-semibold tracking-tight text-[var(--km-ink)]"
              >
                味わいの地図
              </h2>
              <p className="mt-1 max-w-[36ch] text-[11px] leading-relaxed text-[var(--km-muted)]">
                点を選ぶと銘柄を表示。スライダーを動かすと、近い一膳が変わります。
              </p>
            </div>
            <button
              type="button"
              aria-label="閉じる"
              onClick={() => setMapOpen(false)}
              className={`grid h-11 w-11 place-items-center rounded-full border border-[var(--km-border)] bg-[var(--km-surface)] text-[var(--km-muted)] ${FOCUS}`}
            >
              <X size={16} weight="bold" />
            </button>
          </header>

          <div className="min-h-0 flex-1 px-2">
            <TasteMap
              {...mapShared}
              variant="fullscreen"
              runnerUpIds={previewIds}
              onSelect={tapOnMap}
            />
          </div>

          <div className="shrink-0 px-4">
            <TasteControls coordinate={coordinate} onAxisChange={setAxis} />
          </div>

          <div className="shrink-0 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-2">
            {selected ? (
              <MobileSelectedCard
                rice={selected}
                isBestMatch={selected.id === bestMatchId}
                onOpen={() => openDetail(selected.id)}
              />
            ) : null}
          </div>
        </div>
      ) : null}

      <AnimatePresence>
        {selected && detailOpen ? (
          <BrandDetailPanel
            rice={selected}
            score={scoreById.get(selected.id) ?? 0}
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
