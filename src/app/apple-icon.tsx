import { ImageResponse } from "next/og";
import {
  CONTOUR_PATHS,
  GOLD_POINT,
  GRAIN_PATH,
  ORBIT_PATH,
  PROBE,
} from "@/components/brand/markGeometry";

export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
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
        <svg width="132" height="132" viewBox="0 0 64 64" fill="none">
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
      </div>
    ),
    size
  );
}
