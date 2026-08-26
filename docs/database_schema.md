# データベース設計（Supabase / PostgreSQL）

## `rice_brands`

| カラム | 型 | 用途 |
| --- | --- | --- |
| `id` | `uuid` | Primary Key |
| `name` | `text` | 銘柄名 |
| `prefecture` | `text` | 都道府県 |
| `sweetness` | `integer` (1〜5) | 甘み、マップ Y 座標 |
| `hardness` | `integer` (1〜5) | 硬さ。UI 上は粒感、マップ X 座標 |
| `stickiness` | `integer` (1〜5) | 粘り、点サイズと詳細表示 |
| `best_match_dishes` | `text[]` | 相性の良い料理 |
| `description` | `text` | 特徴と味わいの説明 |
| `embedding` | `vector(1536)` | `gemini-embedding-001` の正規化済みベクトル |
| `rakuten_search_keyword` | `text` | 現行の楽天市場検索 CTA |
| `affiliate_amazon` | `text` | 将来の affiliate URL 用 |
| `affiliate_furusato` | `text` | 将来のふるさと納税 URL 用 |
| `created_at` / `updated_at` | timestamp | 任意の監査日時 |

シードが現在投入するのは `name`、`prefecture`、3指標、`best_match_dishes`、`description`、`rakuten_search_keyword`、`embedding` である。

## `match_rice_brands` RPC

入力:

- `query_embedding`: 1536 次元 vector
- `match_count`: 返却上限
- `match_threshold`: similarity 下限

戻り値は少なくとも `id`、`name`、`prefecture`、`description`、`rakuten_search_keyword`、`similarity` を含む。cosine similarity の高い順で返す。

## 拡張と安全

- pgvector を有効化する
- embedding の次元を seed / API / DB で 1536 に揃える
- 匿名 client は `SELECT` のみ許可し、書き込みを拒否する RLS を前提とする
- seed は `SUPABASE_SERVICE_ROLE_KEY` をサーバー側で使用する
- service role key と Gemini key を Browser へ公開しない
