import { permanentRedirect, notFound } from "next/navigation";
import { findRiceProfile, riceProfiles } from "@/data/rice/catalog";

type BrandPageProps = {
  params: Promise<{ brand: string }>;
};

/** Legacy /{id} URLs permanently redirect to the unified library dossier. */
export function generateStaticParams() {
  return riceProfiles.map((rice) => ({ brand: rice.id }));
}

export default async function BrandRedirectPage({ params }: BrandPageProps) {
  const { brand } = await params;
  const rice = findRiceProfile(decodeURIComponent(brand));
  if (!rice) notFound();
  permanentRedirect(`/library/${rice.id}`);
}
