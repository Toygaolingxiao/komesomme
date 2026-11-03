import { riceProfiles } from "@/data/rice/catalog";
import { renderShareCard } from "@/lib/brand/shareCardRoute";

export const runtime = "nodejs";
export const dynamic = "force-static";

/**
 * Prerender every brand's card at build time. First generation used to run
 * per request (~20 s of font/image work, once per CDN edge node); now the
 * PNGs ship with the deployment and are served as static files.
 */
export function generateStaticParams() {
  return riceProfiles.map((rice) => ({ id: rice.id }));
}

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const { id } = await params;
  return renderShareCard(id, false);
}
