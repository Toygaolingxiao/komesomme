import type { JsonLdObject } from "@/lib/seo/jsonLd";

/**
 * `<` is escaped so a stray "</script>" inside catalog copy cannot break out of
 * the block. Build the payload with the helpers in `src/lib/seo/jsonLd.ts`.
 */
function serialize(data: JsonLdObject | JsonLdObject[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function JsonLd({ data }: { data: JsonLdObject | JsonLdObject[] }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serialize(data) }}
    />
  );
}
