# KomeSomme RiceProfile V2 开发实施方案

## 0. 项目目标

当前 KomeSomme 的大米数据和风味矩阵仍然偏薄，主要问题包括：

1. 大米品牌数量不足，矩阵点位稀疏；
2. 数据维度只有 sweetness / hardness / stickiness，难以支撑高级推荐；
3. AI 对话无法充分理解季节、料理、酒类、心情、生活场景；
4. 矩阵点位容易重叠；
5. Supabase 向量检索缺少专门优化过的 embedding text；
6. 前端矩阵交互不应频繁请求后端，应该本地即时响应。

本次开发目标：

- 将大米数据升级为 `RiceProfileV2`；
- 支持 80～100 款大米品牌；
- 支持料理、季节、酒类、心情、场景推荐；
- 构建适合 pgvector 的 `search_text`；
- 矩阵交互本地即时计算；
- 只有自然语言咨询时才触发 Supabase vector search；
- 使用确定性 Jitter 解决矩阵点位重叠；
- 为后续 Amazon / 楽天 / ふるさと納税 转化打基础。

---

## 1. 核心原则

### 1.1 风味数值是 KomeSomme 编辑评价

以下字段不是官方检测值，而是 KomeSomme 内部用于推荐和可视化的编辑型评分：

- sweetness
- hardness
- stickiness
- aroma
- umami
- aftertaste
- grain_size
- clarity
- richness
- cold_rice_quality
- sauce_absorption
- oil_compatibility

请在数据库中保留：

```ts
data_source: "editorial"
data_confidence: "medium"
不要在 UI 中宣称这些数值是官方科学测定值。

1.2 推荐逻辑分成两层
A. Matrix / Slider 推荐
触发来源：

用户拖动 slider；
用户点击矩阵；
用户拖拽 taste probe。
特点：

只使用本地数据；
不请求 LLM；
不请求 Supabase vector search；
即时响应；
使用 hardness / sweetness 做坐标匹配；
使用 stickiness / aroma / umami 等作为展示和解释辅助。
B. 侍米師语义推荐
触发来源：

用户在「侍米師に相談」输入自然语言；
点击提交按钮。
特点：

使用 Supabase pgvector；
根据 search_text embedding 检索；
返回语义相关的大米；
可进一步由 LLM 生成解释；
不改变当前 matrix probe 坐标，除非用户明确点击“根据推荐移动探针”。
2. TypeScript 数据模型
请新增或更新：



src/types/rice.ts
内容如下：



export type RiceRegion =
  | "北海道・東北"
  | "関東・甲信越"
  | "東海・北陸"
  | "近畿"
  | "中国・四国"
  | "九州・沖縄"
  | "全国銘柄";

export type DataSource = "editorial" | "official" | "producer" | "user";
export type DataConfidence = "high" | "medium" | "low";

export type RiceProfileV2 = {
  id: string;
  name: string;
  prefecture: string;
  region: RiceRegion;

  // Core taste values: 1-5
  sweetness: number;
  hardness: number;
  stickiness: number;
  aroma: number;
  umami: number;
  aftertaste: number;
  grain_size: number;
  clarity: number;
  richness: number;
  cold_rice_quality: number;
  sauce_absorption: number;
  oil_compatibility: number;

  // Matrix metadata
  quadrant: string;
  texture_label: string;
  sweetness_label: string;

  // Food pairing
  best_match_dishes: string[];
  good_with: string[];
  avoid_pairings: string[];

  // Seasonal pairing
  spring_pairings: string[];
  summer_pairings: string[];
  autumn_pairings: string[];
  winter_pairings: string[];

  // Drink pairing
  sake_pairings: string[];
  beer_pairings: string[];
  wine_pairings: string[];
  whisky_pairings: string[];
  tea_pairings: string[];

  // Mood and lifestyle
  mood_pairings: string[];
  occasion_pairings: string[];
  lifestyle_scenes: string[];

  // Editorial 
  short_: string;
  description: string;
  sommelier_note: string;
  pairing_reason: string;

  // Search and commerce
  semantic_tags: string[];
  search_queries: string[];
  search_text?: string;

  rakuten_search_keyword: string;
  amazon_search_keyword?: string;
  furusato_keywords?: string[];

  data_source: DataSource;
  data_confidence: DataConfidence;
};

export type RiceDisplayPoint = RiceProfileV2 & {
  display_x: number;
  display_y: number;
};

export type RiceMatchResult = {
  rice: RiceProfileV2;
  score: number;
  distance: number;
  reason: string;
};
3. Supabase 数据库设计
3.1 Migration SQL
请新增 migration：



supabase/migrations/xxxx_create_rice_profiles_v2.sql
内容如下。

如果当前项目已经安装 pgvector，保留即可。
如果没有，需要启用：



create extension if not exists vector;
建表：



create table if not exists rice_profiles (
  id text primary key,
  name text not null,
  prefecture text not null,
  region text not null,

  sweetness numeric not null check (sweetness between 1 and 5),
  hardness numeric not null check (hardness between 1 and 5),
  stickiness numeric not null check (stickiness between 1 and 5),

  aroma numeric check (aroma between 1 and 5),
  umami numeric check (umami between 1 and 5),
  aftertaste numeric check (aftertaste between 1 and 5),
  grain_size numeric check (grain_size between 1 and 5),
  clarity numeric check (clarity between 1 and 5),
  richness numeric check (richness between 1 and 5),
  cold_rice_quality numeric check (cold_rice_quality between 1 and 5),
  sauce_absorption numeric check (sauce_absorption between 1 and 5),
  oil_compatibility numeric check (oil_compatibility between 1 and 5),

  quadrant text,
  texture_label text,
  sweetness_label text,

  best_match_dishes jsonb default '[]'::jsonb,
  good_with jsonb default '[]'::jsonb,
  avoid_pairings jsonb default '[]'::jsonb,

  spring_pairings jsonb default '[]'::jsonb,
  summer_pairings jsonb default '[]'::jsonb,
  autumn_pairings jsonb default '[]'::jsonb,
  winter_pairings jsonb default '[]'::jsonb,

  sake_pairings jsonb default '[]'::jsonb,
  beer_pairings jsonb default '[]'::jsonb,
  wine_pairings jsonb default '[]'::jsonb,
  whisky_pairings jsonb default '[]'::jsonb,
  tea_pairings jsonb default '[]'::jsonb,

  mood_pairings jsonb default '[]'::jsonb,
  occasion_pairings jsonb default '[]'::jsonb,
  lifestyle_scenes jsonb default '[]'::jsonb,

  short_ text,
  description text,
  sommelier_note text,
  pairing_reason text,

  semantic_tags jsonb default '[]'::jsonb,
  search_queries jsonb default '[]'::jsonb,
  search_text text,

  rakuten_search_keyword text,
  amazon_search_keyword text,
  furusato_keywords jsonb default '[]'::jsonb,

  -- If using OpenAI text-embedding-3-small, use vector(1536)
  embedding vector(1536),

  data_source text default 'editorial',
  data_confidence text default 'medium',

  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists rice_profiles_region_idx
on rice_profiles(region);

create index if not exists rice_profiles_prefecture_idx
on rice_profiles(prefecture);

create index if not exists rice_profiles_taste_idx
on rice_profiles(sweetness, hardness, stickiness);

create index if not exists rice_profiles_embedding_idx
on rice_profiles
using ivfflat (embedding vector_cosine_ops)
with (lists = 100);
3.2 注意：Embedding 维度
如果使用：



OpenAI text-embedding-3-small
使用：



vector(1536)
如果使用：



OpenAI text-embedding-3-large
使用：



vector(3072)
不要把 1536 维和 3072 维混在同一个字段。

4. Supabase RPC：语义检索
新增 RPC：



create or replace function match_rice_profiles (
  query_embedding vector(1536),
  match_count int default 5,
  match_threshold float default 0.2
)
returns table (
  id text,
  name text,
  prefecture text,
  region text,
  sweetness numeric,
  hardness numeric,
  stickiness numeric,
  aroma numeric,
  umami numeric,
  aftertaste numeric,
  grain_size numeric,
  clarity numeric,
  richness numeric,
  cold_rice_quality numeric,
  sauce_absorption numeric,
  oil_compatibility numeric,
  quadrant text,
  texture_label text,
  sweetness_label text,
  best_match_dishes jsonb,
  good_with jsonb,
  avoid_pairings jsonb,
  spring_pairings jsonb,
  summer_pairings jsonb,
  autumn_pairings jsonb,
  winter_pairings jsonb,
  sake_pairings jsonb,
  beer_pairings jsonb,
  wine_pairings jsonb,
  whisky_pairings jsonb,
  tea_pairings jsonb,
  mood_pairings jsonb,
  occasion_pairings jsonb,
  lifestyle_scenes jsonb,
  short_ text,
  description text,
  sommelier_note text,
  pairing_reason text,
  semantic_tags jsonb,
  search_queries jsonb,
  rakuten_search_keyword text,
  amazon_search_keyword text,
  furusato_keywords jsonb,
  similarity float
)
language sql stable
as $$
  select
    rp.id,
    rp.name,
    rp.prefecture,
    rp.region,
    rp.sweetness,
    rp.hardness,
    rp.stickiness,
    rp.aroma,
    rp.umami,
    rp.aftertaste,
    rp.grain_size,
    rp.clarity,
    rp.richness,
    rp.cold_rice_quality,
    rp.sauce_absorption,
    rp.oil_compatibility,
    rp.quadrant,
    rp.texture_label,
    rp.sweetness_label,
    rp.best_match_dishes,
    rp.good_with,
    rp.avoid_pairings,
    rp.spring_pairings,
    rp.summer_pairings,
    rp.autumn_pairings,
    rp.winter_pairings,
    rp.sake_pairings,
    rp.beer_pairings,
    rp.wine_pairings,
    rp.whisky_pairings,
    rp.tea_pairings,
    rp.mood_pairings,
    rp.occasion_pairings,
    rp.lifestyle_scenes,
    rp.short_,
    rp.description,
    rp.sommelier_note,
    rp.pairing_reason,
    rp.semantic_tags,
    rp.search_queries,
    rp.rakuten_search_keyword,
    rp.amazon_search_keyword,
    rp.furusato_keywords,
    1 - (rp.embedding <=> query_embedding) as similarity
  from rice_profiles rp
  where rp.embedding is not null
    and 1 - (rp.embedding <=> query_embedding) > match_threshold
  order by rp.embedding <=> query_embedding
  limit match_count;
$$;
如果使用 3072 维，需要把 vector(1536) 改成 vector(3072)。

5. Embedding Text 生成策略
不要直接把整个 JSON stringify 后 embedding。
应生成专门用于检索的 search_text。

新增：



src/lib/rice/buildRiceSearchText.ts


import type { RiceProfileV2 } from "@/types/rice";

function join(values?: string[]) {
  return values && values.length > 0 ? values.join("、") : "";
}

export function buildRiceSearchText(rice: RiceProfileV2): string {
  return [
    `${rice.name}は${rice.prefecture}の米です。`,
    `地域分類は${rice.region}です。`,
    `味わいは${rice.quadrant}。`,
    `食感は${rice.texture_label}、甘みは${rice.sweetness_label}。`,
    `特徴：${rice.short_}`,
    `説明：${rice.description}`,
    `侍米師メモ：${rice.sommelier_note}`,
    `相性の理由：${rice.pairing_reason}`,

    `合う料理：${join(rice.best_match_dishes)}`,
    `相性のよい食材：${join(rice.good_with)}`,
    `避けたい組み合わせ：${join(rice.avoid_pairings)}`,

    `春のおすすめ：${join(rice.spring_pairings)}`,
    `夏のおすすめ：${join(rice.summer_pairings)}`,
    `秋のおすすめ：${join(rice.autumn_pairings)}`,
    `冬のおすすめ：${join(rice.winter_pairings)}`,

    `日本酒との相性：${join(rice.sake_pairings)}`,
    `ビールとの相性：${join(rice.beer_pairings)}`,
    `ワインとの相性：${join(rice.wine_pairings)}`,
    `ウイスキーとの相性：${join(rice.whisky_pairings)}`,
    `お茶との相性：${join(rice.tea_pairings)}`,

    `気分：${join(rice.mood_pairings)}`,
    `場面：${join(rice.occasion_pairings)}`,
    `生活シーン：${join(rice.lifestyle_scenes)}`,

    `タグ：${join(rice.semantic_tags)}`,
    `検索意図：${join(rice.search_queries)}`
  ]
    .filter(Boolean)
    .join("\n");
}
6. Deterministic Jitter：矩阵防重叠算法
不要在数据库里硬编码 matrix_x / matrix_y。
数据库保持纯净：



hardness
sweetness
stickiness
aroma
umami
aftertaste
grain_size
前端渲染时动态计算 display_x / display_y。

新增：



src/lib/rice/matrix.ts


import type { RiceDisplayPoint, RiceProfileV2 } from "@/types/rice";

const MIN_VALUE = 1;
const MAX_VALUE = 5;

export function clamp(value: number, min = MIN_VALUE, max = MAX_VALUE) {
  return Math.max(min, Math.min(max, value));
}

function stableHash(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

function stableNoise(id: string, axis: "x" | "y") {
  const hash = stableHash(`${id}:${axis}`);
  return ((hash % 1000) / 1000 - 0.5) * 0.1;
}

export function calculateMatrixDisplayPoint(rice: RiceProfileV2): RiceDisplayPoint {
  const baseX = rice.hardness;
  const baseY = rice.sweetness;

  // Secondary taste dimensions gently spread overlapping points.
  // Do not use display_x/display_y for recommendation ranking.
  const offsetX =
    (rice.stickiness - 3) * -0.08 +
    (rice.grain_size - 3) * 0.06 +
    stableNoise(rice.id, "x");

  const offsetY =
    (rice.umami - 3) * 0.08 +
    (rice.aftertaste - 3) * 0.05 +
    (rice.richness - 3) * 0.04 +
    stableNoise(rice.id, "y");

  return {
    ...rice,
    display_x: Number(clamp(baseX + offsetX).toFixed(3)),
    display_y: Number(clamp(baseY + offsetY).toFixed(3))
  };
}

export function getQuadrant(hardness: number, sweetness: number) {
  if (hardness < 3 && sweetness >= 3) return "やわらかく、甘み豊か";
  if (hardness >= 3 && sweetness >= 3) return "粒立ちよく、甘み豊か";
  if (hardness < 3 && sweetness < 3) return "やわらかく、すっきり";
  return "粒立ちよく、すっきり";
}

export function getTextureLabel(hardness: number) {
  if (hardness < 2) return "とてもやわらか";
  if (hardness < 3) return "やわらか";
  if (hardness < 4) return "ほどよい";
  if (hardness < 4.6) return "粒立ち";
  return "しっかり";
}

export function getSweetnessLabel(sweetness: number) {
  if (sweetness < 2) return "すっきり";
  if (sweetness < 3) return "ほの甘い";
  if (sweetness < 4) return "甘みあり";
  if (sweetness < 4.6) return "甘み豊か";
  return "ふくよか";
}

export function calculateCoordinateDistance(
  target: { hardness: number; sweetness: number },
  rice: RiceProfileV2
) {
  const dx = rice.hardness - target.hardness;
  const dy = rice.sweetness - target.sweetness;
  return Math.sqrt(dx * dx + dy * dy);
}

export function calculateDisplayScore(distance: number) {
  const maxDistance = Math.sqrt(
    Math.pow(MAX_VALUE - MIN_VALUE, 2) + Math.pow(MAX_VALUE - MIN_VALUE, 2)
  );

  const normalized = Math.min(distance / maxDistance, 1);

  // Softer consumer-facing score.
  // Best match does not look too weak even when no exact match exists.
  const score = 100 - normalized * 55;

  return Math.max(0, Math.min(100, Math.round(score)));
}

export function generateCoordinateReason(
  target: { hardness: number; sweetness: number },
  rice: RiceProfileV2
) {
  const hardnessDelta = rice.hardness - target.hardness;
  const sweetnessDelta = rice.sweetness - target.sweetness;

  const highSweet = rice.sweetness >= 4;
  const highHard = rice.hardness >= 4;
  const soft = rice.hardness <= 2;
  const light = rice.sweetness <= 2;

  if (Math.abs(hardnessDelta) < 0.5 && Math.abs(sweetnessDelta) < 0.5) {
    return "選んだ粒感と甘みに最も近い、今日の食卓に静かに寄り添う一膳です。";
  }

  if (highSweet && highHard) {
    return "粒立ちのよさとふくよかな甘みが重なり、満足感のある一膳です。";
  }

  if (highSweet && soft) {
    return "やわらかな口当たりと豊かな甘みで、ほっとしたい日に向いています。";
  }

  if (highHard && light) {
    return "すっきりとした後味と粒立ちがあり、料理の輪郭を引き立てます。";
  }

  if (highHard) {
    return "粒立ちのよさで、丼ものや肉料理にも負けない存在感があります。";
  }

  if (light) {
    return "重たさを抑えた軽やかな味わいで、和食や魚料理に合わせやすい一膳です。";
  }

  return "甘みと食感のバランスがよく、毎日の食卓に合わせやすい一膳です。";
}

export function calculateTopCoordinateMatches(
  riceList: RiceProfileV2[],
  target: { hardness: number; sweetness: number },
  limit = 4
) {
  return riceList
    .map((rice) => {
      const distance = calculateCoordinateDistance(target, rice);
      return {
        rice,
        distance,
        score: calculateDisplayScore(distance),
        reason: generateCoordinateReason(target, rice)
      };
    })
    .sort((a, b) => {
      if (a.distance !== b.distance) return a.distance - b.distance;
      return a.rice.name.localeCompare(b.rice.name, "ja");
    })
    .slice(0, limit);
}
7. 前端数据获取策略
7.1 推荐策略
因为初期只有 80～100 款大米，数据量很小：

Matrix 页面加载时一次性获取全部 rice profiles；
缓存在 React state / SWR / TanStack Query / Next.js cache 中；
slider / matrix click 全部本地计算；
只有自然语言咨询时调用 API。
7.2 Supabase 查询
新增：



src/lib/rice/fetchRiceProfiles.ts


import { supabase } from "@/lib/supabase";
import type { RiceProfileV2 } from "@/types/rice";

function asStringArray(value: unknown): string[] {
  if (Array.isArray(value)) return value.filter((v): v is string => typeof v === "string");
  return [];
}

export async function fetchRiceProfiles(): Promise<RiceProfileV2[]> {
  const { data, error } = await supabase
    .from("rice_profiles")
    .select("*")
    .order("name", { ascending: true });

  if (error) {
    throw error;
  }

  return (data ?? []).map((row) => ({
    id: String(row.id),
    name: row.name,
    prefecture: row.prefecture,
    region: row.region,

    sweetness: Number(row.sweetness),
    hardness: Number(row.hardness),
    stickiness: Number(row.stickiness),
    aroma: Number(row.aroma ?? 3),
    umami: Number(row.umami ?? 3),
    aftertaste: Number(row.aftertaste ?? 3),
    grain_size: Number(row.grain_size ?? 3),
    clarity: Number(row.clarity ?? 3),
    richness: Number(row.richness ?? 3),
    cold_rice_quality: Number(row.cold_rice_quality ?? 3),
    sauce_absorption: Number(row.sauce_absorption ?? 3),
    oil_compatibility: Number(row.oil_compatibility ?? 3),

    quadrant: row.quadrant ?? "",
    texture_label: row.texture_label ?? "",
    sweetness_label: row.sweetness_label ?? "",

    best_match_dishes: asStringArray(row.best_match_dishes),
    good_with: asStringArray(row.good_with),
    avoid_pairings: asStringArray(row.avoid_pairings),

    spring_pairings: asStringArray(row.spring_pairings),
    summer_pairings: asStringArray(row.summer_pairings),
    autumn_pairings: asStringArray(row.autumn_pairings),
    winter_pairings: asStringArray(row.winter_pairings),

    sake_pairings: asStringArray(row.sake_pairings),
    beer_pairings: asStringArray(row.beer_pairings),
    wine_pairings: asStringArray(row.wine_pairings),
    whisky_pairings: asStringArray(row.whisky_pairings),
    tea_pairings: asStringArray(row.tea_pairings),

    mood_pairings: asStringArray(row.mood_pairings),
    occasion_pairings: asStringArray(row.occasion_pairings),
    lifestyle_scenes: asStringArray(row.lifestyle_scenes),

    short_: row.short_ ?? "",
    description: row.description ?? "",
    sommelier_note: row.sommelier_note ?? "",
    pairing_reason: row.pairing_reason ?? "",

    semantic_tags: asStringArray(row.semantic_tags),
    search_queries: asStringArray(row.search_queries),
    search_text: row.search_text ?? "",

    rakuten_search_keyword: row.rakuten_search_keyword ?? "",
    amazon_search_keyword: row.amazon_search_keyword ?? "",
    furusato_keywords: asStringArray(row.furusato_keywords),

    data_source: row.data_source ?? "editorial",
    data_confidence: row.data_confidence ?? "medium"
  }));
}
8. API：语义推荐
新增：



src/app/api/rice/semantic-recommend/route.ts
实现逻辑：

接收用户 query；
调用 embedding API；
调用 Supabase RPC match_rice_profiles；
返回 top matches；
不要在这里伪造推荐；
如果没有配置 embedding API key，返回明确错误。
示例：



import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabaseAdmin";

export const runtime = "nodejs";

async function createEmbedding(input: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not configured.");
  }

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input
    })
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Embedding API error: ${text}`);
  }

  const json = await res.json();
  return json.data[0].embedding;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const query = String(body.query ?? "").trim();

    if (!query) {
      return NextResponse.json(
        { error: "query is required" },
        { status: 400 }
      );
    }

    const embedding = await createEmbedding(query);

    const { data, error } = await supabaseAdmin.rpc("match_rice_profiles", {
      query_embedding: embedding,
      match_count: 5,
      match_threshold: 0.2
    });

    if (error) {
      throw error;
    }

    return NextResponse.json({
      query,
      matches: data ?? []
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json(
      { error: "semantic recommendation failed" },
      { status: 500 }
    );
  }
}
需要新增：



src/lib/supabaseAdmin.ts


import { createClient } from "@supabase/supabase-js";

export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);
注意：SUPABASE_SERVICE_ROLE_KEY 只能在 server 使用，绝对不要暴露到 client。

9. Seed / Upsert 脚本
新增：



scripts/seed-rice-profiles.ts
功能：

读取本地 src/data/riceProfilesV2.ts 或 JSON；
生成 search_text；
调用 OpenAI embedding；
upsert 到 Supabase。
示例：



import "dotenv/config";
import { createClient } from "@supabase/supabase-js";
import { riceProfiles } from "../src/data/riceProfilesV2";
import { buildRiceSearchText } from "../src/lib/rice/buildRiceSearchText";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function createEmbedding(input: string): Promise<number[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) throw new Error("OPENAI_API_KEY is missing.");

  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "text-embedding-3-small",
      input
    })
  });

  if (!res.ok) {
    throw new Error(await res.text());
  }

  const json = await res.json();
  return json.data[0].embedding;
}

async function main() {
  for (const rice of riceProfiles) {
    const searchText = buildRiceSearchText(rice);
    const embedding = await createEmbedding(searchText);

    const payload = {
      ...rice,
      search_text: searchText,
      embedding
    };

    const { error } = await supabase
      .from("rice_profiles")
      .upsert(payload, { onConflict: "id" });

    if (error) {
      console.error(`Failed: ${rice.name}`, error);
      process.exitCode = 1;
    } else {
      console.log(`Upserted: ${rice.name}`);
    }
  }
}

main();
package script：



{
  "scripts": {
    "seed:rice": "tsx scripts/seed-rice-profiles.ts"
  }
}
如果项目没有 tsx，需要安装：



npm install -D tsx
10. 前端 FlavorMatrix 改修要求
目标文件：



src/components/FlavorMatrix.tsx
10.1 Layout 方针
现在右侧滚动が出ているので、レイアウトを変更する。

変更前：



左：Matrix
右：現在の味わい + slider + recommendation + consultation
変更後：



左：Matrix + 現在の味わい slider
右：Recommendation + consultation
Desktop：



┌──────────────────────────────────────────────┬────────────────────────────┐
│ 風味マトリクス                                │ 侍米師のおすすめ             │
│ [Matrix]                                      │ [No.1 Card]                 │
│ [現在の味わい sliders]                         │ 近い味わいの銘柄             │
│                                               │ [No.2-4 compact list]        │
│                                               │ 侍米師に相談                 │
└──────────────────────────────────────────────┴────────────────────────────┘
Mobile：



1. Header
2. Matrix
3. Sliders
4. Best Match
5. Runner-up List
6. Consultation
10.2 右側滚动必须移除
请搜索并移除右侧 panel 中的：



overflow-y-auto
overflow-auto
ScrollArea
max-h-[...]
右侧 panel 不应出现内部白色 scrollbar。

如移动端页面整体滚动，是可以的。

11. Matrix UI 规则
11.1 坐标轴


X = 粒感 / 硬さ
左 = やわらか
右 = しっかり

Y = 甘み / ふくよかさ
下 = すっきり
上 = ふくよか
11.2 四象限


左上：やわらかく、甘み豊か
右上：粒立ちよく、甘み豊か
左下：やわらかく、すっきり
右下：粒立ちよく、すっきり
不要使用：



濃麗
渋み
粘度
UI 文案统一使用：



粒感
甘み
内部字段可以继续使用：



hardness
sweetness
stickiness
11.3 点位显示
使用 calculateMatrixDisplayPoint 得到 display_x / display_y。

显示规则：



No.1:
- goldStrong
- 米粒型
- ring
- glow
- label 常驻：「最も近い一膳｜{name}」

No.2-4:
- subtle gold / rice white
- 小 label 或 hover label

Others:
- region color
- opacity 0.35-0.55
- hover 时显示 tooltip
11.4 地域色


export const REGION_COLORS: Record<string, string> = {
  "北海道・東北": "#9fb0c8",
  "関東・甲信越": "#c8ad6a",
  "東海・北陸": "#b98d66",
  "近畿": "#d8c0a0",
  "中国・四国": "#a8a98c",
  "九州・沖縄": "#c99a7a",
  "全国銘柄": "#b8b0a0"
};
注意：

region color 用于普通点；
best match 仍使用 gold；
不要做成过度彩色的儿童图表；
KomeSomme 仍然是 warm editorial premium。
12. 侍米師语义推荐 UI
12.1 输入区
文案：



侍米師に相談
料理や気分から、今日の一膳を探します。
placeholder：



例：刺身に合う、冷めても美味しい、ウイスキーと合わせたい
button：



一膳を提案してもらう
注意：不要写成 一品。
KomeSomme 推荐的是米饭，应使用：



一膳
12.2 请求行为


async function handleSemanticRecommend() {
  if (!query.trim()) return;

  setRecommendationMode("semantic");
  setSemanticLoading(true);

  const res = await fetch("/api/rice/semantic-recommend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ query })
  });

  const data = await res.json();
  setSemanticMatches(data.matches ?? []);
}
不要在 slider 改变时调用这个 API。

13. Whisky 推荐解释逻辑
为了强化 KomeSomme 的差异化，语义推荐中需要理解 whisky。

13.1 Whisky 分类


ハイボール:
- 粒立ち
- すっきり
- 唐揚げ、焼き鳥、カレー、炒飯

スモーキーウイスキー:
- 淡麗
- 粒立ち
- 焼き魚、焼きおにぎり、味噌焼き

シェリー樽:
- 甘み
- 旨み
- すき焼き、照り焼き、角煮

バーボン:
- 甘み
- 大粒
- 肉料理、BBQ、ハンバーグ

ジャパニーズウイスキー:
- バランス
- 香り
- 和食、塩おにぎり、出汁料理
13.2 推荐说明中使用 Flavor Bridge
当用户问：



ウイスキーに合う米
泥炭威士忌に合うご飯
ハイボールと唐揚げに合う米
生成理由时使用：



Flavor Bridge
例：



ハイボールのキレには、粒立ちがよく後味の軽い米が合います。
油を受け止めながらも口の中を重くせず、唐揚げや焼き鳥の香ばしさをきれいにつなぎます。
或：



スモーキーな余韻には、甘みが強すぎない淡麗な米が向きます。
焼き魚の焦げ香とウイスキーの煙香を、米のほのかな甘みが静かにつないでくれます。
14. RiceProfileV2 数据生成要求
请新增：



src/data/riceProfilesV2.ts
并按 RiceProfileV2[] 生成 80～100 条数据。

14.1 现有品牌必须包含
至少包含以下已有品牌：



ゆめぴりか
青天の霹靂
新之助
コシヒカリ（魚沼産）
雪若丸
ササニシキ
いちほまれ
彩のきずな
星空舞
さがびより
ミルキークイーン
つや姫
だて正夢
富富富
元気つくし
あきたこまち
ひめの凜
愛ひとつぶ
みずかがみ
きぬむすめ
ひとめぼれ
ななつぼし
にこまる
龍の瞳（いのちの壱）
ハツシモ
銀河のしずく
ヒノヒカリ
まっしぐら
ふっくりんこ
森のくまさん
天のつぶ
きらら397
ハナエチゼン
キヌヒカリ
14.2 追加候选
追加以下品牌，使总数达到 80～100：



にじのきらめき
こしいぶき
葉月みのり
つきあかり
コシヒカリBL
ひゃくまん穀
てんたかく
てんこもり
風さやか
農林48号
梨北米コシヒカリ
あいちのかおり
なつほのか
夢つくし
夢しずく
ぴかまる
くまさんの輝き
くまさんの力
あきほなみ
おいでまい
あきさかり
よさ恋美人
恋の予感
あきろまん
京式部
みえのゆめ
結びの神
なすひかり
とちぎの星
ふくまる
一番星
ゆうだい21
ほしじるし
彩のかがやき
ふさおとめ
ふさこがね
粒すけ
はるみ
金色の風
いわてっこ
つぶぞろい
めんこいな
里山のつぶ
福、笑い
夢ごこち
おぼろづき
ゆきさやか
きたくりん
萌えみのり
あさひの夢
ゴロピカリ
利根きらり
大地の星
ほしのゆめ
まなむすめ
ヒカリ新世紀
ミルキープリンセス
14.3 每条数据必须包含
每个 RiceProfileV2 必须包含以下字段，不能省略：



id
name
prefecture
region
sweetness
hardness
stickiness
aroma
umami
aftertaste
grain_size
clarity
richness
cold_rice_quality
sauce_absorption
oil_compatibility
quadrant
texture_label
sweetness_label
best_match_dishes
good_with
avoid_pairings
spring_pairings
summer_pairings
autumn_pairings
winter_pairings
sake_pairings
beer_pairings
wine_pairings
whisky_pairings
tea_pairings
mood_pairings
occasion_pairings
lifestyle_scenes
short_
description
sommelier_note
pairing_reason
semantic_tags
search_queries
rakuten_search_keyword
amazon_search_keyword
furusato_keywords
data_source
data_confidence
14.4 文字风格
文案应使用自然、克制、高级的日文。

避免：



爆発します
最強
圧倒的
唯一無二
神
究極
可以使用：



静かに寄り添う
輪郭を引き立てる
余韻が残る
ふくよかな甘み
粒立ちがよい
軽やかにまとまる
食卓を整える
KomeSomme 的气质是：



温润
可信
高级
侍米師
日式品鉴
不是：



夸张广告
美食综艺
电商煽动文
15. UI 文案统一
请将 UI 中所有相关文案统一。

正确


風味マトリクス
味わいの地図
現在の味わい
粒感
甘み
侍米師のおすすめ
侍米師の一膳
近い味わいの銘柄
侍米師に相談
一膳を提案してもらう
最も近い一膳｜{name}
避免


粘度
渋み
侍茶師
一品
一撃
濃麗
AIが選んだ
内部字段可以叫 stickiness，但用户界面不要把 stickiness 直接翻译成 粘度。
UI 中应优先使用：



粘り
但主轴仍然是：



粒感 × 甘み
16. 验收标准
16.1 数据验收
riceProfilesV2 至少 80 条；
每条数据符合 RiceProfileV2；
所有数组字段至少有 1～3 个合理值；
search_text 能由 buildRiceSearchText 生成；
seed 脚本能 upsert 到 Supabase；
embedding 成功写入；
RPC 能返回语义相关结果。
16.2 矩阵验收
矩阵至少显示 80 个点；
点位不严重重叠；
普通点使用 region color；
No.1 使用 gold 强调；
No.2-4 次级高亮；
hover 能显示名称；
No.1 常驻显示 最も近い一膳｜{name}；
slider 操作无 API 请求，前端即时响应；
推荐结果随 slider 即时变化。
16.3 语义推荐验收
以下输入应返回合理结果：



刺身に合う米
冷めても美味しいお弁当用
カレーに負けない粒感
ウイスキーと合わせたい
ハイボールと唐揚げに合う米
疲れた日にやさしいご飯が食べたい
秋のきのこ料理に合う米
すき焼きに合う米
16.4 Layout 验收
Desktop 右侧 panel 不出现内部 scrollbar；
現在の味わい slider 位于矩阵下方；
右侧只展示推荐、近い味わい、相談；
Mobile 可以整体滚动；
页面不回到 cyber / neon 风格；
仍保持 KomeSomme 的 warm editorial premium 气质。
17. Cursor 执行顺序
请按以下顺序开发：

新增 src/types/rice.ts
新增 src/lib/rice/matrix.ts
新增 src/lib/rice/buildRiceSearchText.ts
新增 Supabase migration
新增 src/data/riceProfilesV2.ts
新增 seed 脚本
新增 /api/rice/semantic-recommend
修改 FlavorMatrix.tsx
测试 matrix 本地推荐
测试 semantic recommendation
修复 UI 文案和 layout
确认右侧没有 scrollbar
18. 最终目标
完成后，KomeSomme 不应只是一个“大米列表”或“口感散点图”，而应成为：

用户可以通过口感、料理、季节、酒、心情和生活场景，找到今日一膳的侍米師式推荐系统。

核心体验：



拖动矩阵：我想要怎样的口感
输入相談：我今天想怎么吃
推荐结果：为什么这款米适合我
购买链接：马上能买到

补充一句：Gemini 那边提出的 **前端 Deterministic Jitter** 很值得采纳，比在 JSON 里硬编码 `matrix_x / matrix_y` 更利于维护。  
最终架构建议就是：**数据库保存纯风味数据，前端负责显示打散，Supabase 向量只负责语义咨询。**