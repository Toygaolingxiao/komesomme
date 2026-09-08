import { readFile } from "node:fs/promises";
import path from "node:path";

export type OgFont = {
  name: string;
  data: ArrayBuffer;
  style: "normal";
  weight: 500 | 700;
};

const FONT_DIR = path.join(process.cwd(), "public", "share", "fonts");

let cached: Promise<OgFont[]> | null = null;

async function readArrayBuffer(filePath: string): Promise<ArrayBuffer> {
  const buf = await readFile(filePath);
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength);
}

/**
 * Japanese faces for `next/og`. Satori ships a latin-only default, so kana and
 * kanji come out as blank boxes unless these are passed to `ImageResponse`.
 */
export function loadOgFonts(): Promise<OgFont[]> {
  if (!cached) {
    cached = Promise.all([
      readArrayBuffer(path.join(FONT_DIR, "NotoSansJP-500.ttf")),
      readArrayBuffer(path.join(FONT_DIR, "NotoSerifJP-700.ttf")),
    ])
      .then(([sans, serif]): OgFont[] => [
        { name: "Noto Sans JP", data: sans, style: "normal", weight: 500 },
        { name: "Noto Serif JP", data: serif, style: "normal", weight: 700 },
      ])
      .catch((error) => {
        cached = null;
        throw error;
      });
  }
  return cached;
}
