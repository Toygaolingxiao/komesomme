"use client";

/**
 * FlavorMatrix orchestration.
 *
 * Layout (desktop): map + current-taste sliders on the left, recommendation rail
 * and consultation on the right. Coordinate ranking is local and instant; only
 * free-text consultation hits `/api/rice/semantic-recommend`.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { AnimatePresence, useMotionValue, useReducedMotion } from "motion/react";
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
  INSET,
  MATCH_LIMIT,
  NEIGHBOUR_LIMIT,
  type RailMatch,
} from "./matrix/shared";
import { ErrorPanel } from "./matrix/states";

type LoadState = "loading" | "ready" | "error";
type SemanticState = "idle" | "pending" | "error";

const INITIAL_COORDINATE: TasteCoordinate = { hardness: 3, sweetness: 3 };

function probeLeftOf(coordinate: TasteCoordinate) {
  return `${valueToPosition(coordinate.sweetness, INSET)}%`;
}

function probeTopOf(coordinate: TasteCoordinate) {
  return `${100 - valueToPosition(hardnessToDisplayY(coordinate.hardness), INSET)}%`;
}

export function FlavorMatrix() {
  const reduceMotion = useReducedMotion() ?? false;

  const [profiles, setProfiles] = useState<RiceProfileV2[]>([]);
  const [regions, setRegions] = useState<RiceRegionRecord[]>(RICE_REGIONS);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const [loadError, setLoadError] = useState<string | null>(null);

  const [coordinate, setCoordinate] = useState<TasteCoordinate>(INITIAL_COORDINATE);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [query, setQuery] = useState("");

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

  const setAxis = useCallback(
    (axis: keyof TasteCoordinate, value: number) => {
      setCoordinate((previous) => {
        const next = { ...previous, [axis]: clamp(value) };
        probeLeft.set(probeLeftOf(next));
        probeTop.set(probeTopOf(next));
        return next;
      });
      if (recommendationMode === "semantic") resetSemantic();
    },
    [probeLeft, probeTop, recommendationMode, resetSemantic]
  );

  const moveProbe = useCallback(
    (hardness: number, sweetness: number) => {
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

  return (
    <section className="flex h-full min-h-0 flex-col px-3 py-2 sm:px-4 sm:py-3">
      <div className="mx-auto flex h-full min-h-0 w-full max-w-[1440px] flex-col overflow-hidden rounded-[1.5rem] border border-[var(--km-border)] bg-[var(--km-surface)] shadow-[0_28px_64px_-36px_rgba(112,69,34,0.45)] lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col px-4 py-3 sm:px-5 sm:py-4">
          <div className="flex shrink-0 flex-col gap-1">
            <h2 className="font-serif text-xl font-semibold tracking-tight text-[var(--km-ink)]">
              味わいの地図
            </h2>
            <p className="max-w-[36ch] text-[11px] leading-relaxed text-[var(--km-muted)]">
              {recommendationMode === "semantic"
                ? "探針は、いまのおすすめの位置です。"
                : "探針を置くと、味わいの近い銘柄がふわりと浮かび上がります。"}
            </p>
          </div>

          {loadState === "error" ? (
            <ErrorPanel message={loadError} onRetry={() => void loadProfiles()} />
          ) : (
            <div className="relative mt-2 min-h-0 flex-1">
              <TasteMap
                points={points}
                regions={regions}
                bestMatchId={bestMatchId}
                runnerUpIds={runnerUpIds}
                selectedId={selectedId}
                highlightId={hoveredId}
                bestCaption={
                  recommendationMode === "semantic" ? "米ソムリエ推薦" : "いちばん近い一膳"
                }
                probeLeft={probeLeft}
                probeTop={probeTop}
                probeKey={`${coordinate.hardness}-${coordinate.sweetness}`}
                interactive={loadState === "ready"}
                loading={loadState === "loading"}
                reduceMotion={reduceMotion}
                onProbeMove={moveProbe}
                onSelect={setSelectedId}
              />
            </div>
          )}

          <TasteControls coordinate={coordinate} onAxisChange={setAxis} />
        </div>

        <aside className="flex max-h-[42%] w-full shrink-0 flex-col overflow-y-auto border-t border-[var(--km-border)] bg-[var(--km-surface-warm)]/80 px-4 py-3 sm:px-5 lg:max-h-none lg:w-[22rem] lg:overflow-hidden lg:border-l lg:border-t-0 lg:py-4">
          <RecommendationRail
            matches={railMatches}
            reply={recommendationMode === "semantic" ? semanticReply : null}
            mode={recommendationMode}
            loading={loadState === "loading"}
            pending={semanticState === "pending"}
            selectedId={selectedId}
            reduceMotion={reduceMotion}
            onSelect={setSelectedId}
            onHover={setHoveredId}
            onResetMode={resetSemantic}
          />

          <ConsultForm
            query={query}
            pending={semanticState === "pending"}
            failed={semanticState === "error"}
            onQueryChange={setQuery}
            onSubmit={() => void runSemantic()}
          />
        </aside>
      </div>

      <AnimatePresence>
        {selected ? (
          <BrandDetailPanel
            rice={selected}
            score={scoreById.get(selected.id) ?? 0}
            neighbours={neighbours}
            reduceMotion={reduceMotion}
            onSelect={setSelectedId}
            onClose={() => setSelectedId(null)}
          />
        ) : null}
      </AnimatePresence>
    </section>
  );
}

export default FlavorMatrix;
