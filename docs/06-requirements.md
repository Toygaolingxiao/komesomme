# KomeSomme 要件定義

## 1. 現行 MVP 要件

### 1.1 風味マトリクス

- X 軸は左「すっきり澄む」、右「甘みふくらむ」（`sweetness` 1〜5）
- Y 軸は下「粒立ちしっかり」、上「やわらか、ほどける」（`hardness` 1〜5。内部スコアは 5=しっかりのまま、表示 Y だけ反転）
- `stickiness` は点サイズと詳細に使い、座標軸には使わない
- 配置は `calculateMatrixDisplayPoint`。マップは左ペインの残り領域いっぱいに広げる（正方形固定ではない）
- 探針と甘み・硬さのスライダーは同期する
- 12 の味わい指標を詳細パネルに表示する

### 1.2 座標推薦

- display 座標との2次元距離をクライアントで計算し、**Top 4** を即時表示する
- スコアは 45〜100 の整数
- 座標操作では embedding API、pgvector RPC、文章生成を起動しない
- マップ上の No.1 は探針に最も近い点と一致する

### 1.3 意味検索

- 「米ソムリエに相談」の明示的 submit 時だけ `POST /api/rice/semantic-recommend` を呼ぶ
- サーバーで embedding を生成し、RPC `match_rice_profiles` が **Top 4** を返す
- `embedding_model` で絞り込み、Gemini / OpenAI の混在比較を防ぐ
- Flavor Bridge が酒種・場面に応じた理由を付ける。短い返事は候補銘柄だけを名指しし、相談の言葉を拾う。返事生成に失敗しても Top 4 は返す
- 相談の 1 位に探針を合わせる。マップ操作または「地図で選び直す」で座標推薦に復帰する
- API は Node.js runtime の非 Streaming JSON

### 1.4 銘柄詳細と購入導線

- 詳細パネル（銘柄品鑑）は重点説明（味わい・今日の食べ方・料理相性）と購入 CTA を優先し、お酒・お茶・季節の詳細相性は出さない
- `/[brand]` ページで説明、12 指標、季節、酒・茶、気分、場面、控えたい組み合わせを表示する
- CTA: 楽天、Amazon、ふるさと納税（検索 URL。Affiliate API は未実装）。銘柄品鑑では重点説明の直後に置く
- 味わい値を公的測定値として表示しない

### 1.5 データと状態

- マップは Supabase `rice_catalog` と `rice_regions` から取得する（embedding 列は送らない）
- 点色は地域マスタの `color`（`region_color`）を使う
- 手書きソースは `src/data/rice/sources/`、派生は `deriveRiceProfile`
- Loading / Empty / Error / 意味検索中を日本語で表示する
- 鍵を Browser に公開しない

## 2. 非機能要件

- TypeScript で API と DB の境界を型付けする
- embedding 次元は DB / seed / API で 1536 に統一する
- query は 500 文字に制限する
- Desktop / Mobile の UI は [08-ui-design.md](./08-ui-design.md) を正本とする
- `npm run validate:rice` が 80 件以上・スコア範囲・必須配列・禁止語を検証する

## 3. 将来要件（未実装）

- 単体・統合・E2E・アクセシビリティ試験
- Rate limit、構造化ログ、監視
- 本番デプロイ、独自ドメイン、分析
- 本番 RLS と seed 済みデータの確認
- Rakuten Affiliate API、deep link、成果計測
- お気に入り、履歴、個人化
- Auth
- grounded LLM 推薦文と炊飯アドバイス

収益化を伴う正式公開の分割タスク・完了条件は [11-launch-checklist.md](./11-launch-checklist.md)（P0 ブロッカー / P1 収益・観測 / P2 成長）。

将来要件を現行機能として README や UI に記載しない。
