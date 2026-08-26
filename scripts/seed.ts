/**
 * Seed script: embed rice brands via OpenAI and insert into Supabase.
 *
 * Usage:
 *   npx tsx scripts/seed.ts
 *
 * Required env (`.env` or `.env.local`):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   OPENAI_API_KEY
 */

import { config as loadEnv } from "dotenv";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

// ---------------------------------------------------------------------------
// Env
// ---------------------------------------------------------------------------

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv(); // fallback: `.env`

const EMBEDDING_MODEL = "text-embedding-3-small";
const EMBEDDING_DIMENSIONS = 1536;
const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";
const MAX_RETRIES = 5;
const BASE_RETRY_MS = 1_000;

interface SeedRiceBrand {
  name: string;
  prefecture: string;
  sweetness: number;
  hardness: number;
  stickiness: number;
  best_match_dishes: string[];
  description: string;
  rakuten_search_keyword?: string;
}

interface OpenAIEmbeddingResponse {
  data?: Array<{ embedding?: number[]; index?: number }>;
  error?: { message?: string; type?: string; code?: string };
}

class SeedError extends Error {
  constructor(
    message: string,
    readonly cause?: unknown
  ) {
    super(message);
    this.name = "SeedError";
  }
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new SeedError(
      `Missing required environment variable: ${name}. ` +
        `Set it in .env or .env.local before running the seed script.`
    );
  }
  return value;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableStatus(status: number): boolean {
  return status === 408 || status === 429 || status >= 500;
}

function validateSeedBrand(item: unknown, index: number): SeedRiceBrand {
  if (!item || typeof item !== "object") {
    throw new SeedError(`Invalid seed item at index ${index}: expected object`);
  }

  const brand = item as Record<string, unknown>;
  const requiredStrings = ["name", "prefecture", "description"] as const;
  for (const key of requiredStrings) {
    if (typeof brand[key] !== "string" || !(brand[key] as string).trim()) {
      throw new SeedError(
        `Invalid seed item at index ${index}: "${key}" must be a non-empty string`
      );
    }
  }

  const requiredNumbers = ["sweetness", "hardness", "stickiness"] as const;
  for (const key of requiredNumbers) {
    const value = brand[key];
    if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 5) {
      throw new SeedError(
        `Invalid seed item at index ${index}: "${key}" must be an integer between 1 and 5`
      );
    }
  }

  if (
    !Array.isArray(brand.best_match_dishes) ||
    brand.best_match_dishes.length === 0 ||
    !brand.best_match_dishes.every((d) => typeof d === "string" && d.trim())
  ) {
    throw new SeedError(
      `Invalid seed item at index ${index}: "best_match_dishes" must be a non-empty string array`
    );
  }

  return brand as unknown as SeedRiceBrand;
}

function buildEmbeddingInput(brand: SeedRiceBrand): string {
  // Embedding corpus: description + best-match dishes (as specified for RAG).
  const dishes = brand.best_match_dishes.join("、");
  return `${brand.description}\n相性の良い料理: ${dishes}`;
}

async function createEmbedding(
  apiKey: string,
  input: string,
  brandName: string
): Promise<number[]> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(OPENAI_EMBEDDINGS_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: EMBEDDING_MODEL,
          input,
          dimensions: EMBEDDING_DIMENSIONS,
        }),
      });

      const payload = (await response.json().catch(() => null)) as
        | OpenAIEmbeddingResponse
        | null;

      if (!response.ok) {
        const apiMessage =
          payload?.error?.message ?? response.statusText ?? "Unknown API error";

        if (isRetryableStatus(response.status) && attempt < MAX_RETRIES) {
          const retryAfterHeader = response.headers.get("retry-after");
          const retryAfterMs = retryAfterHeader
            ? Number(retryAfterHeader) * 1_000
            : BASE_RETRY_MS * 2 ** (attempt - 1);
          const waitMs = Number.isFinite(retryAfterMs)
            ? Math.max(retryAfterMs, BASE_RETRY_MS)
            : BASE_RETRY_MS * 2 ** (attempt - 1);

          console.warn(
            `  ⚠ OpenAI ${response.status} for "${brandName}" ` +
              `(attempt ${attempt}/${MAX_RETRIES}). Retrying in ${waitMs}ms…`
          );
          await sleep(waitMs);
          continue;
        }

        throw new SeedError(
          `OpenAI embeddings failed for "${brandName}" ` +
            `(HTTP ${response.status}): ${apiMessage}`
        );
      }

      const embedding = payload?.data?.[0]?.embedding;
      if (!Array.isArray(embedding) || embedding.length === 0) {
        throw new SeedError(
          `OpenAI returned an empty embedding for "${brandName}"`
        );
      }

      if (embedding.length !== EMBEDDING_DIMENSIONS) {
        throw new SeedError(
          `Unexpected embedding size for "${brandName}": ` +
            `expected ${EMBEDDING_DIMENSIONS}, got ${embedding.length}`
        );
      }

      if (!embedding.every((n) => typeof n === "number" && Number.isFinite(n))) {
        throw new SeedError(
          `OpenAI returned a non-numeric embedding for "${brandName}"`
        );
      }

      return embedding;
    } catch (error) {
      lastError = error;
      if (error instanceof SeedError) {
        throw error;
      }

      if (attempt < MAX_RETRIES) {
        const waitMs = BASE_RETRY_MS * 2 ** (attempt - 1);
        console.warn(
          `  ⚠ Network/error embedding "${brandName}" ` +
            `(attempt ${attempt}/${MAX_RETRIES}): ${String(error)}. ` +
            `Retrying in ${waitMs}ms…`
        );
        await sleep(waitMs);
        continue;
      }
    }
  }

  throw new SeedError(
    `Failed to create embedding for "${brandName}" after ${MAX_RETRIES} attempts`,
    lastError
  );
}

function createAdminClient(url: string, serviceRoleKey: string): SupabaseClient {
  return createClient(url, serviceRoleKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}

async function insertRiceBrand(
  client: SupabaseClient,
  brand: SeedRiceBrand,
  embedding: number[]
): Promise<void> {
  const row = {
    name: brand.name,
    prefecture: brand.prefecture,
    sweetness: brand.sweetness,
    hardness: brand.hardness,
    stickiness: brand.stickiness,
    best_match_dishes: brand.best_match_dishes,
    description: brand.description,
    embedding,
  };

  const { error } = await client.from("rice_brands").insert(row);

  if (error) {
    throw new SeedError(
      `Supabase insert failed for "${brand.name}": [${error.code ?? "unknown"}] ${error.message}` +
        (error.details ? ` — ${error.details}` : "") +
        (error.hint ? ` (hint: ${error.hint})` : "")
    );
  }
}

async function loadSeedData(seedPath: string): Promise<SeedRiceBrand[]> {
  let raw: string;
  try {
    raw = await readFile(seedPath, "utf8");
  } catch (error) {
    throw new SeedError(`Unable to read seed file at ${seedPath}`, error);
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch (error) {
    throw new SeedError(`Seed file is not valid JSON: ${seedPath}`, error);
  }

  if (!Array.isArray(parsed)) {
    throw new SeedError("Seed JSON must be an array of rice brand objects");
  }

  if (parsed.length === 0) {
    throw new SeedError("Seed JSON array is empty — nothing to insert");
  }

  return parsed.map((item, index) => validateSeedBrand(item, index));
}

async function main(): Promise<void> {
  console.log("🌾 KomeSomme seed — starting…\n");

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const openaiApiKey = requireEnv("OPENAI_API_KEY");

  if (serviceRoleKey === process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new SeedError(
      "SUPABASE_SERVICE_ROLE_KEY looks identical to the anon key. " +
        "Use the service_role key so inserts can bypass RLS."
    );
  }

  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const seedPath = path.resolve(scriptDir, "../src/lib/data/seed-rice.json");
  const brands = await loadSeedData(seedPath);

  console.log(`Loaded ${brands.length} brands from ${seedPath}`);
  console.log(`Model: ${EMBEDDING_MODEL} (${EMBEDDING_DIMENSIONS}-dim)\n`);

  const supabase = createAdminClient(supabaseUrl, serviceRoleKey);

  const succeeded: string[] = [];
  const failed: Array<{ name: string; error: string }> = [];

  for (let i = 0; i < brands.length; i++) {
    const brand = brands[i];
    const progress = `[${i + 1}/${brands.length}]`;

    try {
      console.log(`${progress} Embedding "${brand.name}"…`);
      const embeddingInput = buildEmbeddingInput(brand);
      const embedding = await createEmbedding(
        openaiApiKey,
        embeddingInput,
        brand.name
      );

      console.log(`${progress} Inserting "${brand.name}" into rice_brands…`);
      await insertRiceBrand(supabase, brand, embedding);

      succeeded.push(brand.name);
      console.log(`${progress} ✓ ${brand.name}\n`);
    } catch (error) {
      const message =
        error instanceof Error ? error.message : `Unknown error: ${String(error)}`;
      failed.push({ name: brand.name, error: message });
      console.error(`${progress} ✗ ${brand.name}: ${message}\n`);
    }
  }

  console.log("─".repeat(56));
  console.log(`Done. Success: ${succeeded.length}  Failed: ${failed.length}`);

  if (failed.length > 0) {
    console.error("\nFailed brands:");
    for (const item of failed) {
      console.error(`  - ${item.name}: ${item.error}`);
    }
    process.exitCode = 1;
    return;
  }

  console.log("\nAll rice brands seeded successfully.");
}

main().catch((error) => {
  const message =
    error instanceof Error ? error.message : `Unexpected failure: ${String(error)}`;
  console.error(`\nFatal: ${message}`);
  if (error instanceof SeedError && error.cause) {
    console.error("Cause:", error.cause);
  }
  process.exit(1);
});
