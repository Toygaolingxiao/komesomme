# 変更履歴

[Semantic Versioning](./01-versioning.md) に従う。現在: **0.2.1**（[`VERSION`](../VERSION)）。

## 0.2.1 — 2026-08

### Mobile UX

- 銘柄品鑑・`/[brand]` の横溢れを抑制（`min-w-0`、指標 2 列）
- 購入リンク: スマホは 1 列、`sm+` は 2 行 × 3 列
- 初期探針をセッションごとにランダム（正中心を避ける）
- 地図プレビューを拡大（約 42svh）、点の間引きを緩和、初回ヒントをモバイルにも表示
- 今日の一膳 → 地図の順序は維持

## 0.2.0 — 2026-08

### ドキュメント

- `00_`〜`10_` フラット構成に統一（サブフォルダ廃止）
- 旧 V2 仕様書（中国語の開発メモ）を削除し、内容は各番号文書に吸収済み
- [02-tech-retrospective.md](./02-tech-retrospective.md) 追加

### データ

- 銘柄データを `src/data/rice/` に集約（`sources/` `overlay.ts` `catalog.ts`）
- 旧手作業アーカイブ `handCurated.ts` を削除

### UX（Phase 1–6）

- 購入導線 2 行 × 3 列、上部 CTA、チャネル説明
- 詳細情報階層、味わいの輪郭、地図・スライダー改善
- 似ている銘柄カード、`analytics.ts` イベント

## 0.1.0 — 2026-08 前半

- MVP 初版: 味わいマップ、座標推薦 Top 4、意味検索 API
- V2 カタログ（derive + dedup）、Supabase 3 テーブル + `rice_catalog` VIEW
- Flavor Bridge、米ソムリエ短い返事
- UI デザイン正本、Grain + Tasting Probe アイコン

## それ以前

- V2 カタログ設計、意味検索 API、UI デザイン正本の策定（当時の草案は整理のため削除）
