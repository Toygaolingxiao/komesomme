import type { Metadata } from "next";
import { notFound, redirect } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { SiteFooter } from "@/components/SiteFooter";
import { READING_COLUMN } from "@/components/siteChrome";
import { DiagnosisResult } from "@/components/diagnosis/DiagnosisResult";
import { riceProfiles } from "@/data/rice/catalog";
import { decodeDiagnosisCode } from "@/lib/diagnosis/code";
import { runDiagnosis } from "@/lib/diagnosis/engine";
import { isDiagnosisEnabled } from "@/lib/diagnosis/enabled";

/**
 * Result pages are a pure function of the code plus the static catalogue,
 * so they sit behind a long ISR window and the CDN absorbs repeat visits
 * (the same caching posture as the share cards). No generateStaticParams:
 * the code space is ~10k combinations and the engine is cheap arithmetic.
 */
export const revalidate = 86400;

const brandIds = new Set(riceProfiles.map((rice) => rice.id));

export async function generateMetadata({
  params,
}: {
  params: Promise<{ code: string }>;
}): Promise<Metadata> {
  const { code } = await params;
  const answers = decodeDiagnosisCode(code, brandIds);
  if (!answers) return { title: "侍米師の米診断｜KomeSomme" };
  const outcome = runDiagnosis(answers, riceProfiles);
  const honmei = outcome.picks[0].rice;
  return {
    title: `今日の相棒米は${honmei.name}｜侍米師の米診断`,
    description: `${outcome.base.name}をものさしに、108銘柄から選んだ三席。本命は${honmei.name}（${honmei.prefecture}）でした。`,
    alternates: { canonical: `/shindan/r/${code}` },
  };
}

export default async function DiagnosisResultPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  if (!isDiagnosisEnabled()) notFound();
  const { code } = await params;
  const answers = decodeDiagnosisCode(code, brandIds);
  if (!answers) redirect("/shindan?notice=invalid");
  const outcome = runDiagnosis(answers, riceProfiles);

  return (
    <main className="min-h-[100dvh] w-full min-w-0 text-[var(--km-ink)]">
      <SiteHeader />
      <div className={`${READING_COLUMN} px-5 pb-24 pt-10 sm:pt-14`}>
        <DiagnosisResult code={code} outcome={outcome} />
      </div>
      <SiteFooter />
    </main>
  );
}
