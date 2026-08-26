type BrandPageProps = {
  params: Promise<{ brand: string }>;
};

/**
 * Brand detail SSR page (SEO). Implementation lands in a later phase.
 */
export default async function BrandPage({ params }: BrandPageProps) {
  const { brand } = await params;

  return (
    <main className="min-h-screen w-full px-6 py-10">
      <h1 className="text-2xl font-medium tracking-tight">{decodeURIComponent(brand)}</h1>
    </main>
  );
}
