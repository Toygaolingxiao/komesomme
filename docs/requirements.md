# KomeSomme 要件定義

## 1. 現行 MVP 要件

### 1.1 風味マトリクス

- X 軸は **粒感**（`hardness` 1〜5）。左「やわらか」、右「しっかり」
- Y 軸は **甘み**（`sweetness` 1〜5）。下「すっきり」、上「ふくよか」
- `stickiness` は点サイズと詳細に使い、座標軸には使わない
- 配置は `calculateMatrixDisplayPoint`。マトリクスは正方形
- 探針と粒感・甘みスライダーは同期する
- 12 の味わい指標を詳細パネルに表示する

### 1.2 座標推薦

- display 座標との2次元距離をクライアントで計算し、**Top 4** を即時表示する
- スコアは 45〜100 の整数
- 座標操作では embedding API、pgvector RPC、文章生成を起動しない
- マップ上の No.1 は探針に最も近い点と一致する

### 1.3 意味検索

- 「侍米師に相談」の明示的 submit 時だけ `POST /api/rice/semantic-recommend` を呼ぶ
- サーバーで embedding を生成し、RPC `match_rice_profiles` が **Top 4** を返す
- `embedding_model` で絞り込み、Gemini / OpenAI の混在比較を防ぐ
- Flavor Bridge が酒種・場面に応じた理由を付ける（LLM なし）
- 探針座標は上書きしない。「座標に戻す」で座標推薦に復帰できる
- API は Node.js runtime の非 Streaming JSON

### 1.4 銘柄詳細と購入導線

- 詳細パネルと `/[brand]` ページで説明、12 指標、季節、酒、気分、場面、控えたい組み合わせを表示する
- CTA: 楽天、Amazon、ふるさと納税（検索 URL。Affiliate API は未実装）
- 味わい値を公的測定値として表示しない

### 1.5 データと状態

- マップは Supabase `rice_catalog` と `rice_regions` から取得する（embedding 列は送らない）
- 点色は地域マスタの `color`（`region_color`）を使う
- 手書きソースは `src/data/rice/*.ts`、派生は `deriveRiceProfile`
- Loading / Empty / Error / 意味検索中を日本語で表示する
- 鍵を Browser に公開しない

## 2. 非機能要件

- TypeScript で API と DB の境界を型付けする
- embedding 次元は DB / seed / API で 1536 に統一する
- query は 500 文字に制限する
- Desktop / Mobile の UI は [ui_design.md](./ui_design.md) を正本とする
- `npm run validate:rice` が 80 件以上・スコア範囲・必須配列・禁止語を検証する

## 3. 将来要件（未実装）

- Rakuten Affiliate API、deep link、成果計測
- LLM による個別推薦文、炊飯助言、会話
- Rate limit、監視、構造化ログ
- Auth、お気に入り、検索履歴
- キャッシュ、E2E、アクセシビリティ試験の定量化

将来要件を現行機能として README や UI に記載しない。
