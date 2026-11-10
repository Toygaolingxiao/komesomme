/**
 * Diagnosis kill switch, mirroring the share-card double-flag pattern
 * (src/lib/brand/shareCardEnabled.ts). On unless a flag explicitly turns
 * it off:
 * - `NEXT_PUBLIC_DIAGNOSIS_ENABLED=0` (hides the entries and the pages)
 * - `DIAGNOSIS_ENABLED=0` (server-side gate, when the public flag is unset)
 */
export function isDiagnosisEnabled(): boolean {
  const publicFlag =
    process.env.NEXT_PUBLIC_DIAGNOSIS_ENABLED?.trim().toLowerCase();
  const serverFlag = process.env.DIAGNOSIS_ENABLED?.trim().toLowerCase();
  const raw = publicFlag || serverFlag || "";
  if (!raw) return true;
  return raw === "1" || raw === "true" || raw === "yes";
}
