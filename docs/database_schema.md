# データベース設計（Supabase / PostgreSQL）

現行の銘柄カタログは `rice_profiles` である。旧 `rice_brands` は V2 検証後に `supabase/migrations/0002_drop_rice_brands.sql` で手動削除する。

## `rice_profiles`

味わい値は KomeSomme の編集評価であり、公的な測定値ではない。マップ座標（`display_x` / `display_y`）は永続化せず、クライアントの `calculateMatrixDisplayPoint` が都度計算する。

| カラム | 型 | 用途 |
| --- | --- | --- |
| `id` | `text` PK | kebab-case の銘柄 ID |
| `name` / `prefecture` / `region` | `text` | 銘柄名・産地・地域分類 |
| `sweetness` / `hardness` / `stickiness` | `numeric` 1–5 | 甘み・粒感・粘り |
| `aroma` / `umami` / `aftertaste` | `numeric` 1–5 | 香り・旨み・余韻 |
| `grain_size` / `clarity` / `richness` | `numeric` 1–5 | 粒の大きさ・淡麗さ・コク |
| `cold_rice_quality` / `sauce_absorption` / `oil_compatibility` | `numeric` 1–5 | 冷めても・タレ相性・油相性 |
| `quadrant` / `texture_label` / `sweetness_label` | `text` | 象限と軸ラベル |
| `best_match_dishes` ほか jsonb 配列 | `jsonb` | 料理・季節・酒・気分・場面・タグ |
| `short_` / `description` / `sommelier_note` / `pairing_reason` | `text` | 編集テキスト |
| `search_text` | `text` | embedding 用の自然文 |
| `rakuten_search_keyword` / `amazon_search_keyword` / `furusato_keywords` | text / jsonb | 購買 CTA |
| `embedding` | `vector(1536)` | Gemini または OpenAI の正規化ベクトル |
| `embedding_model` | `text` | 生成モデル名。異なるモデルのベクトルは比較できない |
| `data_source` / `data_confidence` | `text` | 既定 `editorial` / `medium` |
| `created_at` / `updated_at` | timestamptz | 監査日時 |

インデックス: `region`、`prefecture`、`(sweetness, hardness, stickiness)`、`embedding_model`、`embedding` の ivfflat（cosine）。

RLS: 匿名・認証ユーザーは `SELECT` のみ。書き込みは service role。

## `match_rice_profiles` RPC

入力:

- `query_embedding`: `vector(1536)`
- `p_embedding_model`: 比較対象のモデル名（必須）
- `match_count`: 既定 4
- `match_threshold`: cosine similarity 下限

`embedding_model` が一致し、similarity が閾値を超える行だけを cosine 距離順で返す。プロバイダ切替後に再シードしていない行は検索対象外になる。

## Embedding プロバイダ

`EMBEDDING_PROVIDER` で切替する。どちらも 1536 次元なので列は共用する。

- Gemini `gemini-embedding-001`（MRL 1536 + L2 再正規化）
- OpenAI `text-embedding-3-small`（ネイティブ 1536）

切替後は `npm run seed:rice` が必要。

## 適用手順

1. Supabase SQL Editor で `supabase/migrations/0001_create_rice_profiles.sql` を実行する
2. `npm run validate:rice`
3. `npm run seed:rice`
4. V2 の動作確認後、任意で `0002_drop_rice_brands.sql` を実行する
