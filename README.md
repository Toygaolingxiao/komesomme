# KomeSomme

KomeSomme（コメソム）は、日本のブランド米を「粒感 × 甘み」の味わいマップと、料理・気分・お酒の言葉から探せる選米ナビゲーションです。座標推薦は端末内で即時に行い、自然言語の相談だけ embedding 検索になります。

## 現行 MVP

- 約 90 銘柄の `RiceProfileV2`（12 の味わい指標、季節・酒・気分）
- 正方形の風味マトリクス。X=粒感、Y=甘み、点サイズ=粘り
- 決定論的 Jitter による点の自然な配置
- マップ / スライダーによるローカル座標推薦 Top 4
- 「侍米師に相談」による意味検索 Top 4（Flavor Bridge 付き）
- 詳細パネルと `/[brand]` ページ
- 楽天 / Amazon / ふるさと納税の検索 CTA

Rakuten Affiliate API、LLM 文章生成、Auth は未実装です。

## 技術スタック

- Next.js 15 App Router / React 19 / TypeScript 5 / Tailwind CSS 4
- Motion、Phosphor Icons
- Supabase（PostgreSQL、pgvector、RLS）
- Embedding: Gemini `gemini-embedding-001` または OpenAI `text-embedding-3-small`（1536 次元）

## セットアップ

```bash
npm install
```

`.env.example` を `.env.local` にコピーします。

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
EMBEDDING_PROVIDER=gemini
GEMINI_API_KEY=
OPENAI_API_KEY=
```

`EMBEDDING_PROVIDER` を変えたら、必ず再シードしてください。異なるモデルのベクトルは比較できません。

### データベース

1. Supabase SQL Editor で [`supabase/migrations/0003_normalize_rice_catalog.sql`](./supabase/migrations/0003_normalize_rice_catalog.sql) を実行する  
   - すでに `0001` の `rice_profiles` がある場合は、3 テーブルへ移行してワイドテーブルを削除する  
   - 空のプロジェクトなら **0003 だけ**でよい（0001 は不要）
2. カタログを検証する

```bash
npm run validate:rice
```

3. embedding を生成して 3 テーブルへ upsert する

```bash
npm run seed:rice
```

V1 の旧 `rice_brands`（0003 より前）だけ、任意で [`0002_drop_rice_brands.sql`](./supabase/migrations/0002_drop_rice_brands.sql) を実行する。0003 適用後の名称マスタは同名のため、0002 は `region_id` があるとスキップする。詳細は [docs/database_schema.md](./docs/database_schema.md)。

## 開発コマンド

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
```

## アーキテクチャ

```text
初期表示
Browser → rice_catalog + rice_regions → FlavorMatrix（点色 = region_color）

座標推薦
Map / sliders → display 座標距離 → Top 4（API なし）

意味検索
相談文 → POST /api/rice/semantic-recommend
       → createEmbedding
       → match_rice_profiles（embedding_model で絞り込み）
       → Flavor Bridge → Top 4

シード
src/data/rice/*.ts → deriveRiceProfile → search_text → embedding
  → rice_regions / rice_brands / rice_profile_details
```

主要ファイル:

- `src/components/FlavorMatrix.tsx` — 状態とレイアウト
- `src/components/matrix/` — マップ、レール、相談、詳細
- `src/lib/rice/` — 座標計算、導出、search_text、Flavor Bridge
- `src/lib/embedding/` — プロバイダ抽象
- `src/app/api/rice/semantic-recommend/route.ts`
- `src/data/rice/` — 手書きソース

## ドキュメント

- [UI デザイン正本](./docs/ui_design.md)
- [システム設計](./docs/master_design_spec.md)
- [要件定義](./docs/requirements.md)
- [Embedding・意味検索](./docs/rag_prompt_design.md)
- [データベース設計](./docs/database_schema.md)
- [開発フェーズ](./docs/development_phases.md)
- [事業概要](./docs/business_plan.md)
- [RiceProfile V2 原典](./docs/kome-somme-rice-v2-implementation.md)（編集しない）
