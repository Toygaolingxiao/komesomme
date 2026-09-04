/**
 * Gemini chat model chains for server routes.
 * Free-tier RPD is per model — chains define priority and fallback order.
 */

/** Batch encyclopedia generation: Lite first to preserve daily quota. */
export const DEFAULT_ENCYCLOPEDIA_CHAT_MODEL_CHAIN = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
] as const;

/** Live consultation reply: Lite first so the guest is not waiting on Flash retries. */
export const DEFAULT_SOMMELIER_CHAT_MODEL_CHAIN = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
] as const;

/** New API keys get 404 on these; keep out of the chain even if env still names them. */
export const RETIRED_GEMINI_MODELS = new Set([
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
  "gemini-3.6-flash",
]);

export function geminiErrorMessage(cause: unknown): string {
  return cause instanceof Error ? cause.message : String(cause);
}

export function isDailyQuotaError(message: string): boolean {
  return (
    message.includes("GenerateRequestsPerDay") ||
    message.includes("generate_content_free_tier_requests")
  );
}

export function isRetryableQuotaError(message: string): boolean {
  return message.includes("429") || message.includes("RESOURCE_EXHAUSTED");
}

export function isModelUnavailableError(message: string): boolean {
  return message.includes("404") || message.includes("NOT_FOUND");
}

/**
 * @param overrideEnv - e.g. `SOMMELIER_GEMINI_MODEL` for consultation reply
 */
export function resolveGeminiChatModelChain(
  overrideEnv = "SOMMELIER_GEMINI_MODEL",
  defaults: readonly string[] = DEFAULT_SOMMELIER_CHAT_MODEL_CHAIN,
): string[] {
  const override = process.env[overrideEnv]?.trim();
  const chain = override
    ? [override, ...defaults.filter((model) => model !== override)]
    : [...defaults];
  const usable = chain.filter((model) => !RETIRED_GEMINI_MODELS.has(model));
  if (usable.length === 0) return [...defaults];
  if (override && RETIRED_GEMINI_MODELS.has(override)) {
    console.warn(
      `${overrideEnv}=${override} is retired for new keys; using ${usable.join(" → ")}`,
    );
  }
  return usable;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/** Reject if `promise` has not settled. Does not cancel the underlying work. */
export async function withTimeout<T>(
  promise: Promise<T>,
  ms: number,
  label: string
): Promise<T> {
  let timer: ReturnType<typeof setTimeout> | undefined;
  try {
    return await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        timer = setTimeout(() => {
          reject(new Error(`${label} timed out after ${ms}ms`));
        }, ms);
      }),
    ]);
  } finally {
    if (timer !== undefined) clearTimeout(timer);
  }
}
