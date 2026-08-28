/**
 * Fail-fast checks for public hosting.
 *
 * Production (Vercel) requires real keys. JWT role on the public anon key is
 * always checked when the value looks like a JWT — including local/Preview —
 * so a service_role pasted into NEXT_PUBLIC_* never ships to the browser.
 */

const PLACEHOLDER_HOST = "example.supabase.co";

export function assertRuntimeEnv(): void {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
  const service = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim() ?? "";
  const production = process.env.VERCEL_ENV === "production";

  if (production) {
    const missing = [
      !url && "NEXT_PUBLIC_SUPABASE_URL",
      !anon && "NEXT_PUBLIC_SUPABASE_ANON_KEY",
      !service && "SUPABASE_SERVICE_ROLE_KEY",
    ].filter(Boolean);
    if (missing.length > 0) {
      throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }
    if (url.includes(PLACEHOLDER_HOST)) {
      throw new Error("NEXT_PUBLIC_SUPABASE_URL is still a CI/placeholder host.");
    }
    if (looksLikeServiceRoleJwt(anon)) {
      throw new Error(
        "NEXT_PUBLIC_SUPABASE_ANON_KEY is a service_role JWT. Use the anon key; service_role must stay server-only."
      );
    }
    assertEmbeddingCredentials();
  } else if (anon && looksLikeServiceRoleJwt(anon)) {
    throw new Error(
      "NEXT_PUBLIC_SUPABASE_ANON_KEY is a service_role JWT. Use the anon key; service_role must stay server-only."
    );
  }
}

function assertEmbeddingCredentials(): void {
  const disabled = ["0", "false", "off", "no"].includes(
    (process.env.SEMANTIC_RECOMMEND_ENABLED ?? "true").trim().toLowerCase()
  );
  if (disabled) return;

  const provider = (process.env.EMBEDDING_PROVIDER ?? "").trim().toLowerCase();
  const gemini = Boolean(process.env.GEMINI_API_KEY?.trim());
  const openai = Boolean(process.env.OPENAI_API_KEY?.trim());

  if (provider === "gemini" && !gemini) {
    throw new Error("EMBEDDING_PROVIDER=gemini but GEMINI_API_KEY is missing.");
  }
  if (provider === "openai" && !openai) {
    throw new Error("EMBEDDING_PROVIDER=openai but OPENAI_API_KEY is missing.");
  }
  if (!provider && !gemini && !openai) {
    throw new Error("Set GEMINI_API_KEY or OPENAI_API_KEY (or SEMANTIC_RECOMMEND_ENABLED=false).");
  }
}

function looksLikeServiceRoleJwt(token: string): boolean {
  const parts = token.split(".");
  if (parts.length !== 3) return false;
  try {
    const payload = JSON.parse(Buffer.from(parts[1], "base64url").toString("utf8")) as {
      role?: unknown;
    };
    return payload.role === "service_role";
  } catch {
    return false;
  }
}
