import { ImageResponse } from "next/og";
import { GOLD_POINT, GRAIN_PATH, ORBIT_PATH, PROBE } from "@/components/brand/markGeometry";

/**
 * Google Search requires favicon edge length to be a multiple of 48px.
 * 32px often falls back to the generic globe in SERP.
 */
export const size = { width: 48, height: 48 };
export const contentType = "image/png";

/** Light tab / SERP icon: cream field, charcoal grain line, gold point. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          background: "#FFF5E5",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <svg width="40" height="40" viewBox="0 0 64 64" fill="none">
          <path
            d={GRAIN_PATH}
            stroke="#302820"
            strokeWidth="3.4"
            strokeLinejoin="round"
          />
          <path
            d={ORBIT_PATH}
            stroke="#302820"
            strokeWidth="2.2"
            strokeLinecap="round"
          />
          <circle cx={GOLD_POINT.cx} cy={GOLD_POINT.cy} r={PROBE.goldR + 0.6} fill="#D49A2A" />
        </svg>
      </div>
    ),
    size
  );
}
