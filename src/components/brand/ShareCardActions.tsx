"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { DownloadSimple, LinkSimple, QrCode, ShareNetwork } from "@phosphor-icons/react";
import { track } from "@/lib/analytics";
import {
  libraryPath,
  shareCaption,
  shareCardPath,
} from "@/lib/brand/shareCard";
import { isShareCardEnabled } from "@/lib/brand/shareCardEnabled";
import { FOCUS, ICON_WEIGHT } from "@/components/matrix/shared";
import type { RiceProfileV2 } from "@/types/rice";

type Props = {
  rice: RiceProfileV2;
  /** Compact for the home detail panel. */
  compact?: boolean;
};

type Busy = "share" | "save" | "save_qr" | "link" | null;

function absoluteUrl(path: string): string {
  if (typeof window === "undefined") return path;
  return new URL(path, window.location.origin).toString();
}

/**
 * Download / native-share a phone-portrait brand card + copy page link.
 * Default card has no QR (safer for Xiaohongshu). Optional QR build for X / offline.
 */
export function ShareCardActions({ rice, compact = false }: Props) {
  const [busy, setBusy] = useState<Busy>(null);
  const [note, setNote] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const blobCache = useRef<{ noQr: Blob | null; withQr: Blob | null }>({
    noQr: null,
    withQr: null,
  });
  const prefetchAbort = useRef<AbortController | null>(null);
  const enabled = isShareCardEnabled();

  const cardPath = shareCardPath(rice.id);
  const cardPathQr = shareCardPath(rice.id, { qr: true });
  const pagePath = libraryPath(rice.id);

  const fetchCardBlob = useCallback(
    async (withQr: boolean, signal?: AbortSignal): Promise<Blob> => {
      const key = withQr ? "withQr" : "noQr";
      if (blobCache.current[key]) return blobCache.current[key]!;
      const res = await fetch(withQr ? cardPathQr : cardPath, { signal });
      if (!res.ok) throw new Error("card_fetch_failed");
      const blob = await res.blob();
      blobCache.current[key] = blob;
      return blob;
    },
    [cardPath, cardPathQr]
  );

  // Prefetch the Xiaohongshu-safe (no-QR) card while the panel is open and
  // show it as a preview as soon as it exists, so the reader sees the card
  // before deciding to share. The QR variant follows on an idle timer:
  // first generation is slow (~20s of font/image work server-side), so
  // neither variant should start at tap time.
  useEffect(() => {
    if (!enabled) return;
    blobCache.current = { noQr: null, withQr: null };
    prefetchAbort.current?.abort();
    const ctrl = new AbortController();
    prefetchAbort.current = ctrl;
    let objectUrl: string | null = null;
    let qrTimer: ReturnType<typeof setTimeout> | null = null;
    setPreviewUrl(null);
    setPreviewFailed(false);
    void fetchCardBlob(false, ctrl.signal)
      .then((blob) => {
        if (ctrl.signal.aborted) return;
        objectUrl = URL.createObjectURL(blob);
        setPreviewUrl(objectUrl);
        qrTimer = setTimeout(() => {
          void fetchCardBlob(true, ctrl.signal).catch(() => {
            /* prefetch is best-effort */
          });
        }, 1500);
      })
      .catch(() => {
        if (!ctrl.signal.aborted) setPreviewFailed(true);
      });
    return () => {
      ctrl.abort();
      if (qrTimer) clearTimeout(qrTimer);
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [enabled, fetchCardBlob]);

  async function onShare() {
    setBusy("share");
    setNote(null);
    try {
      const pageUrl = absoluteUrl(pagePath);
      const caption = shareCaption(rice, pageUrl);
      const blob = await fetchCardBlob(false);
      const file = new File([blob], `${rice.id}-komesomme.png`, {
        type: "image/png",
      });

      const canFileShare =
        typeof navigator !== "undefined" &&
        typeof navigator.share === "function" &&
        !!navigator.canShare?.({ files: [file] });

      if (canFileShare) {
        try {
          await navigator.share({
            files: [file],
            title: `${rice.name} | KomeSomme`,
            text: caption,
          });
          track("share_card_native", { id: rice.id });
          setNote("共有シートを開きました");
          return;
        } catch (error) {
          if (isAbort(error)) return;
        }
      }

      await downloadBlob(blob, `${rice.id}-komesomme.png`);
      let copied = false;
      try {
        await navigator.clipboard.writeText(caption);
        copied = true;
      } catch {
        /* clipboard may be blocked */
      }
      track("share_card_download", { id: rice.id, via: "share_fallback" });
      setNote(
        copied
          ? "画像を保存し、投稿文をコピーしました"
          : "画像を保存しました。投稿アプリに添付してください"
      );
    } catch (error) {
      if (isAbort(error)) return;
      setNote("通信エラーです。もう一度お試しください");
    } finally {
      setBusy(null);
    }
  }

  async function onSave(withQr: boolean) {
    setBusy(withQr ? "save_qr" : "save");
    setNote(null);
    try {
      const blob = await fetchCardBlob(withQr);
      const filename = withQr
        ? `${rice.id}-komesomme-qr.png`
        : `${rice.id}-komesomme.png`;
      await downloadBlob(blob, filename);
      track("share_card_download", {
        id: rice.id,
        via: withQr ? "button_qr" : "button",
      });
      setNote(
        withQr
          ? "QR付きのカードを保存しました"
          : "カードを保存しました"
      );
    } catch {
      setNote("保存できませんでした。通信を確認してください");
    } finally {
      setBusy(null);
    }
  }

  async function onCopyLink() {
    setBusy("link");
    setNote(null);
    try {
      const pageUrl = absoluteUrl(pagePath);
      await navigator.clipboard.writeText(pageUrl);
      track("share_card_copy_link", { id: rice.id });
      setNote("リンクをコピーしました");
    } catch {
      setNote("コピーできませんでした");
    } finally {
      setBusy(null);
    }
  }

  const btn =
    "inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-[var(--km-brown)]/[0.07] px-3 text-[12.5px] font-medium text-[var(--km-ink)] transition hover:bg-[var(--km-brown)]/[0.12] hover:text-[var(--km-brown)] disabled:opacity-45";

  if (!enabled) return null;

  return (
    <div className={compact ? "mt-4" : "mt-5"}>
      {previewUrl ? (
        <figure className="mb-3">
          {/* The generated card itself, from the prefetched blob. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={`${rice.name}のシェアカード`}
            className={`${compact ? "h-40" : "h-48"} w-auto rounded-xl border border-[var(--km-border)] shadow-sm`}
          />
          <figcaption className="mt-1.5 text-[11px] text-[var(--km-muted)]">
            カードのプレビュー（この画像が共有・保存されます）
          </figcaption>
        </figure>
      ) : previewFailed ? null : (
        <div
          className={`mb-3 flex ${compact ? "h-40" : "h-48"} aspect-[3/4] w-auto items-center justify-center rounded-xl border border-dashed border-[var(--km-border)] bg-[var(--km-brown)]/[0.03] px-3 text-center`}
          role="status"
        >
          <p className="text-[11px] leading-relaxed text-[var(--km-muted)]">
            カードを作成しています…
            <br />
            初回は少し時間がかかります
          </p>
        </div>
      )}
      <div className={`grid grid-cols-2 gap-2 sm:flex sm:flex-wrap ${FOCUS}`}>
        <button
          type="button"
          className={btn}
          disabled={busy !== null}
          onClick={() => void onShare()}
        >
          <ShareNetwork size={15} weight={ICON_WEIGHT} />
          {busy === "share" ? "作成中…" : "シェア"}
        </button>
        <button
          type="button"
          className={btn}
          disabled={busy !== null}
          onClick={() => void onSave(false)}
        >
          <DownloadSimple size={15} weight={ICON_WEIGHT} />
          {busy === "save" ? "作成中…" : "カードを保存"}
        </button>
        <button
          type="button"
          className={btn}
          disabled={busy !== null}
          onClick={() => void onSave(true)}
          title="Xや印刷用です"
        >
          <QrCode size={15} weight={ICON_WEIGHT} />
          {busy === "save_qr" ? "作成中…" : "QR付きで保存"}
        </button>
        <button
          type="button"
          className={btn}
          disabled={busy !== null}
          onClick={() => void onCopyLink()}
        >
          <LinkSimple size={15} weight={ICON_WEIGHT} />
          {busy === "link" ? "…" : "リンクをコピー"}
        </button>
      </div>
      <p className="mt-2 max-w-[42rem] text-[11px] leading-relaxed text-[var(--km-muted)]">
        縦長（3:4）のカードです。QRは付いていません。Xや印刷には「QR付きで保存」を使ってください。
      </p>
      {note ? (
        <p className="mt-1.5 text-[11px] text-[var(--km-brown)]" role="status">
          {note}
        </p>
      ) : null}
    </div>
  );
}

async function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

function isAbort(error: unknown): boolean {
  return (
    typeof error === "object" &&
    error !== null &&
    "name" in error &&
    (error as { name?: string }).name === "AbortError"
  );
}
