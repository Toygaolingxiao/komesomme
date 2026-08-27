# データベース設計（Supabase / PostgreSQL）

銘柄カタログは **3 テーブル + 結合 VIEW** に分離する。地図の点色はフロントのハードコードではなく、`rice_regions.color` を正とする。

旧 V1 のワイド `rice_brands`（embedding 付き）は `0002_drop_rice_brands.sql` で削除できる。**0003 適用後は実行しない**（V2 の名称マスタも `rice_brands` という名前のため。0002 は `region_id` がある場合スキップする）。

```text
rice_regions 1 ──∞ rice_brands 1 ── 1 rice_profile_details
                      │
                      └─ VIEW rice_catalog（読取専用の結合）
```

味わい値は KomeSomme の編集評価であり、公的な測定値ではない。マップ座標（`display_x` / `display_y`）は永続化せず、クライアントの `calculateMatrixDisplayPoint` が都度計算する。

## `rice_regions`（地域マスタ）

| カラム | 型 | 用途 |
| --- | --- | --- |
| `id` | `text` PK | kebab-case（例: `hokkaido-tohoku`） |
| `name` | `text` unique | 表示名（例: 北海道・東北） |
| `color` | `text` | 地図ドットと凡例の hex |
| `sort_order` | `integer` | 凡例の並び |

初期 7 行は 0003 が upsert する。色を変えたいときはこのテーブルだけ更新すれば、VIEW / RPC / UI が追従する。

## `rice_brands`（名称マスタ）

| カラム | 型 | 用途 |
| --- | --- | --- |
| `id` | `text` PK | kebab-case の銘柄 ID |
| `name` | `text` | 銘柄名 |
| `prefecture` | `text` | 産地（都道府県） |
| `region_id` | `text` FK → `rice_regions.id` | 地域 |
| `rakuten_search_keyword` / `amazon_search_keyword` / `furusato_keywords` | text / jsonb | 購買 CTA |

名称・産地・購買キーワードの管理はここ。味わいを変えずに銘柄名だけ直せる。

## `rice_profile_details`（詳細）

`brand_id` が PK かつ FK（`on delete cascade`）。1 銘柄 1 行。

| カラム | 型 | 用途 |
| --- | --- | --- |
| `sweetness` / `hardness` / `stickiness` | `numeric` 1–5 | 甘み・粒感・粘り |
| `aroma` / `umami` / `aftertaste` ほか 9 指標 | `numeric` 1–5 | 詳細パネル |
| `quadrant` / `texture_label` / `sweetness_label` | `text` | 象限と軸ラベル |
| 料理・季節・酒・気分・場面・タグ | `jsonb` 配列 | ペアリング |
| `short_` / `description` / `sommelier_note` / `pairing_reason` | `text` | 編集テキスト |
| `search_text` | `text` | embedding 用の自然文（Browser には送らない） |
| `embedding` | `vector(1536)` | Gemini または OpenAI の正規化ベクトル |
| `embedding_model` | `text` | 生成モデル名。異なるモデルのベクトルは比較できない |
| `data_source` / `data_confidence` | `text` | 既定 `editorial` / `medium` |

## `rice_catalog` VIEW

3 テーブルの inner join。Browser はここから読む（`embedding` / `search_text` は含めない）。

返す主な列: 銘柄 ID・名称・産地・`region`（地域名）・`region_id`・`region_color`・12 指標・編集テキスト・購買キーワード。

`security_invoker = true`。RLS は実テーブル側。

## `match_rice_profiles` RPC

入力:

- `query_embedding`: `vector(1536)`
- `p_embedding_model`: 比較対象のモデル名（必須）
- `match_count`: 既定 4
- `match_threshold`: cosine similarity 下限

`rice_profile_details` のベクトルを、名称・地域と結合して返す。`region_id` / `region_color` も含む。プロバイダ切替後に再シードしていない行は検索対象外。

## Embedding プロバイダ

`EMBEDDING_PROVIDER` で切替する。どちらも 1536 次元なので列は共用する。

- Gemini `gemini-embedding-001`（MRL 1536 + L2 再正規化）
- OpenAI `text-embedding-3-small`（ネイティブ 1536）

切替後は `npm run seed:rice` が必要。

## 適用手順（SQL Editor）

**すでに `rice_profiles`（0001 のワイドテーブル）がある場合**

1. [`supabase/migrations/0003_normalize_rice_catalog.sql`](../supabase/migrations/0003_normalize_rice_catalog.sql) を実行する  
   既存行を 3 テーブルへ移し、`rice_profiles` を DROP する。embedding も移行する。
2. `npm run validate:rice`
3. `npm run seed:rice`（テキストや色の最新化。embedding も再生成する）

**空のプロジェクト（0001 未実行）**

1. **0003 だけ**実行する（0001 は不要。ワイドテーブルを作ってすぐ分割する無駄を避ける）
2. `npm run validate:rice`
3. `npm run seed:rice`

**任意**

- V1 の旧 `rice_brands` が残っていて、まだ 0003 を走らせていないときだけ [`0002_drop_rice_brands.sql`](../supabase/migrations/0002_drop_rice_brands.sql)
- 0003 は V1 `rice_brands`（`region_id` なし）を検出して自動 drop する

書き込みは service role。anon / authenticated は SELECT のみ。
