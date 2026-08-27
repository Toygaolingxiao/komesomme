/**
 * Seeds the normalized catalogue (regions + brands + profile details) plus embeddings.
 *
 * Usage: npm run seed:rice
 *
 * After upserts, brands whose id is no longer in `riceProfiles` are deleted
 * (profile details cascade). This removes leftover overlay IDs such as
 * `shinnosuke-editorial`.
 *
 * Prerequisites:
 *   1. Run supabase/migrations/0003_normalize_rice_catalog.sql in the SQL Editor
 *      (0001 is only needed if you still have the wide rice_profiles table to migrate)
 *   2. npm run validate:rice
 *
 * Required (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 *   EMBEDDING_PROVIDER (optional, default gemini)
 *   GEMINI_API_KEY or OPENAI_API_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import path from "node:path";
import { riceProfiles } from "../src/data/riceProfilesV2";
import {
  createEmbeddingWithRetry,
  getEmbeddingModel,
  resolveProvider,
} from "../src/lib/embedding";
import { buildRiceSearchText } from "../src/lib/rice/buildRiceSearchText";
import { RICE_REGIONS, regionByName } from "../src/lib/rice/regions";
import type { RiceProfileV2 } from "../src/types/rice";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv();

/** Spacing between brands so the embedding API is not hit concurrently. */
const REQUEST_INTERVAL_MS = 1_000;

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

function brandRow(rice: RiceProfileV2) {
  return {
    id: rice.id,
    name: rice.name,
    prefecture: rice.prefecture,
    region_id: regionByName(rice.region).id,
    rakuten_search_keyword: rice.rakuten_search_keyword,
    amazon_search_keyword: rice.amazon_search_keyword ?? null,
    furusato_keywords: rice.furusato_keywords ?? [],
  };
}

function detailsRow(
  rice: RiceProfileV2,
  searchText: string,
  embedding: number[],
  embeddingModel: string
) {
  return {
    brand_id: rice.id,
    sweetness: rice.sweetness,
    hardness: rice.hardness,
    stickiness: rice.stickiness,
    aroma: rice.aroma,
    umami: rice.umami,
    aftertaste: rice.aftertaste,
    grain_size: rice.grain_size,
    clarity: rice.clarity,
    richness: rice.richness,
    cold_rice_quality: rice.cold_rice_quality,
    sauce_absorption: rice.sauce_absorption,
    oil_compatibility: rice.oil_compatibility,
    quadrant: rice.quadrant,
    texture_label: rice.texture_label,
    sweetness_label: rice.sweetness_label,
    best_match_dishes: rice.best_match_dishes,
    good_with: rice.good_with,
    avoid_pairings: rice.avoid_pairings,
    spring_pairings: rice.spring_pairings,
    summer_pairings: rice.summer_pairings,
    autumn_pairings: rice.autumn_pairings,
    winter_pairings: rice.winter_pairings,
    sake_pairings: rice.sake_pairings,
    beer_pairings: rice.beer_pairings,
    wine_pairings: rice.wine_pairings,
    whisky_pairings: rice.whisky_pairings,
    tea_pairings: rice.tea_pairings,
    mood_pairings: rice.mood_pairings,
    occasion_pairings: rice.occasion_pairings,
    lifestyle_scenes: rice.lifestyle_scenes,
    short_: rice.short_,
    description: rice.description,
    sommelier_note: rice.sommelier_note,
    pairing_reason: rice.pairing_reason,
    semantic_tags: rice.semantic_tags,
    search_queries: rice.search_queries,
    search_text: searchText,
    embedding,
    embedding_model: embeddingModel,
    data_source: rice.data_source,
    data_confidence: rice.data_confidence,
  };
}

async function main(): Promise<void> {
  const provider = resolveProvider();
  const embeddingModel = getEmbeddingModel(provider);

  console.log(
    `🌾 KomeSomme seed:rice — ${riceProfiles.length} brands via ${provider} (${embeddingModel})\n`
  );

  const supabaseUrl = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY");

  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const { error: regionError } = await supabase.from("rice_regions").upsert(
    RICE_REGIONS.map((region) => ({
      id: region.id,
      name: region.name,
      color: region.color,
      sort_order: region.sort_order,
    })),
    { onConflict: "id" }
  );

  if (regionError) {
    throw new Error(
      `rice_regions upsert failed ([${regionError.code ?? "db"}] ${regionError.message}). ` +
        "Run supabase/migrations/0003_normalize_rice_catalog.sql first."
    );
  }

  console.log(`✓ rice_regions (${RICE_REGIONS.length})\n`);

  let ok = 0;
  const failures: string[] = [];

  for (let i = 0; i < riceProfiles.length; i += 1) {
    const rice = riceProfiles[i];
    const progress = `[${i + 1}/${riceProfiles.length}]`;

    if (i > 0) {
      await sleep(REQUEST_INTERVAL_MS);
    }

    try {
      const { error: brandError } = await supabase
        .from("rice_brands")
        .upsert(brandRow(rice), { onConflict: "id" });

      if (brandError) {
        throw new Error(`[brand ${brandError.code ?? "db"}] ${brandError.message}`);
      }

      const searchText = buildRiceSearchText(rice);
      const embedding = await createEmbeddingWithRetry(
        searchText,
        rice.name,
        provider,
        (message) => console.warn(`  ⚠ ${message}`)
      );

      const { error: detailsError } = await supabase
        .from("rice_profile_details")
        .upsert(detailsRow(rice, searchText, embedding, embeddingModel), {
          onConflict: "brand_id",
        });

      if (detailsError) {
        throw new Error(`[details ${detailsError.code ?? "db"}] ${detailsError.message}`);
      }

      ok += 1;
      console.log(
        `${progress} ✓ ${rice.name} (${rice.prefecture} / ${regionByName(rice.region).id})`
      );
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      failures.push(`${rice.name}: ${message}`);
      console.error(`${progress} ✗ ${rice.name}: ${message}`);
    }
  }

  const keepIds = new Set(riceProfiles.map((rice) => rice.id));
  const { data: existingBrands, error: listError } = await supabase
    .from("rice_brands")
    .select("id");

  if (listError) {
    console.warn(`Could not list rice_brands for prune: ${listError.message}`);
  } else {
    const staleIds = (existingBrands ?? [])
      .map((row) => String(row.id))
      .filter((id) => !keepIds.has(id));

    if (staleIds.length > 0) {
      const { error: deleteError } = await supabase
        .from("rice_brands")
        .delete()
        .in("id", staleIds);

      if (deleteError) {
        console.warn(
          `Could not prune ${staleIds.length} stale brand(s): ${deleteError.message}`
        );
      } else {
        console.log(
          `\nPruned ${staleIds.length} stale brand(s): ${staleIds.join(", ")}`
        );
      }
    }
  }

  console.log(`\nDone. Success: ${ok}  Failed: ${failures.length}`);

  if (failures.length > 0) {
    console.error("\nFailures:");
    for (const failure of failures) {
      console.error(`  - ${failure}`);
    }
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error("Fatal:", error instanceof Error ? error.message : error);
  process.exit(1);
});
