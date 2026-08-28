# KomeSomme システム設計書

本書はリポジトリの現行実装を説明する。UI 正本は [08-ui-design.md](./08-ui-design.md)、未実装は [06-requirements.md](./06-requirements.md) の「将来要件」を参照する。全体像は [02-tech-retrospective.md](./02-tech-retrospective.md)。

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
│   └── api/rice/semantic-recommend/  # 意味検索
├── components/
│   ├── FlavorMatrix.tsx              # オーケストレーション
│   └── matrix/                       # マップ、点、レール、相談、詳細、購入リンク、モバイルカード
├── data/
│   ├── README.md                     # 銘柄データの構造
│   ├── riceProfilesV2.ts             # 互換 shim → rice/catalog
│   └── rice/
│       ├── sources/*.ts              # 地域別 RiceSource
│       ├── overlay.ts                # 残余商標・編集行
│       └── catalog.ts                # derive 済みカタログ
├── lib/
│   ├── rice/                         # matrix / derive / dedup / search_text / bridge / fetch / regions
│   ├── embedding/                    # Gemini / OpenAI
│   ├── supabase/
│   └── rakuten/
└── types/
    ├── rice.ts
    └── database.ts                   # 3 tables + rice_catalog / match_rice_profiles

supabase/migrations/
├── 0001_create_rice_profiles.sql     # 旧ワイドテーブル（既存環境のみ）
├── 0002_drop_rice_brands.sql         # V1 名称テーブルの任意削除
├── 0003_normalize_rice_catalog.sql   # 現行スキーマ（地域 / 名称 / 詳細 + rice_catalog）
├── 0004_restrict_embedding_access.sql # anon から embedding / RPC を遮断

scripts/
├── validate-rice-profiles.ts
└── seed-rice-profiles.ts
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

| 変数 | 用途 |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser / Server / seed |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | カタログ読取 |
| `SUPABASE_SERVICE_ROLE_KEY` | 意味検索と seed |
| `EMBEDDING_PROVIDER` | `gemini`（既定）または `openai` |
| `GEMINI_API_KEY` | Gemini embedding と短い返事 |
| `OPENAI_API_KEY` | OpenAI embedding。Gemini 返事が使えないときの控え |
| `SEMANTIC_RECOMMEND_ENABLED` | `false` で相談 API を停止（課金防護の kill switch） |
| `SEMANTIC_RATE_LIMIT_PER_MIN` | 相談 API の IP あたり毎分上限（既定 8） |
| `SEMANTIC_RATE_LIMIT_PER_DAY` | 相談 API の IP あたり日次上限（既定 80） |

## 5. データ境界と安全性

- Browser には anon key のみ
- `rice_regions` / `rice_brands` / `rice_profile_details` は匿名 SELECT のみ
- 地図の点色は `rice_regions.color`（VIEW の `region_color`）
- 通常クエリは `embedding` / `search_text` を取得しない
- ベクトル比較は必ず `embedding_model` で絞る
- 公開 URL の相談 API は `guardSemanticRecommend`（kill switch + レート制限）。詳細は [11-launch-checklist.md](./11-launch-checklist.md)
