"use client";

import { useEffect, useId, useState } from "react";
import { CaretDown } from "@phosphor-icons/react";
import type { AnalyticsEvent } from "@/lib/analytics";
import { track } from "@/lib/analytics";
import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";
import {
  AFFILIATE_LINK_REL,
  AFFILIATE_PR_LABEL,
  amazonSearchUrl,
  furusatoQuery,
  shopQuery,
  yahooShoppingSearchUrl,
} from "@/lib/affiliate";
import { wrapRakutenAffiliateUrl, rakutenSearchUrl } from "@/lib/rakuten/affiliate";
import { riceRakutenKeyword } from "@/lib/rakuten/keyword";
import type { RiceProfileV2 } from "@/types/rice";
import { FOCUS } from "@/components/matrix/shared";

export type ShopLinks = {
  amazon: string;
  rakuten: string;
  yahoo: string;
  satofull: string;
};

const linkCache = new Map<string, ShopLinks>();

function shopKeyword(rice: RiceProfileV2): string {
  return (
    riceRakutenKeyword(rice) ||
    shopQuery({ prefecture: rice.prefecture, brand: rice.name })
  );
}

function furusatoKeyword(rice: RiceProfileV2): string {
  return (
    rice.furusato_keywords?.[0]?.trim() ||
    furusatoQuery({ prefecture: rice.prefecture, brand: rice.name })
  );
}

function fallbackLinks(rice: RiceProfileV2): ShopLinks {
  const shop = shopKeyword(rice);
  const furusato = furusatoKeyword(rice);
  return {
    amazon: amazonSearchUrl(shop),
    rakuten: wrapRakutenAffiliateUrl(rakutenSearchUrl(shop)),
    yahoo: yahooShoppingSearchUrl(shop),
    satofull: `https://www.satofull.jp/products/list.php?q=${encodeURIComponent(furusato)}`,
  };
}

function httpsUrl(value: unknown, fallback: string): string {
  return typeof value === "string" && /^https?:\/\//.test(value) ? value : fallback;
}

/** Shared fetch so rail + detail panel do not hammer `/api/rice/shop-links`. */
export function useShopLinks(rice: RiceProfileV2): ShopLinks {
  const cached = linkCache.get(rice.id);
  const [links, setLinks] = useState<ShopLinks>(() => cached ?? fallbackLinks(rice));

  useEffect(() => {
    const hit = linkCache.get(rice.id);
    if (hit) {
      setLinks(hit);
      return;
    }

    const next = fallbackLinks(rice);
    setLinks(next);

    const controller = new AbortController();
    fetch(`/api/rice/shop-links?id=${encodeURIComponent(rice.id)}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: Partial<ShopLinks> | null) => {
        if (!data) {
          linkCache.set(rice.id, next);
          return;
        }
        const resolved: ShopLinks = {
          amazon: httpsUrl(data.amazon, next.amazon),
          rakuten: httpsUrl(data.rakuten, next.rakuten),
          yahoo: httpsUrl(data.yahoo, next.yahoo),
          satofull: httpsUrl(data.satofull, next.satofull),
        };
        linkCache.set(rice.id, resolved);
        setLinks(resolved);
      })
      .catch(() => {
        linkCache.set(rice.id, next);
      });

    return () => controller.abort();
  // Catalog rows are keyed by id; parent may pass a new object each render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rice.id]);

  return links;
}

function PlatformButton({
  href,
  label,
  badge,
  event,
  className,
  compact,
}: {
  href: string;
  label: string;
  badge?: string;
  event: AnalyticsEvent;
  className: string;
  compact?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel={AFFILIATE_LINK_REL}
      className={`relative inline-flex w-full items-center justify-center rounded-full text-center font-semibold transition ${FOCUS} ${className} ${
        compact
          ? "min-h-9 px-2 py-1.5 text-[11px]"
          : "min-h-11 px-3 py-2.5 text-[12px]"
      }`}
      onClick={() => track(event, { label })}
    >
      {badge ? (
        <span
          className={`absolute z-10 font-medium text-[var(--km-brown)] ring-1 ring-[var(--km-border)] ${
            compact
              ? "-top-1.5 right-1 rounded-full bg-[var(--km-surface)] px-1 py-px text-[8px]"
              : "-top-2 right-2 rounded-full bg-[var(--km-surface)] px-1.5 py-0.5 text-[9px]"
          }`}
        >
          {badge}
        </span>
      ) : null}
      {label}
    </a>
  );
}

type ShopLinksStripProps = {
  rice: RiceProfileV2;
  /** Compact rail / lead; full uses larger tap targets. */
  variant?: "compact" | "full";
  /**
   * `always` — show mall links immediately.
   * `disclosure` — Sommelier-first: one quiet CTA, expand on demand (home).
   */
  expandMode?: "always" | "disclosure";
  /** Heading above the buttons (always-open surfaces). */
  title?: string;
  /**
   * `pr` — ※PR chip next to CTAs (default). Full Amazon / Rakuten copy is SiteFooter.
   * `full` — do not use on cards; reserved if a surface has no footer.
   * `none` — disclosure lives elsewhere on the same view.
   */
  disclosure?: "none" | "pr" | "full";
  className?: string;
};

/** Full brand fills — detail modal / brand page (decision surface). */
const BRAND_STYLES = {
  amazon: "bg-[#ffd814] text-[#111] hover:bg-[#f7ca00]",
  rakuten: "bg-[#bf0000] text-white hover:bg-[#a40000]",
  yahoo: "bg-[#ff0033] text-white hover:bg-[#e0002c]",
  satofull: "bg-[#1b4332] text-white hover:bg-[#16382a]",
} as const;

/**
 * Same hue, slightly eased saturation — home disclosure expand only.
 * Still reads as mall CTAs; less shouty on the paper canvas.
 */
const BRAND_STYLES_SOFT = {
  amazon: "bg-[#e8c84a] text-[#1a1510] hover:bg-[#dfbf3a]",
  rakuten: "bg-[#c45a5a] text-white hover:bg-[#b44e4e]",
  yahoo: "bg-[#e85a6b] text-white hover:bg-[#d64d5d]",
  satofull: "bg-[#3a6b56] text-white hover:bg-[#335f4c]",
} as const;

/**
 * Four mall CTAs + optional affiliate disclosure.
 * Home: `expandMode="disclosure"` + soft brand fills when open.
 * Detail / brand page: full brand fills, always open.
 */
export function ShopLinksStrip({
  rice,
  variant = "full",
  expandMode = "always",
  title = "取扱オンラインショップ",
  disclosure,
  className = "",
}: ShopLinksStripProps) {
  const links = useShopLinks(rice);
  const compact = variant === "compact";
  const mode = disclosure ?? "pr";
  const panelId = useId();
  const [open, setOpen] = useState(expandMode === "always");

  useEffect(() => {
    setOpen(expandMode === "always");
  }, [rice.id, expandMode]);

  const short = compact || expandMode === "disclosure";
  const fills = expandMode === "disclosure" ? BRAND_STYLES_SOFT : BRAND_STYLES;

  const mallGrid = (
    // pt keeps ふるさと納税 badge from clipping at the top edge
    <div className={`grid grid-cols-2 gap-2 pt-2 ${compact ? "mt-1" : "mt-2"}`}>
      <PlatformButton
        href={links.amazon}
        label={short ? "Amazon" : "Amazon で探す"}
        event="amazon_click"
        className={fills.amazon}
        compact={compact}
      />
      <PlatformButton
        href={links.rakuten}
        label={short ? "楽天市場" : "楽天市場で探す"}
        event="rakuten_click"
        className={fills.rakuten}
        compact={compact}
      />
      <PlatformButton
        href={links.yahoo}
        label={short ? "Yahoo!" : "Yahoo!で探す"}
        event="yahoo_click"
        className={fills.yahoo}
        compact={compact}
      />
      <PlatformButton
        href={links.satofull}
        label={short ? "さとふる" : "さとふるで探す"}
        badge="ふるさと納税"
        event="furusato_click"
        className={fills.satofull}
        compact={compact}
      />
    </div>
  );

  if (expandMode === "disclosure") {
    return (
      <div
        className={className}
        data-shop-strip="disclosure"
        data-shop-expanded={open ? "true" : "false"}
      >
        <button
          type="button"
          aria-expanded={open}
          aria-controls={panelId}
          onClick={() => {
            setOpen((prev) => {
              const next = !prev;
              track("shop_disclosure_toggle", { id: rice.id, open: next });
              return next;
            });
          }}
          className={`flex w-full items-center justify-between gap-3 rounded-2xl px-1 py-2 text-left transition hover:bg-[var(--km-surface-warm)]/40 ${FOCUS}`}
        >
          <span className="min-w-0">
            <span className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
              <span className="font-serif text-[15px] font-semibold tracking-tight text-[var(--km-ink)]">
                お店で探す
              </span>
              {mode === "pr" ? (
                <span className="text-[10px] text-[var(--km-muted)]">{AFFILIATE_PR_LABEL}</span>
              ) : null}
            </span>
            <span className="mt-0.5 block text-[12px] leading-snug text-[var(--km-muted)]">
              {open ? "とじる" : `${rice.name}の取扱店`}
            </span>
          </span>
          <CaretDown
            size={16}
            weight="bold"
            className={`shrink-0 text-[var(--km-brown)] transition duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </button>

        {open ? (
          <div id={panelId} className="overflow-visible pb-0.5">
            {mallGrid}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={className} data-shop-strip="brand">
      {title || mode === "pr" ? (
        <div className="flex items-center justify-between gap-2">
          {title ? (
            <p
              className={
                compact
                  ? "text-[10px] tracking-[0.06em] text-[var(--km-muted)]"
                  : "font-serif text-[13px] font-semibold text-[var(--km-ink)]"
              }
            >
              {title}
            </p>
          ) : (
            <span />
          )}
          {mode === "pr" ? <AffiliateDisclosure variant="pr" /> : null}
        </div>
      ) : null}

      {mallGrid}

      {mode === "full" ? <AffiliateDisclosure variant="full" className="mt-4" /> : null}
    </div>
  );
}
