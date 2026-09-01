import { notFound, redirect } from "next/navigation";
import { OpsChrome } from "@/components/ops/OpsChrome";
import { YahooAffiliateSheet } from "@/components/ops/YahooAffiliateSheet";
import { loadYahooAffiliateSheet } from "@/lib/affiliate/yahooPromo";
import { opsDashboardConfigured } from "@/lib/ops/auth";
import { hasValidOpsSession } from "@/lib/ops/session";

export const dynamic = "force-dynamic";

export default async function OpsYahooPage() {
  if (!opsDashboardConfigured()) notFound();
  if (!(await hasValidOpsSession())) redirect("/ops/login");

  let rows = [] as Awaited<ReturnType<typeof loadYahooAffiliateSheet>>["rows"];
  let tableReady = false;
  try {
    const loaded = await loadYahooAffiliateSheet();
    rows = loaded.rows;
    tableReady = loaded.tableReady;
  } catch (cause) {
    console.error("ops yahoo sheet failed:", cause);
  }

  return (
    <main className="mx-auto w-full max-w-[1200px] px-4 py-8 sm:px-6 sm:py-10">
      <OpsChrome
        title="Yahoo推广链"
        subtitle="默认只看待办。填完或标「暂无」会从列表消失，短链留在库里。点「已填」可核对。对齐目录不会清空已填链接。"
      />
      <YahooAffiliateSheet initialRows={rows} tableReady={tableReady} />
    </main>
  );
}
