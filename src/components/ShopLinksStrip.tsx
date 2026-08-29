"use client";

import { useEffect, useState } from "react";
import type { AnalyticsEvent } from "@/lib/analytics";
import { track } from "@/lib/analytics";
import { AffiliateDisclosure } from "@/components/AffiliateDisclosure";
import {
  AFFILIATE_LINK_REL,
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
          className={`absolute font-medium text-[var(--km-brown)] ring-1 ring-[var(--km-border)] ${
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
  /** Heading above the buttons. */
  title?: string;
  /**
   * `pr` — home rail: ※PR only (no Amazon wall / Rakuten credit).
   * `full` — purchase card / footer surfaces.
   * `none` — disclosure lives elsewhere on the same view.
   */
  disclosure?: "none" | "pr" | "full";
  className?: string;
};

/**
 * Four mall CTAs + optional affiliate disclosure.
 * Compact + `pr` keeps 今日の一膳 free of legal walls of text.
 */
export function ShopLinksStrip({
  rice,
  variant = "full",
  title = "取扱オンラインショップ",
  disclosure,
  className = "",
}: ShopLinksStripProps) {
  const links = useShopLinks(rice);
  const compact = variant === "compact";
  const mode = disclosure ?? (compact ? "pr" : "full");

  return (
    <div className={className}>
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

      <div
        className={`grid grid-cols-2 gap-2 ${
          title || mode === "pr" ? (compact ? "mt-1.5" : "mt-3") : ""
        }`}
      >
        <PlatformButton
          href={links.amazon}
          label={compact ? "Amazon" : "Amazon で探す"}
          event="amazon_click"
          className="bg-[#ffd814] text-[#111] hover:bg-[#f7ca00]"
          compact={compact}
        />
        <PlatformButton
          href={links.rakuten}
          label={compact ? "楽天市場" : "楽天市場で探す"}
          event="rakuten_click"
          className="bg-[#bf0000] text-white hover:bg-[#a40000]"
          compact={compact}
        />
        <PlatformButton
          href={links.yahoo}
          label={compact ? "Yahoo!" : "Yahoo!で探す"}
          event="yahoo_click"
          className="bg-[#ff0033] text-white hover:bg-[#e0002c]"
          compact={compact}
        />
        <PlatformButton
          href={links.satofull}
          label={compact ? "さとふる" : "さとふるで探す"}
          badge="ふるさと納税"
          event="furusato_click"
          className="bg-[#1b4332] text-white hover:bg-[#16382a]"
          compact={compact}
        />
      </div>

      {mode === "full" ? <AffiliateDisclosure variant="full" className="mt-4" /> : null}
    </div>
  );
}
