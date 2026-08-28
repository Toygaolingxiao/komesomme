import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_JP, Noto_Serif_JP } from "next/font/google";
import { AnalyticsProvider } from "@/components/analytics/AnalyticsProvider";
import { GtmSnippet } from "@/components/analytics/GtmSnippet";
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
  "日本のブランド米を味わいの地図から探し、料理や気分に合う一膳へたどり着く選米ナビゲーション。";

export const metadata: Metadata = {
  metadataBase: siteMetadataBase(),
  title: {
    default: "KomeSomme | 米ソムリエ",
    template: "%s | KomeSomme",
  },
  description: SITE_DESCRIPTION,
  icons: {
    icon: [{ url: "/icon", type: "image/png" }],
    apple: [{ url: "/apple-icon", type: "image/png" }],
  },
  openGraph: {
    type: "website",
    locale: "ja_JP",
    siteName: "KomeSomme",
    title: "KomeSomme | 米ソムリエ",
    description: SITE_DESCRIPTION,
  },
  twitter: {
    card: "summary_large_image",
    title: "KomeSomme | 米ソムリエ",
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
        <GtmSnippet />
        <AnalyticsProvider>{children}</AnalyticsProvider>
      </body>
    </html>
  );
}
