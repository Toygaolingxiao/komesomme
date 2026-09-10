/**
 * Seed encyclopedia sources / articles / claims / revisions into Supabase.
 *
 * Usage: npm run seed:encyclopedia
 *
 * Prerequisites:
 *   1. Run supabase/migrations/0013_rice_encyclopedia.sql
 *   2. rice_brands already seeded (npm run seed:rice)
 *   3. Git encyclopedia JSON is source of truth
 *
 * Required (.env.local):
 *   NEXT_PUBLIC_SUPABASE_URL
 *   SUPABASE_SERVICE_ROLE_KEY
 */

import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";
import { readdirSync, readFileSync, existsSync } from "node:fs";
import path from "node:path";
import type {
  EncyclopediaClaim,
  EncyclopediaEditorialSource,
  RiceEncyclopediaArticle,
} from "../src/types/riceEncyclopedia";

loadEnv({ path: path.resolve(process.cwd(), ".env.local") });
loadEnv();

const ROOT = path.join(process.cwd(), "src/data/rice/encyclopedia");
const ARTICLES_DIR = path.join(ROOT, "articles");
const CLAIMS_DIR = path.join(ROOT, "claims");
const REGISTRY_PATH = path.join(ROOT, "sources/registry.json");

function requireEnv(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing required env: ${name}`);
  return value;
}

function loadJson<T>(file: string): T {
  return JSON.parse(readFileSync(file, "utf8")) as T;
}

async function main() {
  if (!existsSync(REGISTRY_PATH)) {
    throw new Error(`missing ${REGISTRY_PATH}`);
  }

  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL");
  const key = requireEnv("SUPABASE_SERVICE_ROLE_KEY");
  const supabase = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  const registry = loadJson<{ sources: EncyclopediaEditorialSource[] }>(REGISTRY_PATH);
  for (const source of registry.sources) {
    if (!source.url?.startsWith("http")) {
      throw new Error(`source ${source.id} missing url`);
    }
  }

  const sourceRows = registry.sources.map((s) => ({
    id: s.id,
    organization: s.organization,
    title: s.title,
    url: s.url,
    source_kind: s.source_kind,
    accessed_on: s.accessed_on,
    notes: s.notes ?? null,
    updated_at: new Date().toISOString(),
  }));

  {
    const { error } = await supabase
      .from("rice_editorial_sources")
      .upsert(sourceRows, { onConflict: "id" });
    if (error) throw new Error(`sources upsert: ${error.message}`);
    console.log(`sources upserted: ${sourceRows.length}`);
  }

  const articleFiles = readdirSync(ARTICLES_DIR).filter((f) => f.endsWith(".json"));
  let articleOk = 0;
  let revisionOk = 0;
  let claimOk = 0;

  for (const file of articleFiles) {
    const article = loadJson<RiceEncyclopediaArticle>(path.join(ARTICLES_DIR, file));
    const claimsPath = path.join(CLAIMS_DIR, `${article.id}.json`);
    if (!existsSync(claimsPath)) {
      throw new Error(`missing claims for ${article.id}`);
    }
    const claimsFile = loadJson<{
      source_ids: string[];
      claims: EncyclopediaClaim[];
    }>(claimsPath);

    const articleRow = {
      brand_id: article.id,
      name: article.name,
      reading: article.reading ?? "",
      headline: article.headline,
      origin: article.origin,
      features: article.features,
      cooking_tips: article.cookingTips,
      serving_ideas: article.servingIdeas,
      purchase_notes: article.purchaseNotes,
      caveats: article.caveats,
      confidence: article.confidence,
      fact_status: article.factStatus ?? "unverified",
      content_hash: article.contentHash ?? null,
      source_ids: article.sourceIds ?? claimsFile.source_ids ?? [],
      generated_at: article.generatedAt ?? null,
      generator_model: article.model ?? null,
      revised_at: article.revisedAt ?? null,
      revision_source: article.revisionSource ?? null,
      updated_at: new Date().toISOString(),
    };

    const { data: existing, error: existingError } = await supabase
      .from("rice_encyclopedia_articles")
      .select("content_hash, published_revision_id")
      .eq("brand_id", article.id)
      .maybeSingle();
    if (existingError) throw new Error(`select ${article.id}: ${existingError.message}`);

    const { error: upsertError } = await supabase
      .from("rice_encyclopedia_articles")
      .upsert(articleRow, { onConflict: "brand_id" });
    if (upsertError) throw new Error(`article upsert ${article.id}: ${upsertError.message}`);
    articleOk += 1;

    const hashChanged =
      !existing?.content_hash || existing.content_hash !== article.contentHash;
    if (hashChanged && article.contentHash) {
      const { data: lastRev } = await supabase
        .from("rice_encyclopedia_revisions")
        .select("revision_no")
        .eq("brand_id", article.id)
        .order("revision_no", { ascending: false })
        .limit(1)
        .maybeSingle();
      const nextNo = (lastRev?.revision_no ?? 0) + 1;
      const snapshot = {
        ...article,
        claims: claimsFile.claims,
      };
      const { data: rev, error: revError } = await supabase
        .from("rice_encyclopedia_revisions")
        .insert({
          brand_id: article.id,
          revision_no: nextNo,
          content_hash: article.contentHash,
          snapshot,
          created_by: "seed:encyclopedia",
        })
        .select("id")
        .single();
      if (revError) throw new Error(`revision ${article.id}: ${revError.message}`);
      const { error: linkError } = await supabase
        .from("rice_encyclopedia_articles")
        .update({ published_revision_id: rev.id })
        .eq("brand_id", article.id);
      if (linkError) throw new Error(`link revision ${article.id}: ${linkError.message}`);
      revisionOk += 1;
    }

    const claimRows = claimsFile.claims.map((c) => ({
      id: c.id,
      brand_id: article.id,
      field_path: c.field_path,
      claim_text: c.claim_text,
      status: c.status,
      source_ids: c.source_ids ?? [],
      notes: c.notes ?? null,
      verified_at: c.verified_at ?? null,
      updated_at: new Date().toISOString(),
    }));
    const { error: claimError } = await supabase
      .from("rice_encyclopedia_claims")
      .upsert(claimRows, { onConflict: "id" });
    if (claimError) throw new Error(`claims ${article.id}: ${claimError.message}`);
    claimOk += claimRows.length;
  }

  console.log(
    JSON.stringify(
      {
        sources: sourceRows.length,
        articles: articleOk,
        revisionsAppended: revisionOk,
        claims: claimOk,
      },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
