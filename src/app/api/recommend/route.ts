import { GoogleGenAI } from "@google/genai";
import { NextResponse } from "next/server";
import { createServerClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

const EMBEDDING_MODEL = "gemini-embedding-001";
/** Must match the `vector(N)` column on rice_brands.embedding. */
const EMBEDDING_DIMENSIONS = 1536;
const DEFAULT_MATCH_COUNT = 4;
const MATCH_THRESHOLD = 0;

/** Truncated MRL outputs are not unit length, so re-normalize before cosine distance. */
function normalize(values: number[]): number[] {
  const norm = Math.sqrt(values.reduce((sum, v) => sum + v * v, 0));
  return norm > 0 ? values.map((v) => v / norm) : values;
}

export async function POST(request: Request) {
  let query: string;
  let matchCount = DEFAULT_MATCH_COUNT;

  try {
    const body = (await request.json()) as { query?: unknown; matchCount?: unknown };
    if (typeof body.query !== "string" || !body.query.trim()) {
      return NextResponse.json(
        { message: "query は必須の文字列です。" },
        { status: 400 }
      );
    }
    query = body.query.trim().slice(0, 500);
    if (typeof body.matchCount === "number" && Number.isInteger(body.matchCount)) {
      matchCount = Math.min(10, Math.max(1, body.matchCount));
    }
  } catch {
    return NextResponse.json({ message: "リクエスト本文を解析できません。" }, { status: 400 });
  }

  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json(
      { message: "GEMINI_API_KEY が設定されていません。" },
      { status: 500 }
    );
  }

  let embedding: number[];
  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.embedContent({
      model: EMBEDDING_MODEL,
      contents: query,
      config: { outputDimensionality: EMBEDDING_DIMENSIONS },
    });

    const values = response.embeddings?.[0]?.values;
    if (!Array.isArray(values) || values.length !== EMBEDDING_DIMENSIONS) {
      throw new Error(
        `embedding size mismatch: expected ${EMBEDDING_DIMENSIONS}, got ${values?.length ?? 0}`
      );
    }
    embedding = normalize(values);
  } catch (cause) {
    console.error("Failed to embed recommend query:", cause);
    return NextResponse.json(
      { message: "検索ベクトルの生成に失敗しました。" },
      { status: 502 }
    );
  }

  try {
    const supabase = createServerClient();
    const { data, error } = await supabase.rpc("match_rice_brands", {
      query_embedding: embedding,
      match_count: matchCount,
      match_threshold: MATCH_THRESHOLD,
    });

    if (error) throw new Error(error.message);
    return NextResponse.json({ matches: data ?? [] });
  } catch (cause) {
    console.error("Failed to match rice brands:", cause);
    return NextResponse.json(
      { message: "銘柄の照合に失敗しました。" },
      { status: 502 }
    );
  }
}
