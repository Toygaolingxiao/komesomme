import { notFound, redirect } from "next/navigation";
import { OpsLoginForm } from "@/components/ops/OpsLoginForm";
import { opsDashboardConfigured } from "@/lib/ops/auth";
import { hasValidOpsSession } from "@/lib/ops/session";

export const dynamic = "force-dynamic";

export default async function OpsLoginPage() {
  if (!opsDashboardConfigured()) notFound();
  if (await hasValidOpsSession()) redirect("/ops");

  return (
    <main className="mx-auto flex min-h-[100dvh] w-full max-w-lg items-center px-6 py-16">
      <OpsLoginForm />
    </main>
  );
}
