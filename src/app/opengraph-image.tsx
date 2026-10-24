import { readFile } from "node:fs/promises";
import path from "node:path";
import { ImageResponse } from "next/og";

export const alt = "KomeSomme | 侍米師（じべいし）";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/** Paper ground — same as `Banner_Rice.png` and `--km` paper. */
const PAPER = "#F6EBDD";

/**
 * Finished X header (`public/brand/social/Banner_Rice.png`) is 1500×500.
 * OG cards are 1200×630 (~1.91:1). Show the bowl and the full wordmark,
 * and drop only the far-left gold bleed so the tagline keeps a right margin
 * when a client crops to the card itself.
 */
const BANNER_W = 1500;
const BANNER_H = 500;
const CROP_X = 180;
const FRAME_W = size.width;
const SCALE = FRAME_W / (BANNER_W - CROP_X);
const IMAGE_W = Math.round(BANNER_W * SCALE);
const IMAGE_H = Math.round(BANNER_H * SCALE);
const SHIFT_X = -Math.round(CROP_X * SCALE);
const BAND_TOP = Math.round((size.height - IMAGE_H) / 2);
const FADE = 28;
// Satori paints `transparent` in linear-gradient as a gray bar. Step the
// paper color down with opacity so the 3:1 banner melts into the taller card.

const BANNER_PATH = path.join(process.cwd(), "public", "brand", "social", "Banner_Rice.png");

export default async function OpenGraphImage() {
  const banner = await readFile(BANNER_PATH);
  const src = `data:image/png;base64,${banner.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          background: PAPER,
          position: "relative",
        }}
      >
        <div
          style={{
            position: "absolute",
            top: BAND_TOP,
            left: 0,
            width: FRAME_W,
            height: IMAGE_H,
            display: "flex",
            overflow: "hidden",
          }}
        >
          <img
            src={src}
            width={IMAGE_W}
            height={IMAGE_H}
            style={{ marginLeft: SHIFT_X }}
            alt=""
          />
        </div>
        <div
          style={{
            position: "absolute",
            top: BAND_TOP,
            left: 0,
            width: FRAME_W,
            height: FADE,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {Array.from({ length: FADE / 2 }, (_, index) => (
            <div
              key={`top-${index}`}
              style={{
                width: FRAME_W,
                height: 2,
                background: PAPER,
                opacity: 1 - index / (FADE / 2),
              }}
            />
          ))}
        </div>
        <div
          style={{
            position: "absolute",
            top: BAND_TOP + IMAGE_H - FADE,
            left: 0,
            width: FRAME_W,
            height: FADE,
            display: "flex",
            flexDirection: "column",
          }}
        >
          {Array.from({ length: FADE / 2 }, (_, index) => (
            <div
              key={`bottom-${index}`}
              style={{
                width: FRAME_W,
                height: 2,
                background: PAPER,
                opacity: index / (FADE / 2),
              }}
            />
          ))}
        </div>
      </div>
    ),
    { ...size }
  );
}
