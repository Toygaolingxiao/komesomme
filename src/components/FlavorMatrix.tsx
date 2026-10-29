"use client";

/**
 * FlavorMatrix orchestration.
 *
 * Desktop: map + sliders on the left, recommendations on the right, language
 * consultation full-width below. Mobile: recommendation first, then an inline
 * tasting map with sliders (no separate fullscreen mode). On the phone map,
 * first tap moves the probe (Top 4 glow); the same grain again opens the panel.
 */

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  AnimatePresence,
  animate,
  useMotionValue,
  useReducedMotion,
  type AnimationPlaybackControls,
} from "motion/react";
import {
  markGrainEnterPlayed,
  readGrainEnterPlayed,
} from "@/lib/rice/grainEntrance";
import { track } from "@/lib/analytics";
import { fetchRiceCatalog } from "@/lib/rice/fetchRiceProfiles";
import type { RiceRegionRecord } from "@/lib/rice/regions";
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
import Link from "next/link";
import { ShopLinksStrip } from "@/components/ShopLinksStrip";
import { SiteLegalNav } from "@/components/SiteFooter";
import { SITE_COLUMN } from "@/components/siteChrome";
import { readBrandQuery } from "@/lib/navigation/brandQuery";
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
    <p className="mt-1.5 flex items-start justify-between gap-2 rounded-lg bg-[var(--km-surface-warm)] px-2.5 py-1.5 text-[12px] leading-relaxed text-[var(--km-ink-soft)]">
      色の点は銘柄です。触ると今日の一膳が変わります。
      <button
        type="button"
        onClick={onDismiss}
        className={`shrink-0 rounded-full px-2 py-0.5 text-[12px] text-[var(--km-muted)] hover:text-[var(--km-ink)] ${FOCUS}`}
      >
        閉じる
      </button>
    </p>
  );
}

function probeLeftOf(coordinate: TasteCoordinate) {
  return valueToPosition(coordinate.sweetness, INSET);
}

function probeTopOf(coordinate: TasteCoordinate) {
  return 100 - valueToPosition(hardnessToDisplayY(coordinate.hardness), INSET);
}

export function FlavorMatrix({
  initialProfiles,
  initialRegions,
}: {
  initialProfiles: RiceProfileV2[];
  initialRegions: RiceRegionRecord[];
}) {
  const reduceMotion = useReducedMotion() ?? false;
  const seeded = useRef(initialProfiles.length > 0);

  const [profiles, setProfiles] = useState<RiceProfileV2[]>(initialProfiles);
  const [regions, setRegions] = useState<RiceRegionRecord[]>(initialRegions);
  const [loadState, setLoadState] = useState<LoadState>(
    initialProfiles.length > 0 ? "ready" : "loading"
  );
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
  const [pairingLink, setPairingLink] = useState<{ href: string; label: string } | null>(
    null
  );
  const [probeRippleKey, setProbeRippleKey] = useState(0);
  const [playEntrance, setPlayEntrance] = useState(false);
  const [entranceReady, setEntranceReady] = useState(false);

  const probeLeft = useMotionValue(probeLeftOf(INITIAL_COORDINATE));
  const probeTop = useMotionValue(probeTopOf(INITIAL_COORDINATE));
  const probeAnim = useRef<{
    left?: AnimationPlaybackControls;
    top?: AnimationPlaybackControls;
  }>({});
  const probeGlideGen = useRef(0);

  const loadProfiles = useCallback(async () => {
    if (!seeded.current) {
      setLoadState("loading");
      setLoadError(null);
    }
    try {
      const catalog = await fetchRiceCatalog();
      setProfiles(catalog.profiles);
      setRegions(catalog.regions);
      seeded.current = true;
      setLoadState("ready");
    } catch (cause) {
      if (seeded.current) return;
      setLoadError(cause instanceof Error ? cause.message : String(cause));
      setLoadState("error");
    }
  }, []);

  useEffect(() => {
    void loadProfiles();
  }, [loadProfiles]);

  const jumpProbe = useCallback(
    (next: TasteCoordinate) => {
      probeGlideGen.current += 1;
      probeAnim.current.left?.stop();
      probeAnim.current.top?.stop();
      probeLeft.jump(probeLeftOf(next));
      probeTop.jump(probeTopOf(next));
    },
    [probeLeft, probeTop]
  );

  const glideProbe = useCallback(
    (next: TasteCoordinate) => {
      if (reduceMotion) {
        jumpProbe(next);
        setProbeRippleKey((key) => key + 1);
        return;
      }
      const gen = ++probeGlideGen.current;
      probeAnim.current.left?.stop();
      probeAnim.current.top?.stop();
      const left = animate(probeLeft, probeLeftOf(next), {
        type: "spring",
        visualDuration: 0.4,
        bounce: 0,
      });
      const top = animate(probeTop, probeTopOf(next), {
        type: "spring",
        visualDuration: 0.4,
        bounce: 0,
      });
      probeAnim.current = { left, top };
      void Promise.all([left.finished, top.finished]).then(() => {
        if (probeGlideGen.current !== gen) return;
        setProbeRippleKey((key) => key + 1);
      });
    },
    [jumpProbe, probeLeft, probeTop, reduceMotion]
  );

  useEffect(() => {
    const next = randomInitialCoordinate();
    setCoordinate(next);
    jumpProbe(next);
  }, [jumpProbe]);

  useEffect(() => {
    try {
      setShowMapHint(window.localStorage.getItem(HINT_KEY) !== "1");
    } catch {
      setShowMapHint(true);
    }
  }, []);

  useEffect(() => {
    const played = readGrainEnterPlayed();
    setPlayEntrance(!played);
    setEntranceReady(true);
    if (played) return;
    const id = window.setTimeout(markGrainEnterPlayed, 800);
    return () => window.clearTimeout(id);
  }, []);

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
    (id: string) => {
      const rice = profiles.find((row) => row.id === id);
      if (rice) prefetchBrandArt(rice.id, rice.region, rice.prefecture);
      setSelectedId(id);
      setDetailOpen(true);
    },
    [profiles]
  );

  const closeDetail = useCallback(() => {
    setDetailOpen(false);
    setSelectedId(null);
  }, []);

  /** Shared `/?brand=` still opens the panel once. Map use does not write history. */
  useEffect(() => {
    if (loadState !== "ready" || profiles.length === 0) return;
    const id = readBrandQuery();
    if (id && profiles.some((row) => row.id === id)) {
      const rice = profiles.find((row) => row.id === id)!;
      prefetchBrandArt(rice.id, rice.region, rice.prefecture);
      setSelectedId(id);
      setDetailOpen(true);
    }
  }, [loadState, profiles]);

  const resetSemantic = useCallback(() => {
    setRecommendationMode("coordinate");
    setSemanticState("idle");
    setSemanticMatches([]);
    setSemanticReply(null);
    setPairingLink(null);
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
      glideProbe(next);
      commitCoordinate(next);
    },
    [points, commitCoordinate, glideProbe, dismissMapHint]
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
        jumpProbe(next);
        return next;
      });
      track("slider_change", { axis, value });
      if (recommendationMode === "semantic") resetSemantic();
    },
    [closeDetail, jumpProbe, recommendationMode, resetSemantic]
  );

  const moveProbe = useCallback(
    (hardness: number, sweetness: number) => {
      closeDetail();
      const next = {
        hardness: clamp(hardness),
        sweetness: clamp(sweetness),
      };
      jumpProbe(next);
      commitCoordinate(next);
    },
    [closeDetail, commitCoordinate, jumpProbe]
  );

  const runSemantic = useCallback(async (text?: string) => {
    const trimmed = (text ?? query).trim();
    if (!trimmed) return;

    setRecommendationMode("semantic");
    setSemanticState("pending");

    const controller = new AbortController();
    const timeoutId = window.setTimeout(() => controller.abort(), 12_000);

    try {
      const response = await fetch("/api/rice/semantic-recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: trimmed, matchCount: MATCH_LIMIT }),
        signal: controller.signal,
      });

      const body = (await response.json().catch(() => null)) as {
        matches?: Array<{ rice?: RiceProfileV2; score?: number; reason?: string }>;
        reply?: string;
        message?: string;
        pairing?: { href?: string; label?: string };
      } | null;

      if (!body) {
        setSemanticMatches([]);
        setPairingLink(null);
        setSemanticReply(
          "相談に失敗しました。しばらくしてから、もう一度お試しください。"
        );
        setSemanticState("error");
        return;
      }

      if (!response.ok) {
        setSemanticMatches([]);
        setPairingLink(null);
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
      const href = body.pairing?.href;
      setPairingLink(
        typeof href === "string" && href.startsWith("/pair/")
          ? { href, label: body.pairing?.label?.trim() || "料理" }
          : null
      );
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
        glideProbe(next);
      }
      // The answer is on the rail now; free the field for the next question.
      setQuery("");
      setSemanticState("idle");
    } catch (cause) {
      console.error("Semantic recommend failed:", cause);
      const aborted =
        (typeof cause === "object" &&
          cause !== null &&
          "name" in cause &&
          (cause as { name?: string }).name === "AbortError") ||
        controller.signal.aborted;
      setSemanticMatches([]);
      setPairingLink(null);
      setSemanticReply(
        aborted
          ? "返事が遅かったので、いったん味わいの地図から探してみてください。"
          : "相談に失敗しました。しばらくしてから、もう一度お試しください。"
      );
      setSemanticState("error");
    } finally {
      window.clearTimeout(timeoutId);
    }
  }, [query, profiles, points, glideProbe]);

  const caption =
    recommendationMode === "semantic" ? "今日の一膳" : "いちばん近い一膳";

  const pickGrain = useCallback(
    (id: string) => {
      if (window.matchMedia("(min-width: 1024px)").matches) {
        pickOnMap(id);
        return;
      }
      tapOnMap(id);
    },
    [pickOnMap, tapOnMap]
  );

  const mapShared = {
    points,
    regions,
    bestMatchId,
    selectedId,
    highlightId: hoveredId,
    bestCaption: caption,
    probeLeft,
    probeTop,
    probeRippleKey,
    probe: coordinate,
    playEntrance: playEntrance && entranceReady,
    interactive: loadState === "ready",
    loading: loadState === "loading" || !entranceReady,
    reduceMotion,
    onProbeMove: moveProbe,
    onHover: handleHover,
  };

  const openFromRail = (id: string) => {
    if (recommendationMode === "coordinate") inspectOnMap(id);
    openDetail(id);
  };

  const consult = (
    <ConsultForm
      query={query}
      pending={semanticState === "pending"}
      failed={semanticState === "error"}
      reply={recommendationMode === "semantic" ? semanticReply : null}
      pairing={recommendationMode === "semantic" ? pairingLink : null}
      onQueryChange={setQuery}
      onSubmit={(text) => void runSemantic(text)}
      onResetMode={recommendationMode === "semantic" ? resetSemantic : undefined}
    />
  );

  const shopRice =
    railMatches[0] && loadState !== "loading" && semanticState !== "pending"
      ? railMatches[0].rice
      : null;

  return (
    <section className="w-full min-w-0 overflow-x-clip lg:h-full lg:min-h-0">
      <div
        className={`${SITE_COLUMN} grid gap-4 pb-[max(4.5rem,calc(env(safe-area-inset-bottom)+3.25rem))] pt-3 lg:h-full lg:min-h-0 lg:grid-cols-[minmax(0,1fr)_minmax(22rem,28rem)] lg:grid-rows-[minmax(0,1fr)_auto_auto] lg:pb-2 lg:pt-2`}
      >
        <div className="order-1 min-w-0 lg:hidden">
          <MobileTodayCard
            match={railMatches[0] ?? null}
            loading={loadState === "loading" || semanticState === "pending"}
            caption={caption}
            semantic={recommendationMode === "semantic"}
            onOpen={openDetail}
          />
        </div>

        <div className="order-2 flex min-h-[min(72svh,32rem)] min-w-0 flex-col overflow-hidden rounded-[1.25rem] border border-[var(--km-border)] bg-[var(--km-surface)] shadow-[0_18px_48px_-40px_rgba(112,69,34,0.4)] lg:order-none lg:col-start-1 lg:row-start-1 lg:h-full lg:min-h-0">
          <div className="shrink-0 px-4 pt-3.5 sm:px-5">
            <h1 className="font-serif text-[1.35rem] font-semibold tracking-tight text-[var(--km-ink)]">
              味わいの地図
            </h1>
            <MapFirstHint visible={showMapHint} onDismiss={dismissMapHint} />
          </div>

          {loadState === "error" ? (
            <div className="px-5 py-4">
              <ErrorPanel message={loadError} onRetry={() => void loadProfiles()} />
            </div>
          ) : (
            <div className="flex min-h-0 min-w-0 flex-1 flex-col px-2 pb-1 pt-1">
              <div
                data-taste-map-preview
                className="km-map-frame min-w-0"
              >
                <TasteMap {...mapShared} runnerUpIds={runnerUpIds} onSelect={pickGrain} />
              </div>
            </div>
          )}

          <div className="shrink-0 px-4 sm:px-5">
            <TasteControls coordinate={coordinate} onAxisChange={setAxis} />
          </div>
        </div>

        {shopRice ? (
          <ShopLinksStrip
            rice={shopRice}
            variant="compact"
            expandMode="disclosure"
            disclosure="pr"
            className="order-3 overflow-visible rounded-[1.25rem] border border-[var(--km-border)] bg-[var(--km-surface)] px-4 py-3 lg:hidden"
          />
        ) : null}

        <aside className="hidden h-full min-h-0 min-w-0 flex-col overflow-hidden rounded-[1.25rem] border border-[var(--km-border)] bg-[var(--km-surface-warm)]/80 px-4 py-3 shadow-[0_18px_48px_-40px_rgba(112,69,34,0.35)] sm:px-5 lg:col-start-2 lg:row-start-1 lg:flex">
          <RecommendationRail
            matches={railMatches}
            mode={recommendationMode}
            loading={loadState === "loading"}
            pending={semanticState === "pending"}
            selectedId={selectedId}
            highlightId={hoveredId}
            reduceMotion={reduceMotion}
            caption={caption}
            onSelect={openFromRail}
            onHover={handleHover}
          />
        </aside>

        <div className="order-4 min-w-0 rounded-[1.25rem] border border-[var(--km-border)] bg-[var(--km-surface)] px-4 pb-4 pt-3.5 shadow-[0_16px_40px_-36px_rgba(112,69,34,0.3)] lg:col-span-2 lg:row-start-2 lg:rounded-none lg:border-0 lg:bg-transparent lg:px-0 lg:pb-0 lg:pt-0 lg:shadow-none">
          {consult}
        </div>

        <div className="order-5 flex min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 px-1 lg:col-span-2 lg:row-start-3 lg:px-1 lg:pb-1">
          <SiteLegalNav className="justify-start" />
          <Link
            href="/discover"
            className={`text-[12px] text-[var(--km-muted)] transition hover:text-[var(--km-gold-ink)] ${FOCUS}`}
          >
            きょうの読みもの
          </Link>
        </div>
      </div>

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
