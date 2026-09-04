import { notFound, redirect } from "next/navigation";
import { OpsChrome } from "@/components/ops/OpsChrome";
import { YahooAffiliateSheet } from "@/components/ops/YahooAffiliateSheet";
import { loadYahooFurusatoAffiliateSheet } from "@/lib/affiliate/yahooPromo";
import { opsDashboardConfigured } from "@/lib/ops/auth";
import { hasValidOpsSession } from "@/lib/ops/session";

export const dynamic = "force-dynamic";

export default async function OpsYahooFurusatoPage() {
  if (!opsDashboardConfigured()) notFound();
  if (!(await hasValidOpsSession())) redirect("/ops/login");

  let rows = [] as Awaited<ReturnType<typeof loadYahooFurusatoAffiliateSheet>>["rows"];
  let tableReady = false;
  try {
    const loaded = await loadYahooFurusatoAffiliateSheet();
    rows = loaded.rows;
    tableReady = loaded.tableReady;
  } catch (cause) {
    console.error("ops yahoo furusato sheet failed:", cause);
  }

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 sm:py-10">
      <OpsChrome
        title="Yahoo故乡税"
        subtitle="本番の Yahoo 故乡税按钮是普通搜索（寄附没有联盟返点）。这张表不必填。默认只看待办。"
      />
      <YahooAffiliateSheet
        initialRows={rows}
        tableReady={tableReady}
        apiPath="/api/ops/yahoo-furusato-links"
        migrationFile="0012_yahoo_furusato_affiliate_links.sql"
        searchKind="furusato"
        noneLabel="暂无返礼"
      />
    </main>
  );
}
