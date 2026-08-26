import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "KomeSomme | AI 侍米师",
  description:
    "日本ブランド米の2D風味マトリクスとAI献立ペアリングで、最適な一品を見つけるナビゲート体験。",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body>{children}</body>
    </html>
  );
}
