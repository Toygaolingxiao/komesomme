import { cookies } from "next/headers";
import { getOpsDashboardSecret, OPS_COOKIE, verifyOpsSessionToken } from "@/lib/ops/auth";

/** Node-only session check. Do not import from Client Components. */
export async function hasValidOpsSession(): Promise<boolean> {
  const secret = getOpsDashboardSecret();
  if (!secret) return false;
  const token = (await cookies()).get(OPS_COOKIE)?.value;
  return verifyOpsSessionToken(secret, token);
}
