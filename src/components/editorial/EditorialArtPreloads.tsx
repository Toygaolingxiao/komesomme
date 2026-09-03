/** Server-friendly `<link rel="preload">` for above-the-fold editorial art. */
export function EditorialArtPreloads({ hrefs }: { hrefs: string[] }) {
  const unique = [...new Set(hrefs.filter(Boolean))];
  if (unique.length === 0) return null;

  return (
    <>
      {unique.map((href) => (
        <link key={href} rel="preload" as="image" href={href} type="image/webp" />
      ))}
    </>
  );
}
