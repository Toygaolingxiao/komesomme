import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { GtmSnippet } from "@/components/analytics/GtmSnippet";
import { SkipOnOps } from "@/components/analytics/SkipOnOps";
import { GUIDE_ROLE } from "@/lib/brand/guideRole";
import { siteMetadataBase } from "@/lib/site";
import "./globals.css";

const geist = Geist({ subsets: ["latin"], variable: "--font-geist" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono" });
const notoSansJp = Noto_Sans_JP({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-noto-sans-jp",
  display: "swap",
});
const notoSerifJp = Noto_Serif_JP({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
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
      className={`${geist.variable} ${geistMono.variable} ${notoSansJp.variable} ${notoSerifJp.variable}`}
    >
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "WebSite",
              name: "KomeSomme",
              alternateName: ["コメソムメ", GUIDE_ROLE],
              url: siteMetadataBase().origin,
              description: SITE_DESCRIPTION,
              inLanguage: "ja-JP",
            }),
          }}
        />
        <SkipOnOps>
          <GtmSnippet />
        </SkipOnOps>
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
