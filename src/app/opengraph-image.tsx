import { ImageResponse } from "next/og";
import {
  CONTOUR_PATHS,
  GOLD_POINT,
  GRAIN_PATH,
  ORBIT_PATH,
  PROBE,
} from "@/components/brand/markGeometry";

export const alt = "KomeSomme | 米ソムリエ";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        lang="ja"
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#FFF5E5",
          padding: "64px 72px",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 28 }}>
          <svg width="112" height="112" viewBox="0 0 64 64" fill="none">
            <path
              d={GRAIN_PATH}
              stroke="#302820"
              strokeWidth="1.85"
              strokeLinejoin="round"
            />
            {CONTOUR_PATHS.map((d) => (
              <path
                key={d}
                d={d}
                stroke="#D49A2A"
                strokeWidth="0.85"
                strokeLinecap="round"
                opacity="0.75"
              />
            ))}
            <path
              d={ORBIT_PATH}
              stroke="#302820"
              strokeWidth="1.2"
              strokeLinecap="round"
            />
            <line
              x1={PROBE.x1}
              y1={PROBE.y1}
              x2={PROBE.x2}
              y2={PROBE.y2}
              stroke="#E56B3F"
              strokeWidth="1.45"
              strokeLinecap="round"
            />
            <circle cx={PROBE.x1} cy={PROBE.y1} r={PROBE.coralR} fill="#E56B3F" />
            <circle cx={GOLD_POINT.cx} cy={GOLD_POINT.cy} r={PROBE.goldR} fill="#D49A2A" />
          </svg>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div
              style={{
                fontSize: 64,
                fontWeight: 700,
                letterSpacing: "-0.04em",
                color: "#302820",
                lineHeight: 1.05,
              }}
            >
              KomeSomme
            </div>
            <div
              style={{
                marginTop: 8,
                fontSize: 28,
                color: "#704522",
                letterSpacing: "0.08em",
              }}
            >
              米ソムリエ
            </div>
          </div>
        </div>
        <div
          style={{
            fontSize: 28,
            color: "#5C4A3A",
            lineHeight: 1.45,
            maxWidth: 920,
          }}
        >
          味わいの地図から、今日の一膳へ。
        </div>
      </div>
    ),
    size
  );
}
