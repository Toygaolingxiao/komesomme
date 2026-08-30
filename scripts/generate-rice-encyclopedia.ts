/**
 * Generate structured encyclopedia articles for every rice profile via Gemini.
 *
 * Editorial rules: no banned superlatives; no scraped mall prices; grounded in
 * catalog fields. Resume-safe (skips existing unless --force).
 *
 *   npm run encyclopedia:generate
 *   npm run encyclopedia:generate -- --mode=template
 *   npm run encyclopedia:generate -- --mode=gemini --limit=5
 *   npm run encyclopedia:generate -- --id=ryu-no-hitomi --force
 *
 * Default mode `auto`: fill missing with catalog template, then try Gemini upgrade
 * for template-only rows when quota allows.
 */

import { mkdirSync, writeFileSync, existsSync, readFileSync } from "node:fs";
import path from "node:path";
import { config as loadEnv } from "dotenv";
import { GoogleGenAI } from "@google/genai";
import { findRiceProfile, riceProfiles } from "@/data/rice/catalog";
import type { RiceProfileV2 } from "@/types/rice";
import type {
  RiceEncyclopediaArticle,
  RiceEncyclopediaManifestEntry,
} from "@/types/riceEncyclopedia";

loadEnv({ path: ".env.local" });

/**
 * Encyclopedia batch prefers Flash-Lite: free-tier RPD is per model.
 * `gemini-3.6-flash` and `gemini-3.5-flash` are ~20/day; Lite has a separate, larger pool.
 * 2.5 / 2.0 Flash return 404 for new keys. Override with ENCYCLOPEDIA_GEMINI_MODEL.
 */
const DEFAULT_MODEL_CHAIN = [
  "gemini-3.5-flash-lite",
  "gemini-3.1-flash-lite",
  "gemini-3.5-flash",
] as const;

/** New API keys get 404 on these; keep out of the chain even if env still names them. */
const RETIRED_MODELS = new Set([
  "gemini-2.0-flash",
  "gemini-2.0-flash-lite",
  "gemini-2.5-flash",
  "gemini-2.5-flash-lite",
]);

function resolveModelChain(): string[] {
  const override = process.env.ENCYCLOPEDIA_GEMINI_MODEL?.trim();
  const chain = override
    ? [override, ...DEFAULT_MODEL_CHAIN.filter((model) => model !== override)]
    : [...DEFAULT_MODEL_CHAIN];
  const usable = chain.filter((model) => !RETIRED_MODELS.has(model));
  if (usable.length === 0) return [...DEFAULT_MODEL_CHAIN];
  if (override && RETIRED_MODELS.has(override)) {
    console.warn(
      `ENCYCLOPEDIA_GEMINI_MODEL=${override} is retired for new keys; using ${usable.join(" → ")}`,
    );
  }
  return usable;
}

const MODEL_CHAIN = resolveModelChain();
const exhaustedModels = new Set<string>();
const ARTICLES_DIR = path.join(process.cwd(), "src/data/rice/encyclopedia/articles");
const MANIFEST_PATH = path.join(process.cwd(), "src/data/rice/encyclopedia/manifest.json");

const BANNED = [
  "最強",
  "圧倒的",
  "究極",
  "唯一無二",
  "爆発",
  "神",
  "無敵",
  "他の追随を許さない",
  "奇跡のお米",
  "日本一",
  "世界一",
];

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function extractGeminiText(payload: unknown): string {
  if (!payload || typeof payload !== "object") return "";
  const record = payload as {
    text?: unknown;
    candidates?: Array<{
      content?: { parts?: Array<{ text?: string; thought?: boolean }> };
    }>;
  };
  const parts = record.candidates?.[0]?.content?.parts ?? [];
  const spoken = parts
    .filter((part) => !part.thought)
    .map((part) => part.text ?? "")
    .join("")
    .trim();
  if (spoken) return spoken;
  if (typeof record.text === "string" && record.text.trim()) return record.text.trim();
  return "";
}

function stripCodeFence(text: string): string {
  const trimmed = text.trim();
  const fenced = trimmed.match(/^```(?:json)?\s*([\s\S]*?)```$/i);
  return fenced?.[1]?.trim() ?? trimmed;
}

function scrubBanned(text: string): string {
  let next = text;
  for (const word of BANNED) {
    next = next.split(word).join("特長ある");
  }
  return next;
}

function buildPrompt(rice: RiceProfileV2): string {
  const profile = {
    id: rice.id,
    name: rice.name,
    prefecture: rice.prefecture,
    region: rice.region,
    scores: {
      sweetness: rice.sweetness,
      hardness: rice.hardness,
      stickiness: rice.stickiness,
      aroma: rice.aroma,
      umami: rice.umami,
      grain_size: rice.grain_size,
      cold_rice_quality: rice.cold_rice_quality,
      sauce_absorption: rice.sauce_absorption,
    },
    short_: rice.short_,
    description: rice.description,
    sommelier_note: rice.sommelier_note,
    best_match_dishes: rice.best_match_dishes.slice(0, 6),
    good_with: rice.good_with.slice(0, 6),
    avoid_pairings: rice.avoid_pairings.slice(0, 4),
    lifestyle_scenes: rice.lifestyle_scenes.slice(0, 4),
    curation_notes: rice.curation_notes ?? "",
  };

  return `あなたは日本のブランド米の編集者です。KomeSomme の銘柄事典用に、日本語の構造化記事を JSON だけで出力してください。

## 入力プロフィール（正本。数値は編集評価 1〜5 であり公的測定ではない）
${JSON.stringify(profile, null, 2)}

## 出力 JSON スキーマ（これ以外のキーを足さない）
{
  "reading": "ひらがなの読み（不明なら空文字）",
  "headline": "1文の導入（60〜110字）",
  "origin": "由来・産地・品種の背景（120〜280字）。不確かな受賞歴は断定しない",
  "features": [{"title":"短い見出し","body":"2〜4文"}],
  "cookingTips": [{"title":"短い見出し","body":"2〜3文"}],
  "servingIdeas": ["短い提案", "..."],
  "purchaseNotes": "購入の傾向（取扱の広さ・価格帯は定性のみ）。具体的な円金額は書かない",
  "caveats": "編集上の注意・不確実性（1〜2文）",
  "confidence": "high|medium|low"
}

## 厳守
- JSON オブジェクトのみ。前後に説明文や markdown を付けない
- features は 3〜5 件、cookingTips は 2〜4 件、servingIdeas は 3〜6 件
- 禁止語を使わない: ${BANNED.join("、")}
- 「日本一」「金賞」などは、プロフィールに明示がない限り書かない。一般的な評判は「とされる」「と言われる」で留める
- 味わいスコアを公的測定のように書かない（KomeSomme 編集評価である旨を必要なら caveats に）
- 炊飯のコツは grain_size / stickiness / cold_rice_quality などから論理的に導く
- モール在庫やアフィリエイト価格のスクレイピング結果をでっち上げない`;
}

function parseArticle(
  rice: RiceProfileV2,
  raw: string,
  generatedAt: string,
  model: string,
): RiceEncyclopediaArticle {
  const json = JSON.parse(stripCodeFence(raw)) as Record<string, unknown>;

  const features = Array.isArray(json.features)
    ? json.features
        .map((row) => {
          const r = row as Record<string, unknown>;
          return {
            title: scrubBanned(String(r.title ?? "").trim()),
            body: scrubBanned(String(r.body ?? "").trim()),
          };
        })
        .filter((row) => row.title && row.body)
        .slice(0, 6)
    : [];

  const cookingTips = Array.isArray(json.cookingTips)
    ? json.cookingTips
        .map((row) => {
          const r = row as Record<string, unknown>;
          return {
            title: scrubBanned(String(r.title ?? "").trim()),
            body: scrubBanned(String(r.body ?? "").trim()),
          };
        })
        .filter((row) => row.title && row.body)
        .slice(0, 5)
    : [];

  const servingIdeas = Array.isArray(json.servingIdeas)
    ? json.servingIdeas
        .map((item) => scrubBanned(String(item).trim()))
        .filter(Boolean)
        .slice(0, 8)
    : [];

  const confidenceRaw = String(json.confidence ?? "medium");
  const confidence =
    confidenceRaw === "high" || confidenceRaw === "low" ? confidenceRaw : "medium";

  if (features.length < 2 || !String(json.headline ?? "").trim()) {
    throw new Error(`Incomplete article for ${rice.id}`);
  }

  return {
    id: rice.id,
    name: rice.name,
    reading: scrubBanned(String(json.reading ?? "").trim()),
    headline: scrubBanned(String(json.headline ?? "").trim()),
    origin: scrubBanned(String(json.origin ?? "").trim()),
    features,
    cookingTips,
    servingIdeas,
    purchaseNotes: scrubBanned(String(json.purchaseNotes ?? "").trim()),
    caveats: scrubBanned(
      String(json.caveats ?? "").trim() ||
        "本稿は公開情報と KomeSomme 編集評価をもとにした案内であり、公的な食味測定ではありません。",
    ),
    confidence,
    generatedAt,
    model,
  };
}

function buildTemplateArticle(rice: RiceProfileV2, generatedAt: string): RiceEncyclopediaArticle {
  const grain =
    rice.grain_size >= 4
      ? "大粒寄りで、炊き上がりの存在感が出やすい"
      : rice.grain_size <= 2
        ? "粒は控えめ〜中粒で、口当たりがすっきりしやすい"
        : "中粒〜やや大粒で、バランスのよい見た目になりやすい";
  const stick =
    rice.stickiness >= 4
      ? "粘りがしっかりあり、もっちり感を楽しめる"
      : rice.stickiness <= 2
        ? "粘りは控えめで、粒立ちを感じやすい"
        : "ほどよい粘りで、幅広い料理に合わせやすい";
  const sweet =
    rice.sweetness >= 4
      ? "甘みがふくらみやすく、白ごはんだけでも満足感が出やすい"
      : rice.sweetness <= 2
        ? "甘みはすっきりめで、濃い味付けのおかずを引き立てやすい"
        : "穏やかな甘みで、日常の食卓に馴染みやすい";
  const cold =
    rice.cold_rice_quality >= 4
      ? "冷めても食感が落ちにくく、弁当やおにぎり向き"
      : "温かいごはんとしての魅力が中心。冷めて食べるなら軽く温め直すとよい";
  const waterTip =
    rice.stickiness >= 4 || rice.grain_size >= 4
      ? "標準より水をほんの少し控えめにすると、粒の輪郭が残りやすい"
      : "炊飯器の標準水加減を基準に、好みで調整する";
  const dishes = rice.best_match_dishes.filter(Boolean).slice(0, 4);
  const scenes = rice.lifestyle_scenes.filter(Boolean).slice(0, 3);

  return {
    id: rice.id,
    name: rice.name,
    reading: "",
    headline: scrubBanned(
      `${rice.prefecture}の「${rice.name}」は、${sweet}。${stick}銘柄として、${
        dishes[0] ? `${dishes[0]}など` : "幅広い料理"
      }に合わせやすい一膳です。`,
    ),
    origin: scrubBanned(
      `「${rice.name}」は${rice.prefecture}（${rice.region}）にゆかりのブランド米として知られます。${
        rice.description?.trim() || rice.sommelier_note?.trim() || rice.short_ || ""
      } 本稿の味わい記述は KomeSomme の編集評価（1〜5）を踏まえた案内であり、公的な食味測定ではありません。`,
    ),
    features: [
      {
        title: "粒感と見た目",
        body: `${grain}。硬度の編集評価は ${rice.hardness}/5 で、${
          rice.hardness >= 4 ? "しっかり噛みごたえを求める人向き" : rice.hardness <= 2 ? "やわらかめの口当たりを好む人向き" : "どちらにも振りすぎない中庸"
        }です。`,
      },
      {
        title: "甘みと粘り",
        body: `${sweet}。また${stick}（粘り評価 ${rice.stickiness}/5、甘み評価 ${rice.sweetness}/5）。`,
      },
      {
        title: "冷めたときの向き不向き",
        body: `${cold}（冷ご飯適性の編集評価 ${rice.cold_rice_quality}/5）。`,
      },
      ...(rice.sauce_absorption >= 4
        ? [
            {
              title: "タレ・丼ものとの相性",
              body: `ソースの絡みやすさの編集評価が高く（${rice.sauce_absorption}/5）、丼ものや濃い味付けのおかずと合わせやすい傾向があります。`,
            },
          ]
        : []),
    ],
    cookingTips: [
      {
        title: "水加減",
        body: `${waterTip}。新米時期は特に吸水が早いことがあるので、仕上がりを見て次回調整すると安定します。`,
      },
      {
        title: "研ぎ方と浸水",
        body: `力強く研ぎすぎず、濁りが落ち着く程度に手早く。浸水は銘柄と季節で最適が変わるため、まずはメーカーや産地の案内を優先し、なければ短めの浸水から試すと安全です。`,
      },
      {
        title: "蒸らし",
        body: `炊き上がり後に短く蒸らしてからほぐすと、粒の表面が整いやすいです。ほぐすときはつぶさないよう、切るように混ぜます。`,
      },
    ],
    servingIdeas: [
      ...dishes.map((d) => `${d}と合わせる`),
      ...scenes.map((s) => `${s}の食卓に`),
      "白ごはんとして味わう",
    ].filter(Boolean).slice(0, 6),
    purchaseNotes: scrubBanned(
      `${rice.prefecture}産の流通がある銘柄です。スーパー・米穀店・ふるさと納税・各オンラインショップで見つかることがありますが、季節や年産で在庫は変動します。価格は銘柄の位置づけや精米・数量で幅があるため、具体額は記載しません。下の取扱店リンクから各モールの最新結果を確認してください。`,
    ),
    caveats:
      "本稿は catalog の編集評価と公開情報をもとにしたテンプレート記事です。受賞歴や特定価格は断定していません。Gemini で再生成すると表現がより豊かになる場合があります。",
    confidence: "medium",
    generatedAt,
    model: "catalog-template",
  };
}

function isDailyQuotaError(message: string): boolean {
  return (
    message.includes("GenerateRequestsPerDay") ||
    message.includes("generate_content_free_tier_requests")
  );
}

function isRetryableQuotaError(message: string): boolean {
  return message.includes("429") || message.includes("RESOURCE_EXHAUSTED");
}

async function generateWithGemini(prompt: string): Promise<{ text: string; model: string }> {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) throw new Error("GEMINI_API_KEY is not configured.");

  const ai = new GoogleGenAI({ apiKey });
  let lastError: unknown;

  for (const model of MODEL_CHAIN) {
    if (exhaustedModels.has(model)) continue;
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const response = await ai.models.generateContent({
          model,
          contents: prompt,
          config: { temperature: 0.55, maxOutputTokens: 8192 },
        });
        const text = extractGeminiText(response);
        if (!text) {
          console.warn(`Empty response (${model}), trying next…`);
          break;
        }
        return { text, model };
      } catch (cause) {
        lastError = cause;
        const message = cause instanceof Error ? cause.message : String(cause);
        const is404 = message.includes("404") || message.includes("NOT_FOUND");
        if (is404) {
          console.warn(`Model unavailable (${model}), trying next…`);
          break;
        }
        if (isDailyQuotaError(message)) {
          exhaustedModels.add(model);
          console.warn(`Daily quota exhausted (${model}), trying next model…`);
          break;
        }
        if (isRetryableQuotaError(message) && attempt < 3) {
          const retryMatch = message.match(/retry in ([\d.]+)s/i);
          const waitMs = retryMatch
            ? Math.min(Math.ceil(Number(retryMatch[1]) * 1000) + 1500, 45_000)
            : attempt * 8_000;
          console.warn(`Rate limited (${model}). Waiting ${Math.round(waitMs / 1000)}s…`);
          await sleep(waitMs);
          continue;
        }
        if (isRetryableQuotaError(message)) {
          exhaustedModels.add(model);
          console.warn(`Quota still exhausted (${model}), trying next model…`);
          break;
        }
        throw cause;
      }
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Gemini retries exhausted");
}

function writeManifest() {
  const entries: RiceEncyclopediaManifestEntry[] = [];
  for (const rice of riceProfiles) {
    const file = path.join(ARTICLES_DIR, `${rice.id}.json`);
    if (!existsSync(file)) continue;
    const article = JSON.parse(readFileSync(file, "utf8")) as RiceEncyclopediaArticle;
    entries.push({
      id: rice.id,
      name: rice.name,
      reading: article.reading,
      prefecture: rice.prefecture,
      region: rice.region,
      headline: article.headline,
      confidence: article.confidence,
      sweetness: rice.sweetness,
      hardness: rice.hardness,
      stickiness: rice.stickiness,
    });
  }
  entries.sort((a, b) => a.name.localeCompare(b.name, "ja"));
  writeFileSync(
    MANIFEST_PATH,
    JSON.stringify(
      {
        generatedAt: new Date().toISOString(),
        count: entries.length,
        entries,
      },
      null,
      2,
    ),
    "utf8",
  );
  console.error(`Manifest: ${entries.length} articles → ${MANIFEST_PATH}`);
}

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const modeArg = args.find((arg) => arg.startsWith("--mode="))?.slice(7);
  const mode = modeArg === "template" || modeArg === "gemini" ? modeArg : "auto";
  const idFlag = args.find((arg) => arg.startsWith("--id="))?.slice(5);
  const limitFlag = args.find((arg) => arg.startsWith("--limit="))?.slice(8);
  const limit = limitFlag ? Number(limitFlag) : undefined;

  let targets = idFlag
    ? [findRiceProfile(idFlag)].filter((rice): rice is RiceProfileV2 => Boolean(rice))
    : [...riceProfiles];

  if (typeof limit === "number" && Number.isFinite(limit) && limit > 0) {
    targets = targets.slice(0, limit);
  }

  if (targets.length === 0) {
    console.error("No matching rice profiles.");
    process.exit(1);
  }

  mkdirSync(ARTICLES_DIR, { recursive: true });

  let written = 0;
  let skipped = 0;
  let failed = 0;
  let templated = 0;
  let geminiWritten = 0;

  for (const [index, rice] of targets.entries()) {
    const out = path.join(ARTICLES_DIR, `${rice.id}.json`);
    const existing = existsSync(out)
      ? (JSON.parse(readFileSync(out, "utf8")) as RiceEncyclopediaArticle)
      : null;

    const isGeminiDone = existing?.model && existing.model !== "catalog-template";
    if (!force && isGeminiDone) {
      skipped += 1;
      process.stderr.write(`[${index + 1}/${targets.length}] skip ${rice.id} (gemini)\n`);
      continue;
    }

    const generatedAt = new Date().toISOString();
    const wantGemini = mode === "gemini" || mode === "auto";
    const needTemplateFirst =
      mode === "template" || (mode === "auto" && (!existing || force));

    if (needTemplateFirst && (force || !existing)) {
      process.stderr.write(`[${index + 1}/${targets.length}] template ${rice.id}\n`);
      const article = buildTemplateArticle(rice, generatedAt);
      writeFileSync(out, JSON.stringify(article, null, 2), "utf8");
      written += 1;
      templated += 1;
    }

    if (wantGemini) {
      const current = existsSync(out)
        ? (JSON.parse(readFileSync(out, "utf8")) as RiceEncyclopediaArticle)
        : null;
      if (!force && current?.model && current.model !== "catalog-template") {
        skipped += 1;
        continue;
      }
      process.stderr.write(`[${index + 1}/${targets.length}] gemini ${rice.id}…\n`);
      try {
        const { text: raw, model } = await generateWithGemini(buildPrompt(rice));
        const article = parseArticle(rice, raw, new Date().toISOString(), model);
        writeFileSync(out, JSON.stringify(article, null, 2), "utf8");
        written += 1;
        geminiWritten += 1;
        if (index < targets.length - 1) await sleep(1500);
      } catch (cause) {
        failed += 1;
        console.error(`FAIL gemini ${rice.id}:`, cause instanceof Error ? cause.message : cause);
        if (!existsSync(out)) {
          const fallback = buildTemplateArticle(rice, generatedAt);
          writeFileSync(out, JSON.stringify(fallback, null, 2), "utf8");
          templated += 1;
          written += 1;
        }
        // Stop burning quota on repeated 429s in auto mode.
        const msg = cause instanceof Error ? cause.message : String(cause);
        if (mode === "auto" && (msg.includes("429") || msg.includes("RESOURCE_EXHAUSTED"))) {
          console.error("Stopping Gemini upgrades due to quota; templates remain.");
          for (const rest of targets.slice(index + 1)) {
            const restOut = path.join(ARTICLES_DIR, `${rest.id}.json`);
            if (existsSync(restOut)) continue;
            writeFileSync(
              restOut,
              JSON.stringify(buildTemplateArticle(rest, new Date().toISOString()), null, 2),
              "utf8",
            );
            templated += 1;
            written += 1;
          }
          break;
        }
      }
      continue;
    }
  }

  writeManifest();
  console.log(
    JSON.stringify(
      { mode, written, skipped, failed, templated, geminiWritten, models: MODEL_CHAIN },
      null,
      2,
    ),
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
