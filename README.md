# KomeSomme

KomeSomme（コメソム）は、日本のブランド米を「粒感 × 甘み」の味わいマップと料理・気分の言葉から探せる選米ナビゲーションです。座標による即時推薦と Gemini embedding による意味検索を分離し、近い銘柄 Top 4 と詳細、楽天市場への購入導線を表示します。

## 現行 MVP

実装済み:

- Supabase `rice_brands` の実データを表示する2D風味マトリクス
- X=粒感（`hardness`）、Y=甘み（`sweetness`）、点サイズ=粘り（`stickiness`）
- マップ、探針、スライダーによるクライアント座標推薦 Top 4
- 相談文を Gemini で embedding 化し、Supabase pgvector で検索する意味推薦 Top 4
- 銘柄詳細、相性料理、近い銘柄、楽天市場検索 CTA
- Loading / Empty / Error と reduced motion 対応

ブランド詳細ページの実データ化、Affiliate API、Amazon / ふるさと納税 CTA、LLM による推薦文、Auth、rate limit は未実装です。

## 技術スタック

- Next.js 15 App Router / React 19
- TypeScript 5
- Tailwind CSS 4
- Motion（`motion/react`）
- Phosphor Icons
- Supabase（PostgreSQL、pgvector、RLS 前提）
- Gemini `gemini-embedding-001`（1536次元）
- Next.js Node.js Route Handler（非 Streaming JSON）

OpenAI API、shadcn/ui、Recharts、Lucide React は現行実装では使用していません。

## セットアップ

Node.js と npm を用意し、依存をインストールします。

```bash
npm install
```

`.env.example` を `.env.local` にコピーし、次の値を設定します。

```dotenv
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
GEMINI_API_KEY=
```

- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Browser からの銘柄読取
- `SUPABASE_SERVICE_ROLE_KEY`: recommend API と seed のサーバー処理
- `GEMINI_API_KEY`: recommend API と seed の embedding 生成

秘密鍵を commit せず、service role key と Gemini key をクライアントコードへ公開しないでください。

## 開発コマンド

開発サーバー:

```bash
npm run dev
```

ブラウザで `http://localhost:3000` を開きます。

シードデータの embedding を生成し、`rice_brands` へ投入:

```bash
npm run seed
```

本番 build:

```bash
npm run build
```

build の起動確認:

```bash
npm run start
```

`npm run seed` は各銘柄を insert するため、同じ DB へ再実行する前に重複方針を確認してください。

## アーキテクチャ

```text
初期表示
Browser → Supabase rice_brands → FlavorMatrix

座標推薦
Map / sliders → hardness × sweetness の client-side distance → Top 4

意味検索
相談文 → POST /api/recommend
       → Gemini gemini-embedding-001（1536次元）
       → Supabase match_rice_brands RPC / pgvector
       → JSON Top 4

シード
src/lib/data/seed-rice.json
  → scripts/seed.ts
  → Gemini embedding
  → Supabase rice_brands
```

主要ファイル:

- `src/components/FlavorMatrix.tsx`: 現行 UI、座標推薦、意味検索結果、詳細
- `src/app/api/recommend/route.ts`: Node runtime の embedding-only JSON API
- `scripts/seed.ts`: シード検証、embedding 生成、DB insert
- `src/lib/supabase/`: Browser / Server / Admin client と query
- `src/types/database.ts`: DB と RPC の TypeScript 型

## ドキュメント

- [UI デザイン正本](./docs/ui_design.md)
- [システム設計](./docs/master_design_spec.md)
- [要件定義](./docs/requirements.md)
- [Gemini Embedding・意味検索設計](./docs/rag_prompt_design.md)
- [データベース設計](./docs/database_schema.md)
- [開発フェーズ](./docs/development_phases.md)
- [事業概要](./docs/business_plan.md)
