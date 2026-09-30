# KomeSomme 要件定義

画面・動きの正本は [08-ui-design.md](./08-ui-design.md)。相談 API は [05-semantic-search.md](./05-semantic-search.md)。旧 URL とドメインは [vercel-production.md](./vercel-production.md)（仕組みは [03-system-design.md](./03-system-design.md) §6）。本書は受け入れの契約だけを書く。

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

- 「侍米師に相談」の明示的 submit 時だけ `POST /api/rice/semantic-recommend` を呼ぶ
- サーバーで embedding を生成し、RPC `match_rice_profiles` が **Top 4** を返す
- `embedding_model` で絞り込み、Gemini / OpenAI の混在比較を防ぐ
- Flavor Bridge が酒種・場面に応じた理由を付ける。短い返事は候補銘柄だけを名指しし、相談の言葉を拾う。返事生成に失敗しても Top 4 は返す
- 相談の 1 位に探針を合わせる。マップ操作または「地図で選び直す」で座標推薦に復帰する
- API は Node.js runtime の非 Streaming JSON

### 1.4 銘柄詳細と購入導線

- 詳細パネル（銘柄品鑑）は重点説明（味わい・今日の食べ方・料理相性）と購入 CTA を優先し、お酒・お茶・季節の詳細相性は出さない
- `/library/[id]` が銘柄の統合事典。旧 URL の 1 ホップは [03-system-design.md](./03-system-design.md) §6
- 購入 UI: **通販**（楽天 / Yahoo / Amazon / メルカリ）と **ふるさと納税**（楽天ふるさと / Yahoo!ふるさと / さとふる）のタグ切替。軟色カプセル（検索 URL）。銘柄品鑑では重点説明の直後
- アフィタグ配線（楽天 wrap・Amazon Associate・VC 用ヘルパ）はコード済み。**商品 API / deep link と VC 本番 SID・成果突合**は未完（P1/P2）
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

## 3. 将来要件と実装状況

[11-launch-checklist.md](./11-launch-checklist.md) が実行リスト。ここに「将来」と書いてあっても、チェックリスト側が新しい。

**1.0 前に入ったもの:** 相談 API のレート制限と kill switch、本番デプロイ（Vercel / `komesomme.jp`）、RLS 0004、匿名 `access_events`、GA4 gtag（測定 ID は env）、Sentry SDK（DSN は env）、法務草案、Vitest / Playwright / CI、購入タグ UI、編集発見。

**1.x で入ったもの:** 百科の合稿と公式 URL（0013）、旧 URL の 1 ホップ 308、地図で選んだ粒の短い強調と推薦欄の交叉フェード。

**まだ残り（門禁の詳細は 11）:**

- Affiliate 成果突合（クリック ↔ 管理画面）
- branch protection（CI 必須化）
- Library / 銘柄 URL の Search Console インデックス定着
- Sentry DSN 本番投入と失敗率アラート

**1.0 後（P2）:** Rakuten 商品 API / deep link、お気に入り・履歴・Auth、grounded LLM 長文・炊飯アドバイス、PWA。

将来要件を現行機能として README や UI に記載しない。
