import { ImageResponse } from "next/og";
import { riceProfiles } from "@/data/rice/catalog";
import { decodeDiagnosisCode } from "@/lib/diagnosis/code";
import { runDiagnosis } from "@/lib/diagnosis/engine";
import { isDiagnosisEnabled } from "@/lib/diagnosis/enabled";
import { loadOgFonts } from "@/lib/og/fonts";
import { OG_COPY, SLOT_DEFS } from "@/lib/diagnosis/questions";

export const alt = "KomeSomme 侍米師の米診断 今日の相棒米";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * Result OG image: rendered on request from the same decode + engine as
 * the page itself, so the card can never disagree with the page. No static
 * params — the code space is ~10k and prerendering all of it is exactly
 * the build blow-up the share cards taught us to avoid (#87). Crawlers
 * fetch these rarely; the long cache headers let the CDN absorb repeats.
 */

const PAPER = "#F6EBDD";
const SURFACE = "#FFFDF7";
const INK = "#302820";
const INK_SOFT = "#5C4A3A";
const MUTED = "#766658";
const BROWN = "#704522";
const ACCENT = "#E56B3F";
const HAIRLINE = "rgba(112,69,34,0.25)";

const SERIF = '"Noto Serif JP", serif';
const SANS = '"Noto Sans JP", sans-serif';

export default async function Image({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;
  const brandIds = new Set(riceProfiles.map((rice) => rice.id));
  const answers = isDiagnosisEnabled()
    ? decodeDiagnosisCode(code, brandIds)
    : null;
  if (!answers) return new Response("Not found", { status: 404 });

  const outcome = runDiagnosis(answers, riceProfiles);
  const fonts = await loadOgFonts();
  const footer = answers.baseIsDefault
    ? OG_COPY.footerAvg
    : OG_COPY.footerNamed.replace("{base}", outcome.base.name);

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: PAPER,
          padding: "52px 64px",
          fontFamily: SANS,
          color: INK,
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div
            style={{
              fontSize: 24,
              letterSpacing: "0.18em",
              color: BROWN,
              fontFamily: SANS,
            }}
          >
            {OG_COPY.eyebrow}
          </div>
          <div
            style={{
              display: "flex",
              border: `3px solid ${ACCENT}`,
              borderRadius: 10,
              padding: "6px 16px",
              fontSize: 24,
              fontFamily: SERIF,
              fontWeight: 700,
              color: ACCENT,
              transform: "rotate(-2deg)",
            }}
          >
            {outcome.preferenceTag}
          </div>
        </div>

        <div
          style={{
            marginTop: 18,
            fontSize: 76,
            fontFamily: SERIF,
            fontWeight: 700,
            letterSpacing: "0.02em",
          }}
        >
          {OG_COPY.title}
        </div>

        <div
          style={{
            marginTop: 30,
            display: "flex",
            flexDirection: "column",
            backgroundColor: SURFACE,
            border: `1px solid ${HAIRLINE}`,
            borderRadius: 18,
            padding: "10px 34px",
          }}
        >
          {outcome.picks.map((pick, index) => (
            <div
              key={pick.slot}
              style={{
                display: "flex",
                alignItems: "baseline",
                padding: "17px 0",
                borderTop: index === 0 ? "none" : `1px solid ${HAIRLINE}`,
              }}
            >
              <div
                style={{
                  width: 92,
                  fontSize: 27,
                  fontFamily: SERIF,
                  fontWeight: 700,
                  color: BROWN,
                }}
              >
                {SLOT_DEFS[pick.slot].title}
              </div>
              <div
                style={{
                  fontSize: 40,
                  fontFamily: SERIF,
                  fontWeight: 700,
                  color: INK,
                }}
              >
                {pick.rice.name}
              </div>
              <div style={{ marginLeft: 20, fontSize: 25, color: MUTED }}>
                {pick.rice.prefecture}
              </div>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: "auto",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "baseline",
          }}
        >
          <div style={{ fontSize: 25, color: INK_SOFT }}>{footer}</div>
          <div style={{ fontSize: 25, color: MUTED }}>{OG_COPY.host}</div>
        </div>
      </div>
    ),
    {
      ...size,
      fonts,
      headers: {
        "Cache-Control":
          "public, max-age=86400, s-maxage=604800, stale-while-revalidate=2592000",
      },
    },
  );
}
