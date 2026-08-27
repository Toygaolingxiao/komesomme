# KomeSomme

KomeSomme（コメソム）は、日本のブランド米を「粒感 × 甘み」の味わいマップと、料理・気分・お酒の言葉から探せる選米ナビゲーションです。座標推薦は端末内で即時に行い、自然言語の相談だけ embedding 検索になります。

ブランド名は kome + sommelier。画面上の案内役は **米ソムリエ** です。

## 現行 MVP

- 約 107 銘柄の `RiceProfileV2`（12 の味わい指標、季節・酒・気分）
- 正方形の風味マトリクス。X=粒感、Y=甘み、点サイズ=粘り。点色は地域マスタ
- 決定論的 Jitter による点の自然な配置
- マップ / スライダーによるローカル座標推薦 Top 4
- 「米ソムリエに相談」による意味検索 Top 4（Flavor Bridge 付き）
- 詳細パネルと `/[brand]` ページ
- 楽天 / Amazon / ふるさと納税の検索 CTA
- 品種単位の二重去重（県名・SKU は統合、魚沼・佐渡・仁多・龍の瞳は独立）

Rakuten Affiliate API、LLM 文章生成、Auth は未実装です。

## 次に行う作業（ローカル / Supabase）

0003 の SQL は実行済みなら、ここから:

1. `.env.local` を確認する（`NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY` / `GEMINI_API_KEY` または `OPENAI_API_KEY`）
2. `npm run validate:rice` — カタログが 80 件以上・ID 一意・GI 行があることを機械確認
3. `npm run seed:rice` — 107 銘柄を 3 テーブルへ upsert。銘柄ごとに embedding するため **2〜3 分**
4. `npm run dev` — [http://localhost:3000](http://localhost:3000) でマップの地域色、凡例、魚沼 / 佐渡 / 仁多が別点であること、「米ソムリエに相談」を確認
5. 相談欄に「ハイボールと唐揚げに合う米」などを送り、意味検索 Top 4 が返ることを確認

詳細なチェックリストは [docs/next-steps.md](./docs/next-steps.md)。

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

1. Supabase SQL Editor で [`supabase/migrations/0003_normalize_rice_catalog.sql`](./supabase/migrations/0003_normalize_rice_catalog.sql) を **一括実行**する（ステップ分割は不要）  
   - すでに `0001` の `rice_profiles` がある場合は、3 テーブルへ移行してワイドテーブルを削除する  
   - 空のプロジェクトなら **0003 だけ**でよい（0001 / 0002 は不要）
2. `npm run validate:rice`
3. `npm run seed:rice`

詳細は [docs/database_schema.md](./docs/database_schema.md)。

## 開発コマンド

```bash
npm run dev
npm run lint
npm run typecheck
npm run build
npm run validate:rice
npm run seed:rice
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
src/data/rice/*.ts + curated overlay
  → cultivarDedup → search_text → embedding
  → rice_regions / rice_brands / rice_profile_details
```

主要ファイル:

- `src/components/FlavorMatrix.tsx` — 状態とレイアウト
- `src/components/matrix/` — マップ、レール、相談、詳細
- `src/lib/rice/` — 座標、導出、去重、search_text、Flavor Bridge、地域色
- `src/lib/embedding/` — プロバイダ抽象
- `src/app/api/rice/semantic-recommend/route.ts`
- `src/data/rice/` — 手書きソース
- `src/lib/data/riceProfilesv2.ts` — 編集 overlay
- `src/lib/data/backup_riceP.ts` — 手作業アーカイブ（シードは去重後カタログを使う）

## ドキュメント

索引は [docs/README.md](./docs/README.md)。
