import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { SITE_COLUMN } from "@/components/siteChrome";
import { DiagnosisWizard } from "@/components/diagnosis/DiagnosisWizard";
import { freeCompareDataset } from "@/lib/editorial/freeCompare";
import { isDiagnosisEnabled } from "@/lib/diagnosis/enabled";
import { DIAGNOSIS_COPY } from "@/lib/diagnosis/questions";

export const metadata: Metadata = {
  title: "侍米師の米診断｜三つの質問で『今日の相棒米』",
  description:
    "ふだんの食卓と、いつもの米を聞くだけで、108銘柄から『今日の相棒米』を三つ、理由つきで出します。値段の話はしません。味の相性だけ見ます。",
  alternates: { canonical: "/shindan" },
};

export default async function ShindanPage({
  searchParams,
}: {
  searchParams: Promise<{ notice?: string }>;
}) {
  if (!isDiagnosisEnabled()) notFound();
  const { notice } = await searchParams;
  const dataset = freeCompareDataset();

  return (
    <main className="min-h-[100dvh] w-full min-w-0 text-[var(--km-ink)]">
      <SiteHeader active="shindan" />
      <div className={`${SITE_COLUMN} pb-24 pt-10 sm:pt-14`}>
        {notice === "invalid" ? (
          <p
            role="alert"
            className="mb-8 max-w-[40rem] rounded-xl border border-[var(--km-accent)]/40 bg-[var(--km-surface-warm)] px-4 py-3 text-[13px] leading-[1.8] text-[var(--km-brown)]"
          >
            {DIAGNOSIS_COPY.invalidNotice}
          </p>
        ) : null}
        <DiagnosisWizard brands={dataset.brands} />
      </div>
      <SiteFooter />
    </main>
  );
}
