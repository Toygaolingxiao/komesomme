# KomeSomme システム設計書

本書はリポジトリの現行実装を説明する。UI 正本は [ui_design.md](./ui_design.md)、未実装は [requirements.md](./requirements.md) の「将来要件」を参照する。

## 1. 技術スタック

- **Web:** Next.js 15 App Router、React 19、TypeScript 5
- **スタイル:** Tailwind CSS 4
- **モーション:** Motion（`motion/react`）
- **アイコン:** Phosphor Icons
- **データ:** Supabase（PostgreSQL、pgvector、RLS）
- **Embedding:** Gemini `gemini-embedding-001` または OpenAI `text-embedding-3-small`（いずれも 1536 次元）
- **API:** Next.js Route Handler、Node.js runtime、非 Streaming JSON
- **シード:** `tsx`、embedding 抽象層、service role

チャートは HTML/CSS と Motion。意味検索は文章生成を行わない。

## 2. 実ファイル配置

```text
src/
├── app/
│   ├── page.tsx
│   ├── layout.tsx
│   ├── [brand]/page.tsx              # 銘柄詳細 SSR
│   └── api/rice/semantic-recommend/  # 意味検索
├── components/
│   ├── FlavorMatrix.tsx              # オーケストレーション
│   └── matrix/                       # マップ、点、レール、相談、詳細
├── data/
│   ├── rice/*.ts                     # 地域別 RiceSource
│   └── riceProfilesV2.ts             # derive 済みカタログ
├── lib/
│   ├── rice/                         # matrix / derive / search_text / bridge / fetch
│   ├── embedding/                    # Gemini / OpenAI
│   ├── supabase/
│   └── rakuten/
└── types/
    ├── rice.ts
    └── database.ts                   # rice_profiles / match_rice_profiles

supabase/migrations/
├── 0001_create_rice_profiles.sql
└── 0002_drop_rice_brands.sql         # 任意・手動

scripts/
├── validate-rice-profiles.ts
└── seed-rice-profiles.ts
```

## 3. 主要データフロー

```text
RiceSource → deriveRiceProfile → riceProfiles
  → buildRiceSearchText → createEmbedding → rice_profiles

Browser → fetchRiceProfiles → calculateMatrixDisplayPoint
       → calculateTopCoordinateMatches（ローカル Top 4）

相談 → POST /api/rice/semantic-recommend
    → createEmbedding → match_rice_profiles
    → Flavor Bridge → 推薦欄
```

座標操作はサーバーを呼ばない。マップの No.1 は display 座標の最近傍。

## 4. 環境変数

| 変数 | 用途 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser / Server / seed |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | カタログ読取 |
| `SUPABASE_SERVICE_ROLE_KEY` | 意味検索と seed |
| `EMBEDDING_PROVIDER` | `gemini`（既定）または `openai` |
| `GEMINI_API_KEY` | Gemini embedding |
| `OPENAI_API_KEY` | OpenAI embedding |

## 5. データ境界と安全性

- Browser には anon key のみ
- `rice_profiles` は匿名 SELECT のみ
- 通常クエリは `embedding` / `search_text` を取得しない
- ベクトル比較は必ず `embedding_model` で絞る
