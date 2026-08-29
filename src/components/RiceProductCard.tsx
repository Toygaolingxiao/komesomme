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
import { FOCUS, firstSentence } from "@/components/matrix/shared";

type ShopLinks = {
  amazon: string;
  rakuten: string;
  yahoo: string;
  satofull: string;
};

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

function useShopLinks(rice: RiceProfileV2): ShopLinks {
  const [links, setLinks] = useState<ShopLinks>(() => fallbackLinks(rice));

  useEffect(() => {
    const next = fallbackLinks(rice);
    setLinks(next);

    const controller = new AbortController();
    fetch(`/api/rice/shop-links?id=${encodeURIComponent(rice.id)}`, {
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data: Partial<ShopLinks> | null) => {
        if (!data) return;
        setLinks((current) => ({
          amazon: httpsUrl(data.amazon, current.amazon),
          rakuten: httpsUrl(data.rakuten, current.rakuten),
          yahoo: httpsUrl(data.yahoo, current.yahoo),
          satofull: httpsUrl(data.satofull, current.satofull),
        }));
      })
      .catch(() => {
        /* keep search fallbacks */
      });

    return () => controller.abort();
  // Catalog rows are keyed by id; parent may pass a new object each render.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rice.id]);

  return links;
}

function httpsUrl(value: unknown, fallback: string): string {
  return typeof value === "string" && /^https?:\/\//.test(value) ? value : fallback;
}

function PlatformButton({
  href,
  label,
  badge,
  event,
  className,
}: {
  href: string;
  label: string;
  badge?: string;
  event: AnalyticsEvent;
  className: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel={AFFILIATE_LINK_REL}
      className={`relative inline-flex min-h-11 w-full items-center justify-center rounded-full px-3 py-2.5 text-center text-[12px] font-semibold transition ${FOCUS} ${className}`}
      onClick={() => track(event, { label })}
    >
      {badge ? (
        <span className="absolute -top-2 right-2 rounded-full bg-[var(--km-surface)] px-1.5 py-0.5 text-[9px] font-medium text-[var(--km-brown)] ring-1 ring-[var(--km-border)]">
          {badge}
        </span>
      ) : null}
      {label}
    </a>
  );
}

export function RiceProductCard({ rice }: { rice: RiceProfileV2 }) {
  const links = useShopLinks(rice);
  const summary = rice.short_?.trim() || firstSentence(rice.description) || rice.description;

  return (
    <article className="rounded-2xl border border-[var(--km-border)] bg-[var(--km-surface)] p-4 sm:p-5">
      <p className="text-[11px] tracking-[0.08em] text-[var(--km-muted)]">{rice.prefecture}</p>
      <h3 className="mt-1 font-serif text-[18px] font-semibold text-[var(--km-ink)]">{rice.name}</h3>
      {summary ? (
        <p className="mt-2 text-[13px] leading-relaxed text-[var(--km-ink-soft)]">{summary}</p>
      ) : null}

      <div className="mt-4 grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        <PlatformButton
          href={links.amazon}
          label="Amazon で探す"
          event="amazon_click"
          className="bg-[#ffd814] text-[#111] hover:bg-[#f7ca00]"
        />
        <PlatformButton
          href={links.rakuten}
          label="楽天市場で探す"
          event="rakuten_click"
          className="bg-[#bf0000] text-white hover:bg-[#a40000]"
        />
        <PlatformButton
          href={links.yahoo}
          label="Yahoo!で探す"
          event="yahoo_click"
          className="bg-[#ff0033] text-white hover:bg-[#e0002c]"
        />
        <PlatformButton
          href={links.satofull}
          label="さとふるで探す"
          badge="ふるさと納税"
          event="furusato_click"
          className="bg-[#1b4332] text-white hover:bg-[#16382a]"
        />
      </div>

      <AffiliateDisclosure className="mt-4" />
    </article>
  );
}
