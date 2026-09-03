import type { Metadata } from "next";
import { CollectionsChrome } from "@/components/editorial/CollectionsChrome";
import { CollectionsIndex } from "@/components/editorial/CollectionsIndex";
import { SiteFooter } from "@/components/SiteFooter";
import { encyclopediaManifest } from "@/data/rice/encyclopedia/load";
import { collectionsForIndex } from "@/lib/editorial/collections";

export const metadata: Metadata = {
  title: "特集",
  description: "旬や使い方で組んだ、銘柄の特集。",
  openGraph: { description: "旬や使い方で組んだ、銘柄の特集。" },
  twitter: { description: "旬や使い方で組んだ、銘柄の特集。" },
};

export default function CollectionsPage() {
  const entries = encyclopediaManifest();
  const knownIds = new Set(entries.map((entry) => entry.id));
  const collections = collectionsForIndex(knownIds);

  return (
    <main className="min-h-[100dvh] w-full min-w-0 text-[var(--km-ink)]">
      <CollectionsChrome />
      <CollectionsIndex collections={collections} />
      <SiteFooter />
    </main>
  );
}
