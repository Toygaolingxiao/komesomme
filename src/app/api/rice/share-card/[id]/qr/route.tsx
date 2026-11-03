import { riceProfiles } from "@/data/rice/catalog";
import { renderShareCard } from "@/lib/brand/shareCardRoute";

export const runtime = "nodejs";
export const dynamic = "force-static";

/** QR variant of the share card, prerendered alongside the plain card. */
export function generateStaticParams() {
  return riceProfiles.map((rice) => ({ id: rice.id }));
}

type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const { id } = await params;
  return renderShareCard(id, true);
}
