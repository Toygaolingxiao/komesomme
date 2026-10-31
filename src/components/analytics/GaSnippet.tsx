import Script from "next/script";

/**
 * Direct GA4 gtag.js when NEXT_PUBLIC_GA_MEASUREMENT_ID is set.
 * send_page_view is off: AnalyticsProvider emits SPA page_view (including first paint).
 * Do not also set NEXT_PUBLIC_GTM_ID with a GA4 Config tag, or page_view doubles.
 */
export function GaSnippet() {
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID?.trim();
  if (!id) return null;

  return (
    <>
      <Script
        src={`https://www.googletagmanager.com/gtag/js?id=${id}`}
        strategy="lazyOnload"
      />
      <Script id="km-gtag" strategy="lazyOnload">{`
        window.dataLayer = window.dataLayer || [];
        function gtag(){dataLayer.push(arguments);}
        window.gtag = gtag;
        gtag('js', new Date());
        gtag('config', '${id}', { send_page_view: false, anonymize_ip: true });
      `}</Script>
    </>
  );
}
