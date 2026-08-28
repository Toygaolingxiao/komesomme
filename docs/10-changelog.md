# 変更履歴

[Semantic Versioning](./01-versioning.md) に従う。現在: **0.2.1**（[`VERSION`](../VERSION)）。

## Unreleased

### 分析

- GTM 任意埋込（`NEXT_PUBLIC_GTM_ID`）+ 既存 `track()` → `dataLayer`
- Supabase `access_events`（migration `0005`）と `POST /api/analytics/event` で匿名 page_view / UI イベントを保管
- プライバシーポリシーに解析・access 記録を追記

### データ

- 外部食味図 5 枚＋都道府県 / JA / Wikipedia 等の公開記述を突き合わせ、図上銘柄の `sweetness` / `hardness` / `stickiness` と `short_` を再校正（軸は従来の甘み×粒立ちのまま）
- 正本アーカイブ: `scripts/data/`（README あり）。適用: `scripts/apply-taste-consensus.ts`
- **本番 DB は `npm run seed:rice` の再実行が必要**（座標は seed 後の catalog / embedding と揃える）
- `access_events` は SQL Editor で `0005_access_events.sql` を適用

### Mobile UX

- 地図の強調点を Top 8 → Top 4（推薦レールと同じ）に統一
- `break-keep` による文末クリップを解消（品鑑・今日の一膳）
- プレビュー地図の負マージン横溢れを抑制、ヘッダー法務リンクを短縮、下部余白を拡大

### セキュリティ / コンプライアンス（段階リリース）

- 相談 API: `SEMANTIC_RECOMMEND_ENABLED` kill switch、IP あたり分次・日次レート制限
- 法務草案: `/privacy` `/terms` `/tokushoho`、ヘッダー法務ナビ、アフィリエイト表記
- 特商法の事業者欄はプレースホルダ（公開前に記入）
- CI: GitHub Actions で lint / typecheck / validate:rice / build
- DB: `0004_restrict_embedding_access.sql` — anon から embedding / search_text 直読みと RPC を遮断（本番で実測済み）
- `next.config.ts`: X-Frame-Options / nosniff / Referrer-Policy 等
- [vercel-production.md](./vercel-production.md): Vercel env・Redeploy・ロールバック手順
- SEO: `metadataBase`、OG/Twitter、`robots.ts`、`sitemap.ts`、OG 画像
- 起動時 env 検証（Production fail-fast）。anon に service_role JWT があれば起動しない
- CI: クライアント bundle に service_role が混入していないことを検査
- `npm audit --omit=dev`: Critical なし。`next` 同梱 postcss の High は Next 16 への強制アップが必要なため見送り
- [smoke-test.md](./smoke-test.md): 本番スモーク手順書

### ドキュメント

- [11-launch-checklist.md](./11-launch-checklist.md): 収益化正式サイト向け本番チェックリスト（P0/P1/P2・実行バックログ）

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
