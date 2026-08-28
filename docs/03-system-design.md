# KomeSomme システム設計書

本書はリポジトリの現行実装を説明する。UI 正本は [08-ui-design.md](./08-ui-design.md)。未完了の本番タスクは [11-launch-checklist.md](./11-launch-checklist.md)。全体像は [02-tech-retrospective.md](./02-tech-retrospective.md)。

## 1. 技術スタック

- **Web:** Next.js 15 App Router、React 19、TypeScript 5
- **スタイル:** Tailwind CSS 4
- **モーション:** Motion（`motion/react`）
- **アイコン:** Phosphor Icons
- **データ:** Supabase（PostgreSQL、pgvector、RLS）
- **Embedding:** Gemini `gemini-embedding-001` または OpenAI `text-embedding-3-small`（いずれも 1536 次元）
- **API:** Next.js Route Handler、Node.js runtime、非 Streaming JSON
- **シード:** `tsx`、embedding 抽象層、service role

チャートは HTML/CSS と Motion。座標推薦はクライアントだけ。相談の短い返事だけ Gemini / OpenAI が書く。

## 2. 実ファイル配置

```text
src/
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   ├── [brand]/page.tsx              # 銘柄詳細 SSR
│   ├── privacy / terms / tokushoho   # 法務草案
│   ├── api/rice/semantic-recommend/  # 意味検索
│   └── api/analytics/event/          # 匿名 access_events
├── components/
│   ├── FlavorMatrix.tsx
│   ├── analytics/                    # GTM + page_view
│   └── matrix/
├── data/rice/                        # sources / overlay / catalog
├── lib/
│   ├── rice/
│   ├── analytics/
│   ├── embedding/
│   └── supabase/
└── types/

supabase/migrations/
├── 0001 / 0002                       # 既存環境向け。新規は不要
├── 0003_normalize_rice_catalog.sql
├── 0004_restrict_embedding_access.sql
└── 0005_access_events.sql

scripts/
├── validate-rice-profiles.ts
├── seed-rice-profiles.ts
├── apply-taste-consensus.ts
└── data/                             # 味わい再校正アーカイブ
```

## 3. 主要データフロー

```text
RiceSource → deriveRiceProfile → overlay → cultivarDedup → riceProfiles
  → buildRiceSearchText → createEmbedding
  → rice_regions / rice_brands / rice_profile_details

Browser → fetchRiceCatalog → calculateMatrixDisplayPoint
       → calculateTopCoordinateMatches（ローカル Top 4）

相談 → POST /api/rice/semantic-recommend
    → createEmbedding → match_rice_profiles
    → Flavor Bridge → generateSommelierReply（失敗時は reason）
    → 推薦欄
```

座標操作はサーバーを呼ばない。マップの No.1 は display 座標の最近傍。

## 4. 環境変数

一覧の正本は [`.env.example`](../.env.example) と [vercel-production.md](./vercel-production.md)。`NEXT_PUBLIC_*` だけがブラウザに出る。`SUPABASE_SERVICE_ROLE_KEY` を公開名に付けない。

## 5. データ境界と安全性

- Browser には anon key のみ
- `rice_regions` / `rice_brands` / `rice_profile_details` は匿名 SELECT のみ
- 地図の点色は `rice_regions.color`（VIEW の `region_color`）
- 通常クエリは `embedding` / `search_text` を取得しない
- ベクトル比較は必ず `embedding_model` で絞る
- 公開 URL の相談 API は `guardSemanticRecommend`（kill switch + レート制限）
- 匿名 UI イベントは `POST /api/analytics/event` → `access_events`（anon は SELECT 不可）
