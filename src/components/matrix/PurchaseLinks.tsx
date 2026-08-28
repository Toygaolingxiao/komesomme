"use client";

import type { AnalyticsEvent } from "@/lib/analytics";
import { track } from "@/lib/analytics";
import type { RiceProfileV2 } from "@/types/rice";
import {
  FOCUS,
  PURCHASE_NOTE,
  amazonUrl,
  furusatoKeyword,
  furusatoUrl,
  rakutenFurusatoUrl,
  rakutenUrl,
  shopKeyword,
  yahooFurusatoUrl,
  yahooShoppingUrl,
} from "./shared";

const LINK_CLASS = `inline-flex min-w-0 items-center justify-center rounded-full border border-[var(--km-border)] bg-[var(--km-surface)] px-1.5 py-2 text-center text-[10px] leading-tight text-[var(--km-muted)] transition hover:border-[var(--km-gold)]/40 hover:text-[var(--km-ink)] sm:px-3 sm:text-[11px] ${FOCUS}`;
const CTA_CLASS = `inline-flex items-center justify-center rounded-full px-4 py-2.5 text-[12px] font-semibold transition ${FOCUS}`;

type ShopLink = {
  href: string;
  short: string;
  full: string;
  event: AnalyticsEvent;
};

function shopLinks(rice: RiceProfileV2): ShopLink[] {
  const shop = shopKeyword(rice);
  const furusato = furusatoKeyword(rice);
  return [
    { href: rakutenUrl(shop), short: "楽天", full: "楽天市場", event: "rakuten_click" },
    {
      href: yahooShoppingUrl(shop),
      short: "Yahoo",
      full: "Yahoo!ショッピング",
      event: "yahoo_click",
    },
    { href: amazonUrl(shop), short: "Amazon", full: "Amazon", event: "amazon_click" },
    {
      href: rakutenFurusatoUrl(furusato),
      short: "楽天ふるさと",
      full: "楽天ふるさと",
      event: "furusato_click",
    },
    {
      href: yahooFurusatoUrl(furusato),
      short: "Yahooふるさと",
      full: "Yahoo!ふるさと",
      event: "furusato_click",
    },
    {
      href: furusatoUrl(furusato),
      short: "ふるさと",
      full: "ふるさと納税",
      event: "furusato_click",
    },
  ];
}

function ProviderRow({
  title,
  hint,
  links,
}: {
  title: string;
  hint: string;
  links: ShopLink[];
}) {
  return (
    <div>
      <p className="text-[11px] font-medium text-[var(--km-ink)]">{title}</p>
      <p className="mt-0.5 text-[10px] text-[var(--km-muted)]">{hint}</p>
      <div className="mt-2 grid grid-cols-3 gap-1.5 sm:gap-2">
        {links.map((link) => (
          <a
            key={link.full}
            href={link.href}
            target="_blank"
            rel="noopener noreferrer"
            className={LINK_CLASS}
            onClick={() => track(link.event, { label: link.full })}
          >
            <span className="sm:hidden">{link.short}</span>
            <span className="hidden sm:inline">{link.full}</span>
          </a>
        ))}
      </div>
    </div>
  );
}

export function PurchaseLead({ rice }: { rice: RiceProfileV2 }) {
  const furusato = furusatoUrl(furusatoKeyword(rice));

  return (
    <div className="flex flex-wrap gap-2">
      <a
        href="#km-purchase"
        className={`${CTA_CLASS} border border-[var(--km-brown)]/25 bg-[var(--km-surface-warm)] text-[var(--km-brown)] hover:border-[var(--km-gold)]/40`}
        onClick={(event) => {
          event.preventDefault();
          track("purchase_cta_click", { target: "candidates" });
          document.getElementById("km-purchase")?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }}
      >
        購入候補を見る
      </a>
      <a
        href={furusato}
        target="_blank"
        rel="noopener noreferrer"
        className={`${CTA_CLASS} border border-[var(--km-border)] text-[var(--km-muted)] hover:border-[var(--km-gold)]/40 hover:text-[var(--km-ink)]`}
        onClick={() => {
          track("purchase_cta_click", { target: "furusato" });
          track("furusato_click", { label: "top" });
        }}
      >
        ふるさと納税で探す
      </a>
    </div>
  );
}

/**
 * Quiet commerce search links. Keywords only, not product pages.
 * Layout is always 2 rows × 3 columns — never a 2-column wrap.
 */
export function PurchaseLinks({ rice }: { rice: RiceProfileV2 }) {
  const links = shopLinks(rice);
  const shop = links.slice(0, 3);
  const furusato = links.slice(3);

  return (
    <div id="km-purchase">
      <p className="font-serif text-[13px] font-semibold text-[var(--km-ink)]">
        この銘柄を探す
      </p>
      <div className="mt-3 flex flex-col gap-4">
        <ProviderRow
          title="通常購入"
          hint="価格や容量を比べたい方に"
          links={shop}
        />
        <ProviderRow
          title="ふるさと納税"
          hint="産地を応援しながら返礼品を探したい方に"
          links={furusato}
        />
      </div>
      <p className="mt-3 text-[10px] leading-relaxed text-[var(--km-muted)]">
        {PURCHASE_NOTE}
      </p>
    </div>
  );
}
