import type { Metadata } from "next";
import { Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { MobileTabBar } from "@/components/MobileTabBar";
import { GaSnippet } from "@/components/analytics/GaSnippet";
import { GtmSnippet } from "@/components/analytics/GtmSnippet";
import { SkipOnOps } from "@/components/analytics/SkipOnOps";
import { JsonLd } from "@/components/seo/JsonLd";
import { GUIDE_ROLE } from "@/lib/brand/guideRole";
import { websiteLd } from "@/lib/seo/jsonLd";
import { siteMetadataBase } from "@/lib/site";
import "./globals.css";

const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-noto-sans-jp",
  display: "swap",
  preload: false,
});
const notoSerifJp = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["600"],
  variable: "--font-noto-serif-jp",
  display: "swap",
});

const SITE_DESCRIPTION =
  "味わいの地図から、今日のごはんに合う日本のブランド米を。料理や気分に合わせてご案内します。";

const SITE_TITLE = `KomeSomme | ${GUIDE_ROLE}`;

export const metadata: Metadata = {
  metadataBase: siteMetadataBase(),
  title: {
    default: SITE_TITLE,
    template: "%s | KomeSomme",
  },
  description: SITE_DESCRIPTION,
  // Large previews are a precondition for Discover image cards. /ops overrides this.
  robots: {
    index: true,
    follow: true,
    "max-image-preview": "large",
    "max-snippet": -1,
  },
  icons: {
    icon: [{ url: "/icon", type: "image/png", sizes: "48x48" }],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "KomeSomme",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ja"
      className={`${notoSansJp.variable} ${notoSerifJp.variable}`}
    >
      <body>
        <JsonLd data={websiteLd(SITE_DESCRIPTION)} />
        <SkipOnOps>
          <GtmSnippet />
          <GaSnippet />
        </SkipOnOps>
        <AnalyticsProvider>{children}</AnalyticsProvider>
        <MobileTabBar />
      </body>
    </html>
  );
}
