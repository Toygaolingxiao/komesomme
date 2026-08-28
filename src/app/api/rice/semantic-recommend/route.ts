import { NextResponse } from "next/server";
import { createEmbedding, getEmbeddingModel, resolveProvider } from "@/lib/embedding";
import { expandConsultationQuery } from "@/lib/rice/consultExpand";
import { mapRowToRiceProfile, RICE_PROFILE_COLUMNS } from "@/lib/rice/mapRiceRow";
import { buildSemanticReason } from "@/lib/rice/flavorBridge";
import { nameMatch, semanticDisplayScore, brandCoreQuery } from "@/lib/rice/semanticScore";
import { generateSommelierReply } from "@/lib/rice/sommelierReply";
import { guardSemanticRecommend } from "@/lib/security/semanticGuard";
import { createAdminClient } from "@/lib/supabase/admin";
import type { RiceProfileV2 } from "@/types/rice";

export const runtime = "nodejs";

const DEFAULT_MATCH_COUNT = 4;
const MAX_MATCH_COUNT = 10;
const MAX_QUERY_LENGTH = 500;
/** Cosine similarity floor. Low enough that an unusual phrasing still returns something. */
const MATCH_THRESHOLD = 0.1;

/**
 * Semantic recommendation ("米ソムリエに相談").
 *
 * Only free-text consultation reaches this route; the map and sliders rank locally.
 * The embedding stays server-side so the provider key is never exposed.
 * Public Vercel URLs are rate-limited and can be disabled via env kill switch.
 */
export async function POST(request: Request) {
  const blocked = guardSemanticRecommend(request);
  if (blocked) return blocked;

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

  const searchText = expandConsultationQuery(query);

  let embedding: number[];
  try {
    embedding = await createEmbedding(searchText, provider);
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
    const matches = rows.map((row) => toMatch(query, mapRowToRiceProfile(row), row.similarity));

    const named = await findExactNameMatch(
      supabase,
      query,
      matches.some((match) => nameMatch(query, match.rice.name) === "exact")
    );
    if (named) {
      matches.unshift(toMatch(query, named, 1));
    }

    matches.sort((a, b) => {
      if (a.score !== b.score) return b.score - a.score;
      return a.rice.name.localeCompare(b.rice.name, "ja");
    });

    const seen = new Set<string>();
    const unique = matches.filter((match) => {
      if (seen.has(match.rice.id)) return false;
      seen.add(match.rice.id);
      return true;
    });

    const ranked = unique.slice(0, matchCount);
    let reply = "";
    try {
      reply = await generateSommelierReply(
        query,
        ranked.map((match) => ({
          name: match.rice.name,
          prefecture: match.rice.prefecture,
          reason: match.reason,
        }))
      );
    } catch (cause) {
      console.error("Sommelier reply generation failed:", cause);
      const top = ranked[0]?.rice;
      reply = top
        ? `${top.prefecture}の${top.name}です。${ranked[0].reason}`
        : "ご相談の内容に近い銘柄を探しています。言葉を少し変えて、もう一度聞いてみてください。";
    }

    return NextResponse.json({
      query,
      reply,
      embeddingModel,
      matches: ranked,
    });
  } catch (cause) {
    console.error("Failed to match rice profiles:", cause);
    return NextResponse.json({ message: "銘柄の照合に失敗しました。" }, { status: 502 });
  }
}

function toMatch(query: string, rice: RiceProfileV2, similarityRaw: unknown) {
  const similarity = typeof similarityRaw === "number" ? similarityRaw : 0;
  const match = nameMatch(query, rice.name);

  return {
    rice,
    similarity,
    score: semanticDisplayScore(similarity, match),
    reason: buildSemanticReason(query, rice),
  };
}

async function findExactNameMatch(
  supabase: ReturnType<typeof createAdminClient>,
  query: string,
  alreadyExact: boolean
) {
  if (alreadyExact) return null;

  const names = [query, brandCoreQuery(query)].filter(
    (name, index, all) => name.length >= 3 && name.length <= 20 && all.indexOf(name) === index
  );

  for (const name of names) {
    const { data, error } = await supabase
      .from("rice_catalog")
      .select(RICE_PROFILE_COLUMNS)
      .eq("name", name)
      .maybeSingle();

    if (!error && data) return mapRowToRiceProfile(data as unknown as Record<string, unknown>);
  }

  return null;
}
