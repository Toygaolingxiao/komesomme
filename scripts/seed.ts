/**
 * Seed rice_brands with Gemini embeddings + Supabase service_role (bypasses RLS).
 *
 * Usage: npm run seed
 *
 * Required (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   GEMINI_API_KEY
 */

import { GoogleGenAI } from "@google/genai";
import { config as loadEnv } from "dotenv";
import { createClient } from "@supabase/supabase-js";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv();

const EMBEDDING_MODEL = "gemini-embedding-001";
/** Must match the `vector(N)` column on rice_brands.embedding. */
const EMBEDDING_DIMENSIONS = 1536;
const MAX_RETRIES = 5;
const BASE_RETRY_MS = 1_000;
const MAX_RETRY_MS = 30_000;
/** Spacing between brands so the embedding API is not hit concurrently. */
const REQUEST_INTERVAL_MS = 1_000;

interface SeedRiceBrand {
  name: string;
  prefecture: string;
  sweetness: number;
  hardness: number;
  stickiness: number;
  best_match_dishes: string[];
  description: string;
  rakuten_search_keyword: string;
}

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) {
    throw new Error(`Missing required env: ${name}`);
  }
  return value;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function buildEmbeddingInput(brand: SeedRiceBrand): string {
  return `${brand.description}\n相性の良い料理: ${brand.best_match_dishes.join("、")}`;
}

/**
 * gemini-embedding-001 only returns unit-length vectors at its native 3072 dims;
 * truncated MRL outputs must be re-normalized before cosine distance is used.
 */
function normalize(values: number[]): number[] {
  const norm = Math.sqrt(values.reduce((sum, v) => sum + v * v, 0));
  return norm > 0 ? values.map((v) => v / norm) : values;
}

async function createEmbedding(
  ai: GoogleGenAI,
  text: string,
  brandName: string
): Promise<number[]> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await ai.models.embedContent({
        model: EMBEDDING_MODEL,
        contents: text,
        config: { outputDimensionality: EMBEDDING_DIMENSIONS },
      });

      const values = response.embeddings?.[0]?.values;
      if (!Array.isArray(values) || values.length === 0) {
        throw new Error(`Empty embedding returned for "${brandName}"`);
      }
      if (values.length !== EMBEDDING_DIMENSIONS) {
        throw new Error(
          `Unexpected embedding size for "${brandName}": expected ${EMBEDDING_DIMENSIONS}, got ${values.length}`
        );
      }

      return normalize(values);
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES) {
        const backoffMs = Math.min(BASE_RETRY_MS * 2 ** (attempt - 1), MAX_RETRY_MS);
        // Jitter avoids retry bursts lining up again after a rate-limit hit.
        const waitMs = backoffMs + Math.floor(Math.random() * BASE_RETRY_MS);
        console.warn(
          `  ⚠ embed retry ${attempt}/${MAX_RETRIES} for "${brandName}": ${String(error)} (${waitMs}ms)`
        );
        await sleep(waitMs);
        continue;
      }
    }
  }

  throw new Error(
    `Failed to embed "${brandName}" after ${MAX_RETRIES} attempts: ${String(lastError)}`
  );
}

function validateBrand(item: unknown, index: number): SeedRiceBrand {
  const brand = item as Record<string, unknown>;
  const strings = ["name", "prefecture", "description", "rakuten_search_keyword"] as const;
  for (const key of strings) {
    if (typeof brand?.[key] !== "string" || !(brand[key] as string).trim()) {
      throw new Error(`seed-rice.json[${index}]: "${key}" must be a non-empty string`);
    }
  }

  for (const key of ["sweetness", "hardness", "stickiness"] as const) {
    const value = brand[key];
    if (typeof value !== "number" || !Number.isInteger(value) || value < 1 || value > 5) {
      throw new Error(`seed-rice.json[${index}]: "${key}" must be an integer 1-5`);
    }
  }

  if (
    !Array.isArray(brand.best_match_dishes) ||
    brand.best_match_dishes.length === 0 ||
    !brand.best_match_dishes.every((d) => typeof d === "string" && d.trim())
  ) {
    throw new Error(
      `seed-rice.json[${index}]: "best_match_dishes" must be a non-empty string array`
    );
  }

  return brand as unknown as SeedRiceBrand;
}

async function main(): Promise<void> {
  console.log(`🌾 KomeSomme seed (${EMBEDDING_MODEL} / ${EMBEDDING_DIMENSIONS}-dim)\n`);

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const geminiApiKey = requireEnv("GEMINI_API_KEY");

  const seedPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../src/lib/data/seed-rice.json"
  );
  const parsed = JSON.parse(await readFile(seedPath, "utf8")) as unknown;

  if (!Array.isArray(parsed) || parsed.length === 0) {
    throw new Error(`No brands found in ${seedPath}`);
  }

  const brands = parsed.map(validateBrand);

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < brands.length; i++) {
    const brand = brands[i];
    const progress = `[${i + 1}/${brands.length}]`;

    if (i > 0) {
      await sleep(REQUEST_INTERVAL_MS);
    }

    try {
      console.log(`${progress} Embedding "${brand.name}"…`);
      const embedding = await createEmbedding(
        ai,
        buildEmbeddingInput(brand),
        brand.name
      );

      const row = {
        name: brand.name,
        prefecture: brand.prefecture,
        sweetness: brand.sweetness,
        hardness: brand.hardness,
        stickiness: brand.stickiness,
        best_match_dishes: brand.best_match_dishes,
        description: brand.description,
        rakuten_search_keyword: brand.rakuten_search_keyword,
        embedding,
      };

      const { error } = await supabase.from("rice_brands").insert(row);
      if (error) {
        throw new Error(`[${error.code ?? "db"}] ${error.message}`);
      }

      ok += 1;
      console.log(`${progress} ✓ Inserted "${brand.name}" (${embedding.length}-dim)\n`);
    } catch (error) {
      fail += 1;
      console.error(
        `${progress} ✗ "${brand.name}": ${error instanceof Error ? error.message : String(error)}\n`
      );
    }
  }

  console.log(`Done. Success: ${ok}  Failed: ${fail}`);
  if (fail > 0) process.exitCode = 1;
}

main().catch((error) => {
  console.error("Fatal:", error instanceof Error ? error.message : error);
  process.exit(1);
});
