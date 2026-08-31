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
  rakutenFurusatoSearchUrl,
  shopQuery,
  yahooFurusatoSearchUrl,
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
  rakutenFurusato: string;
  yahooFurusato: string;
};

type ShopMode = "retail" | "furusato";

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
    rakutenFurusato: wrapRakutenAffiliateUrl(rakutenFurusatoSearchUrl(furusato)),
    yahooFurusato: yahooFurusatoSearchUrl(furusato),
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
          rakutenFurusato: httpsUrl(data.rakutenFurusato, next.rakutenFurusato),
          yahooFurusato: httpsUrl(data.yahooFurusato, next.yahooFurusato),
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
  event,
  className,
  compact,
}: {
  href: string;
  label: string;
  event: AnalyticsEvent;
  className: string;
  compact?: boolean;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel={AFFILIATE_LINK_REL}
      className={`inline-flex w-full items-center justify-center rounded-full text-center font-semibold transition ${FOCUS} ${className} ${
        compact ? "min-h-9 px-2 py-1.5 text-[11px]" : "min-h-11 px-3 py-2.5 text-[12px]"
      }`}
      onClick={() => track(event, { label })}
    >
      {label}
    </a>
  );
}

function ModeTabs({
  mode,
  onChange,
  compact,
}: {
  mode: ShopMode;
  onChange: (next: ShopMode) => void;
  compact?: boolean;
}) {
  return (
    <div
      role="tablist"
      aria-label="購入の種類"
      className={`flex rounded-full border border-[var(--km-border)] bg-[var(--km-surface-warm)]/70 p-0.5 ${
        compact ? "text-[10px]" : "text-[11px]"
      }`}
    >
      {(
        [
          ["retail", "通販"],
          ["furusato", "ふるさと納税"],
        ] as const
      ).map(([id, label]) => {
        const selected = mode === id;
        return (
          <button
            key={id}
            type="button"
            role="tab"
            aria-selected={selected}
            className={`min-w-0 flex-1 rounded-full px-2.5 py-1 font-medium tracking-wide transition ${FOCUS} ${
              selected
                ? "bg-[var(--km-surface)] text-[var(--km-ink)] shadow-[0_1px_2px_rgba(112,69,34,0.12)]"
                : "text-[var(--km-muted)] hover:text-[var(--km-ink)]"
            }`}
            onClick={() => {
              onChange(id);
              track("shop_mode_toggle", { mode: id });
            }}
          >
            {label}
          </button>
        );
      })}
    </div>
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

/**
 * Soft versions of each mall's official hue (not invented colors).
 * Rakuten #bf0000 → muted brick; Yahoo #ff0033 → lighter pink-red; Amazon gold; さとふる green.
 */
const MALL_STYLES = {
  amazon: "bg-[#e8c84a] text-[#1a1510] hover:bg-[#dfbf3a]",
  rakuten: "bg-[#c05050] text-white hover:bg-[#ad4545]",
  yahoo: "bg-[#ef6b7e] text-white hover:bg-[#e0556a]",
  satofull: "bg-[#3a6b56] text-white hover:bg-[#335f4c]",
} as const;

/**
 * Mall CTAs + optional affiliate disclosure.
 * Equal-width stack: 楽天 → Yahoo → Amazon / さとふる (last is not larger).
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
  const [shopMode, setShopMode] = useState<ShopMode>("retail");

  useEffect(() => {
    setOpen(expandMode === "always");
    setShopMode("retail");
  }, [rice.id, expandMode]);

  const short = compact || expandMode === "disclosure";

  const mallGrid = (
    <div className={`flex flex-col gap-2 ${compact ? "mt-1" : "mt-2"}`}>
      {shopMode === "retail" ? (
        <>
          <PlatformButton
            href={links.rakuten}
            label={short ? "楽天市場" : "楽天市場で探す"}
            event="rakuten_click"
            className={MALL_STYLES.rakuten}
            compact={compact}
          />
          <PlatformButton
            href={links.yahoo}
            label={short ? "Yahoo!" : "Yahoo!で探す"}
            event="yahoo_click"
            className={MALL_STYLES.yahoo}
            compact={compact}
          />
          <PlatformButton
            href={links.amazon}
            label={short ? "Amazon" : "Amazon で探す"}
            event="amazon_click"
            className={MALL_STYLES.amazon}
            compact={compact}
          />
        </>
      ) : (
        <>
          <PlatformButton
            href={links.rakutenFurusato}
            label={short ? "楽天" : "楽天ふるさと"}
            event="furusato_click"
            className={MALL_STYLES.rakuten}
            compact={compact}
          />
          <PlatformButton
            href={links.yahooFurusato}
            label={short ? "Yahoo!" : "Yahoo!ふるさと"}
            event="furusato_click"
            className={MALL_STYLES.yahoo}
            compact={compact}
          />
          <PlatformButton
            href={links.satofull}
            label={short ? "さとふる" : "さとふるで探す"}
            event="furusato_click"
            className={MALL_STYLES.satofull}
            compact={compact}
          />
        </>
      )}
    </div>
  );

  const tabs = (
    <ModeTabs mode={shopMode} onChange={setShopMode} compact={compact || expandMode === "disclosure"} />
  );

  if (expandMode === "disclosure") {
    return (
      <div
        className={className}
        data-shop-strip="disclosure"
        data-shop-expanded={open ? "true" : "false"}
        data-shop-mode={shopMode}
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
            <div className="mt-1">{tabs}</div>
            {mallGrid}
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className={className} data-shop-strip="brand" data-shop-mode={shopMode}>
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

      <div className={compact ? "mt-2" : "mt-3"}>{tabs}</div>
      {mallGrid}

      {mode === "full" ? <AffiliateDisclosure variant="full" className="mt-4" /> : null}
    </div>
  );
}
