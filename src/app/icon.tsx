import { ImageResponse } from "next/og";
import { GOLD_POINT, GRAIN_PATH, ORBIT_PATH, PROBE } from "@/components/brand/markGeometry";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Light tab icon: cream field, charcoal grain line, gold point. Never a filled black disc. */
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
        <svg width="28" height="28" viewBox="0 0 64 64" fill="none">
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
