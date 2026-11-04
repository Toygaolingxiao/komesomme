import { renderShareCard } from "@/lib/brand/shareCardRoute";

export const runtime = "nodejs";

/**
 * Cards are generated on first request and then held by the CDN
 * (s-maxage in renderShareCard), so a brand costs one slow render per
 * edge node and is instant afterwards. Prerendering all 212 cards at
 * build time was tried in #87: at ~20 s per render it pushed the
 * Vercel build past its 45-minute limit, so generation moved back
 * to request time, now with the subset OG fonts from #87 kept.
 */
type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const { id } = await params;
  return renderShareCard(id, false);
}
