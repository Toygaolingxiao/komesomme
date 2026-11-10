import { readFile } from "node:fs/promises";
import path from "node:path";
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
 *
 * Layout follows the result page's language: a band of the shindan hero
 * painting on top, then the picks on paper — honmei large, 対抗/穴 as a
 * pair below. The hero is inlined from a JPEG derivative (Satori cannot
 * be trusted with the WebP original); if the file is ever missing the
 * card simply renders without the band.
 */

const PAPER = "#F6EBDD";
const SURFACE = "#FFFDF7";
const INK = "#302820";
const INK_SOFT = "#5C4A3A";
const MUTED = "#766658";
const BROWN = "#704522";
const GOLD = "#D49A2A";
const ACCENT = "#E56B3F";
const HAIRLINE = "rgba(112,69,34,0.25)";

const SERIF = '"Noto Serif JP", serif';
const SANS = '"Noto Sans JP", sans-serif';

async function heroDataUrl(): Promise<string | null> {
  try {
    const buf = await readFile(
      path.join(process.cwd(), "public", "brand-art", "shindan-hero-og.jpg"),
    );
    return `data:image/jpeg;base64,${buf.toString("base64")}`;
  } catch {
    return null;
  }
}

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
  const hero = await heroDataUrl();
  const footer = answers.baseIsDefault
    ? OG_COPY.footerAvg
    : OG_COPY.footerNamed.replace("{base}", outcome.base.name);
  const [honmei, taikou, ana] = outcome.picks;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          backgroundColor: PAPER,
          fontFamily: SANS,
          color: INK,
        }}
      >
        {hero ? (
          <div
            style={{
              display: "flex",
              width: 1200,
              height: 196,
              overflow: "hidden",
              flexShrink: 0,
            }}
          >
            <img
              src={hero}
              width={1200}
              height={196}
              alt=""
              style={{
                display: "flex",
                width: 1200,
                height: 196,
                objectFit: "cover",
                objectPosition: "50% 72%",
              }}
            />
          </div>
        ) : null}

        <div
          style={{
            display: "flex",
            flexDirection: "column",
            flex: 1,
            padding: hero ? "30px 64px 40px" : "52px 64px 44px",
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
              marginTop: 26,
              display: "flex",
              alignItems: "center",
            }}
          >
            <div
              style={{
                display: "flex",
                backgroundColor: GOLD,
                borderRadius: 9,
                padding: "8px 18px",
                fontSize: 26,
                fontFamily: SERIF,
                fontWeight: 700,
                letterSpacing: "0.14em",
                color: "#FFFFFF",
                transform: "rotate(-2deg)",
                flexShrink: 0,
              }}
            >
              {SLOT_DEFS.honmei.title}
            </div>
            <div
              style={{
                marginLeft: 26,
                fontSize: 68,
                fontFamily: SERIF,
                fontWeight: 700,
                letterSpacing: "0.02em",
                lineHeight: 1.15,
              }}
            >
              {honmei.rice.name}
            </div>
            <div
              style={{
                marginLeft: 20,
                fontSize: 26,
                color: MUTED,
                flexShrink: 0,
              }}
            >
              {honmei.rice.prefecture}
            </div>
          </div>

          <div
            style={{
              marginTop: 24,
              display: "flex",
              gap: 28,
            }}
          >
            {[taikou, ana].map((pick) => (
              <div
                key={pick.slot}
                style={{
                  display: "flex",
                  flex: 1,
                  alignItems: "baseline",
                  backgroundColor: SURFACE,
                  border: `1px solid ${HAIRLINE}`,
                  borderRadius: 14,
                  padding: "16px 24px",
                }}
              >
                <div
                  style={{
                    fontSize: 24,
                    fontFamily: SERIF,
                    fontWeight: 700,
                    color: BROWN,
                    flexShrink: 0,
                  }}
                >
                  {SLOT_DEFS[pick.slot].title}
                </div>
                <div
                  style={{
                    marginLeft: 16,
                    fontSize: 33,
                    fontFamily: SERIF,
                    fontWeight: 700,
                    color: INK,
                  }}
                >
                  {pick.rice.name}
                </div>
                <div
                  style={{
                    marginLeft: 12,
                    fontSize: 21,
                    color: MUTED,
                    flexShrink: 0,
                  }}
                >
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
