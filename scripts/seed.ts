/**
 * Seed rice_brands with Gemini text-embedding-004 (768-dim) + Supabase service_role.
 *
 * Usage: npx tsx scripts/seed.ts
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

const EMBEDDING_MODEL = "text-embedding-004";
const EMBEDDING_DIMENSIONS = 768;
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
      return values;
    } catch (error) {
      lastError = error;
      if (attempt < MAX_RETRIES) {
        const waitMs = BASE_RETRY_MS * 2 ** (attempt - 1);
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

async function main(): Promise<void> {
  console.log("🌾 KomeSomme seed (Gemini text-embedding-004 / 768-dim)\n");

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const geminiApiKey = requireEnv("GEMINI_API_KEY");

  const seedPath = path.resolve(
    path.dirname(fileURLToPath(import.meta.url)),
    "../src/lib/data/seed-rice.json"
  );
  const brands = JSON.parse(await readFile(seedPath, "utf8")) as SeedRiceBrand[];

  if (!Array.isArray(brands) || brands.length === 0) {
    throw new Error(`No brands found in ${seedPath}`);
  }

  const ai = new GoogleGenAI({ apiKey: geminiApiKey });
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  let ok = 0;
  let fail = 0;

  for (let i = 0; i < brands.length; i++) {
    const brand = brands[i];
    const progress = `[${i + 1}/${brands.length}]`;

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
      console.log(`${progress} ✓ Inserted "${brand.name}"\n`);
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
