# 変更履歴

[Semantic Versioning](./01-versioning.md) に従う。現在の番号は [`VERSION`](../VERSION)。

## Unreleased

## 0.4.4 — 2026-08

### UX

- ホーム「お店で探す」展開後の 4 モールを、色相はそのまま彩度だけ少し落とした実心ボタンに（Modal / 銘柄ページはフル彩度のまま）
- Mobile: 折りたたみ店舗帯を地図の直後・相談カードの上へ（選んだ銘柄への近道）

## 0.4.3 — 2026-08

### UX

- ホーム購入を Sommelier-first に再設計: 既定は「お店で探す」のみ。展開後はモール色 4 ボタン＋※PR（線枠トーンは採用せず）
- Mobile は地図・相談の後に購入帯。Desktop は近傍銘柄の下に折りたたみ

## 0.4.2 — 2026-08

### 試験

- 試験式样书 `docs/test-specification.md`（TS-*）
- Vitest 単体 + Playwright E2E（Desktop/Mobile）+ CI ゲート + `docs/test-results.md` 生成

### UX

- 相談失敗時、API の日本語 `message`（kill-switch の一時停止文を含む）をフォームに出す

### 運営

- GitHub Issue テンプレ（bug / feature / task）と PR テンプレ
- Cursor rule `project-workflow.mdc`：本仓工作流；PMO 交付工具迁出独立仓 `pmo-kit`

## 0.4.1 — 2026-08

### UX

- 「購入候補」をやめ、ホーム右レールに「取扱オンラインショップ」4 モール入口＋※PR のみ（Amazon 定型文・楽天 Developers クレジットは購入カード／フッター側）
- 詳細 CTA は「くわしく見る」、下部カード見出しは「お店で探す」

### 法務

- `/tokushoho` に運営事業者・責任者・連絡先等を記入（アフィリエイト案内サイトである旨を明記）

## 0.4.0 — 2026-08

### 購入

- 推薦カード `RiceProductCard`：Amazon / 楽天 / Yahoo! / さとふるの 4 CTA。Amazon は Associate Tag、楽天・Yahoo は API があれば商品 URL、なければ検索。さとふるは VC 自由転鎖を予約
- Amazon 運営規約第 5 条の定型文をカードとフッターに常時表示。景表法・VC 向けに「アフィリエイト広告」と明示。楽天 API 利用に公式クレジット（HTML 未改変）。外链 `rel="noopener noreferrer nofollow"`
- 楽天 API の商品名・価格はカードに出さない（href のみ）。手順は [13-affiliate-compliance.md](./13-affiliate-compliance.md)
- 楽天アフィ包装と ValueCommerce 転鎖は登録済み Production のみ（Preview は素の検索 URL）

### ドキュメント

- [14-affiliate-programs.md](./14-affiliate-programs.md): Amazon / 楽天ウェブサービス / パートナー規約・ガイドライン / ValueCommerce / ポイントクラブ
- [13-affiliate-compliance.md](./13-affiliate-compliance.md): 楽天 API と他モール共存の隔離設計

## 0.3.0 — 2026-08

### 分析

- GTM 任意埋込（`NEXT_PUBLIC_GTM_ID`）+ 既存 `track()` → `dataLayer`
- Supabase `access_events`（migration `0005`）と `POST /api/analytics/event` で匿名 page_view / UI イベントを保管
- プライバシーポリシーに解析・access 記録を追記

### データ

- 外部食味図 5 枚＋都道府県 / JA / Wikipedia 等の公開記述を突き合わせ、図上銘柄の `sweetness` / `hardness` / `stickiness` と `short_` を再校正（軸は従来の甘み×粒立ちのまま）
- 正本アーカイブ: `scripts/data/`。適用: `scripts/apply-taste-consensus.ts`
- seed の Supabase 書き込みに一時的な `fetch failed` の再試行を追加

### Mobile UX

- 地図の強調点を Top 8 → Top 4（推薦レールと同じ）に統一
- `break-keep` による文末クリップを解消（品鑑・今日の一膳）
- プレビュー地図の負マージン横溢れを抑制、ヘッダー法務リンクを短縮、下部余白を拡大

### セキュリティ / コンプライアンス

- 相談 API: `SEMANTIC_RECOMMEND_ENABLED` kill switch、IP あたり分次・日次レート制限
- 法務草案: `/privacy` `/terms` `/tokushoho`、ヘッダー法務ナビ、アフィリエイト表記
- 特商法の事業者欄はプレースホルダ（公開前に記入）
- CI: GitHub Actions で lint / typecheck / validate:rice / build
- DB: `0004_restrict_embedding_access.sql` — anon から embedding / search_text 直読みと RPC を遮断
- `next.config.ts`: X-Frame-Options / nosniff / Referrer-Policy 等
- SEO: `metadataBase`、OG/Twitter、`robots.ts`、`sitemap.ts`、OG 画像
- 起動時 env 検証（Production fail-fast）
- クライアント bundle に service_role が混入していないことを CI で検査

### 開発

- VERSION 運用を [01-versioning.md](./01-versioning.md) と `.cursor/rules/semver.mdc` に明記
- `.env.example` を「コードが読む変数」だけに整理。未使用のアフィ env / 空の `RakutenAffiliateClient` / 未使用 Supabase server client を削除
- [11-launch-checklist.md](./11-launch-checklist.md) / [vercel-production.md](./vercel-production.md) / [smoke-test.md](./smoke-test.md)

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
- 似ている銘柄カード、`analytics` イベント

## 0.1.0 — 2026-08 前半

- MVP 初版: 味わいマップ、座標推薦 Top 4、意味検索 API
- V2 カタログ（derive + dedup）、Supabase 3 テーブル + `rice_catalog` VIEW
- Flavor Bridge、米ソムリエ短い返事
- UI デザイン正本、Grain + Tasting Probe アイコン

## それ以前

- V2 カタログ設計、意味検索 API、UI デザイン正本の策定（当時の草案は整理のため削除）
