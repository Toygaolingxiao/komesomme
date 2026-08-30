import type { Metadata } from "next";
import Link from "next/link";
import { BrandLockup } from "@/components/brand/BrandMark";
import { BrandTastingArticle } from "@/components/brand/BrandTastingArticle";
import { SiteFooter } from "@/components/SiteFooter";
import { DetailScrollTracker } from "@/components/matrix/DetailScrollTracker";
import { FOCUS } from "@/components/matrix/shared";
import { notFound } from "next/navigation";
import { findRiceProfile, riceProfiles } from "@/data/rice/catalog";
import { calculateTasteNeighbours } from "@/lib/rice/matrix";

type BrandPageProps = {
  params: Promise<{ brand: string }>;
};

export function generateStaticParams() {
  return riceProfiles.map((rice) => ({ brand: rice.id }));
}

export async function generateMetadata({
  params,
}: BrandPageProps): Promise<Metadata> {
  const { brand } = await params;
  const rice = findRiceProfile(brand);
  if (!rice) {
    return { title: "銘柄が見つかりません" };
  }

  const description = brandMetaDescription(rice.short_ || rice.description);
  const title = `${rice.prefecture} ${rice.name}`;

  return {
    title: rice.name,
    description,
    openGraph: {
      title,
      description,
      locale: "ja_JP",
      type: "article",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

function brandMetaDescription(text: string, max = 120): string {
  const compact = text.replace(/\s+/g, " ").trim();
  if (compact.length <= max) return compact;
  return `${compact.slice(0, max - 1)}…`;
}

export default async function BrandPage({ params }: BrandPageProps) {
  const { brand } = await params;
  const rice = findRiceProfile(decodeURIComponent(brand));
  if (!rice) notFound();

  const neighbours = calculateTasteNeighbours(riceProfiles, rice, 3);

  return (
    <main className="min-h-[100dvh] w-full min-w-0 overflow-x-clip bg-[var(--km-bg)] text-[var(--km-ink)]">
      <DetailScrollTracker />
      <header className="mx-auto flex h-16 max-w-[920px] min-w-0 items-center justify-between gap-3 border-b border-[var(--km-border)] px-4 md:px-8 lg:h-[72px]">
        <Link href="/" className={`min-w-0 shrink ${FOCUS}`}>
          <BrandLockup />
        </Link>
        <div className="flex shrink-0 items-center gap-4 text-sm">
          <Link
            href={`/library/${rice.id}`}
            className={`whitespace-nowrap text-[var(--km-muted)] transition hover:text-[var(--km-gold)] ${FOCUS}`}
          >
            ライブラリ
          </Link>
          <Link
            href="/#matrix"
            className={`whitespace-nowrap text-[var(--km-muted)] transition hover:text-[var(--km-gold)] ${FOCUS}`}
          >
            地図へ
          </Link>
        </div>
      </header>

      <BrandTastingArticle rice={rice} neighbours={neighbours} />
      <SiteFooter />
    </main>
  );
}
