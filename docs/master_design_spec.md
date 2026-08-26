# KomeSomme システム設計書

本書はリポジトリの現行実装を説明する。UI の次期デザイン正本は [ui_design.md](./ui_design.md)、未実装機能は [requirements.md](./requirements.md) の「将来要件」を参照する。

## 1. 技術スタック

- **Web:** Next.js 15 App Router、React 19、TypeScript 5
- **スタイル:** Tailwind CSS 4（`@tailwindcss/postcss`）
- **モーション:** Motion（`motion/react`）
- **アイコン:** Phosphor Icons（`@phosphor-icons/react`）
- **データ:** Supabase（PostgreSQL、pgvector、RLS を前提）
- **Embedding:** Gemini `gemini-embedding-001`
  - `outputDimensionality: 1536`
  - 1536 次元へ切り詰めた MRL ベクトルを cosine distance 用に再正規化
- **API:** Next.js Route Handler、Node.js runtime、非 Streaming の JSON
- **シード実行:** `tsx`、Gemini、Supabase service role

shadcn/ui、Recharts、Lucide React、OpenAI API は現行依存ではない。チャートは HTML/CSS と Motion で実装され、意味検索は文章生成を行わない。

## 2. 実ファイル配置

```text
src/
├── app/
│   ├── page.tsx                    # トップページと FlavorMatrix の配置
│   ├── layout.tsx                  # metadata、フォント、ルートレイアウト
│   ├── globals.css                 # Tailwind 4 とグローバルスタイル
│   ├── api/recommend/route.ts      # Node runtime の意味検索 JSON API
│   └── [brand]/page.tsx            # ブランド詳細のプレースホルダー
├── components/
│   ├── FlavorMatrix.tsx            # 現行のマップ、推薦、相談、詳細 UI
│   ├── chat/SommeChat.tsx          # 旧/補助チャットコンポーネント
│   └── ui/index.ts                 # UI export
├── lib/
│   ├── data/seed-rice.json         # 銘柄シードデータ
│   ├── supabase/
│   │   ├── env.ts
│   │   ├── client.ts
│   │   ├── server.ts
│   │   ├── admin.ts
│   │   ├── queries.ts
│   │   └── index.ts
│   └── rakuten/
│       ├── client.ts               # API client は未実装
│       └── index.ts
└── types/database.ts               # rice_brands / RPC の型

scripts/
└── seed.ts                         # Gemini embedding 生成と DB insert
```

トップページが実際に import するのは `src/components/FlavorMatrix.tsx` である。

## 3. 主要データフロー

### 3.1 銘柄一覧と座標推薦

1. Client Component が Supabase Browser Client で `rice_brands` を取得する。
2. `hardness` を X、`sweetness` を Y、`stickiness` を点サイズとして描画する。
3. マップ、探針、スライダーの変更時にクライアントで2次元距離を計算し、Top 4 を表示する。
4. 銘柄詳細を開いた場合、保存 embedding は必要時だけ読み込む。利用できれば銘柄間 cosine similarity、なければ座標距離で近い銘柄を並べる。

### 3.2 自然言語による意味検索

```text
Browser
  └─ POST /api/recommend { query, matchCount: 4 }
       ├─ Gemini gemini-embedding-001 → 1536次元、正規化
       ├─ Supabase RPC match_rice_brands
       └─ JSON { matches: [...] }
```

- `src/app/api/recommend/route.ts` は `runtime = "nodejs"`
- 入力は必須文字列、最大 500 文字
- `matchCount` は 1〜10、既定値は 4
- 成功・入力不備・上流失敗のいずれも JSON で返す
- Streaming、チャット completion、LLM による推薦文章生成は行わない

### 3.3 シード

1. `scripts/seed.ts` が `src/lib/data/seed-rice.json` を検証する。
2. 説明と相性料理を Gemini で 1536 次元 embedding に変換し再正規化する。
3. retry / backoff とリクエスト間隔を適用し、service role で `rice_brands` に insert する。

## 4. 環境変数

| 変数 | 使用箇所 | 必須になる操作 |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Browser / Server / seed | 開発、build、seed |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Browser Client | UI からの読取 |
| `SUPABASE_SERVICE_ROLE_KEY` | Server Client / seed | 意味検索、seed |
| `GEMINI_API_KEY` | recommend API / seed | 意味検索、seed |

`OPENAI_API_KEY` は現行実装では使用しない。

## 5. データ境界と安全性

- Browser には anon key のみを公開し、service role と Gemini key はサーバー側に置く
- `rice_brands` は匿名 `SELECT` のみを許可する RLS を前提とする
- 書き込みは `scripts/seed.ts` の service role に限定する
- embedding 次元は DB の `vector(1536)`、seed、recommend API で一致させる
- クライアント表示用の通常クエリでは embedding を取得しない

## 6. 現行実装の範囲

実装済み:

- Supabase の実データを使う味わいマップ
- 粒感・甘みの座標推薦 Top 4
- Gemini embedding と pgvector RPC による意味検索 Top 4
- 選択銘柄の詳細、近い銘柄、楽天検索 CTA
- Loading / Empty / Error、reduced motion、基本的な keyboard focus

未実装またはプレースホルダー:

- `/[brand]` の実データ詳細・SEO ページ
- Rakuten Affiliate API client と affiliate deep link
- Auth、個人設定、履歴
- LLM による説明文生成
- Rate limit、運用監視、分析
