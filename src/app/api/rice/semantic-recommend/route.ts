import { NextResponse } from "next/server";
import { createEmbedding, getEmbeddingModel, resolveProvider } from "@/lib/embedding";
import { mapRowToRiceProfile } from "@/lib/rice/mapRiceRow";
import { buildSemanticReason } from "@/lib/rice/flavorBridge";
import { createAdminClient } from "@/lib/supabase/admin";

export const runtime = "nodejs";

const DEFAULT_MATCH_COUNT = 4;
const MAX_MATCH_COUNT = 10;
const MAX_QUERY_LENGTH = 500;
/** Cosine similarity floor. Low enough that an unusual phrasing still returns something. */
const MATCH_THRESHOLD = 0.1;

/**
 * Semantic recommendation ("侍米師に相談").
 *
 * Only free-text consultation reaches this route; the map and sliders rank locally.
 * The embedding stays server-side so the provider key is never exposed.
 */
export async function POST(request: Request) {
  let query: string;
  let matchCount = DEFAULT_MATCH_COUNT;

  try {
    const body = (await request.json()) as { query?: unknown; matchCount?: unknown };

    if (typeof body.query !== "string" || !body.query.trim()) {
      return NextResponse.json({ message: "query は必須の文字列です。" }, { status: 400 });
    }
    query = body.query.trim().slice(0, MAX_QUERY_LENGTH);

    if (typeof body.matchCount === "number" && Number.isInteger(body.matchCount)) {
      matchCount = Math.min(MAX_MATCH_COUNT, Math.max(1, body.matchCount));
    }
  } catch {
    return NextResponse.json(
      { message: "リクエスト本文を解析できません。" },
      { status: 400 }
    );
  }

  let provider: ReturnType<typeof resolveProvider>;
  let embeddingModel: string;
  try {
    provider = resolveProvider();
    embeddingModel = getEmbeddingModel(provider);
  } catch (cause) {
    console.error("Embedding provider is not configured:", cause);
    return NextResponse.json(
      { message: "埋め込みプロバイダーが設定されていません。" },
      { status: 500 }
    );
  }

  let embedding: number[];
  try {
    embedding = await createEmbedding(query, provider);
  } catch (cause) {
    console.error("Failed to embed consultation query:", cause);
    return NextResponse.json(
      { message: "検索ベクトルの生成に失敗しました。" },
      { status: 502 }
    );
  }

  try {
    const supabase = createAdminClient();
    // number[] does not satisfy supabase-js GenericFunction Args (Record<string, unknown>).
    const { data, error } = await supabase.rpc("match_rice_profiles", {
      query_embedding: embedding,
      p_embedding_model: embeddingModel,
      match_count: matchCount,
      match_threshold: MATCH_THRESHOLD,
    } as never);

    if (error) throw new Error(error.message);

    const rows = (data ?? []) as unknown as Array<Record<string, unknown>>;
    const matches = rows.map((row) => {
      const rice = mapRowToRiceProfile(row);
      const similarity = typeof row.similarity === "number" ? row.similarity : 0;

      return {
        rice,
        similarity,
        // Whole numbers only: a decimal implies more precision than the data supports.
        score: Math.round(Math.max(0, Math.min(1, similarity)) * 100),
        reason: buildSemanticReason(query, rice),
      };
    });

    return NextResponse.json({ query, embeddingModel, matches });
  } catch (cause) {
    console.error("Failed to match rice profiles:", cause);
    return NextResponse.json({ message: "銘柄の照合に失敗しました。" }, { status: 502 });
  }
}
