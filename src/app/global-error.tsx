"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);

  return (
    <html lang="ja">
      <body
        style={{
          margin: 0,
          minHeight: "100dvh",
          background: "#f6ebdd",
          color: "#302820",
          fontFamily:
            '"Noto Sans JP", "Hiragino Sans", "Yu Gothic", ui-sans-serif, system-ui, sans-serif',
        }}
      >
        <main style={{ maxWidth: "32rem", margin: "0 auto", padding: "3rem 1.25rem" }}>
          <h1 style={{ fontSize: "1.35rem", fontWeight: 600, letterSpacing: "-0.02em" }}>
            このページを表示できませんでした
          </h1>
          <p style={{ marginTop: "0.85rem", lineHeight: 1.7, color: "#5c4e40", fontSize: "0.95rem" }}>
            時間をおいて、もう一度読み込んでみてください。
          </p>
          <button
            type="button"
            onClick={reset}
            style={{
              marginTop: "1.5rem",
              border: "1px solid rgba(112, 69, 34, 0.22)",
              background: "#fffdf7",
              color: "#302820",
              padding: "0.55rem 1rem",
              borderRadius: "2px",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            再読み込み
          </button>
        </main>
      </body>
    </html>
  );
}
