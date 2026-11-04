import { renderShareCard } from "@/lib/brand/shareCardRoute";

export const runtime = "nodejs";

/** QR variant of the share card; same on-demand + CDN-cache model. */
type RouteProps = {
  params: Promise<{ id: string }>;
};

export async function GET(_request: Request, { params }: RouteProps) {
  const { id } = await params;
  return renderShareCard(id, true);
}
