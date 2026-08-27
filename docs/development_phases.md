# KomeSomme 開発フェーズ

日付ありの旧ロードマップではなく、リポジトリの実装状態を基準に管理する。

## Phase 0: 基盤 — 完了

- Next.js 15 App Router、TypeScript、Tailwind CSS 4
- Supabase client / server / admin の分離
- Gemini embedding の初期導入

## Phase 1: MVP 推薦体験 — 完了

- 味わいマップ、座標推薦 Top 4、意味検索 Top 4
- 明るい和紙テーマ、Desktop / Mobile レイアウト

## Phase 2: RiceProfile V2 — 完了

- `RiceProfileV2`（約 90 銘柄、12 指標、季節・酒・気分）
- `rice_regions` / `rice_brands` / `rice_profile_details`、VIEW `rice_catalog`、`match_rice_profiles`、`embedding_model`
- Gemini / OpenAI 両対応の embedding 抽象層
- `search_text` と Flavor Bridge
- FlavorMatrix の分割（`src/components/matrix/`）
- `/[brand]` の実データページと購買 CTA
- 旧 `rice_brands` 経路の削除（DB テーブルの drop は手動）

## Phase 3: 品質・公開準備 — 未実装

- 単体・統合・E2E・アクセシビリティ試験
- Rate limit、構造化ログ、監視
- 本番デプロイ、独自ドメイン、分析
- `rice_brands` の手動 drop と本番 RLS 確認

## Phase 4: コンテンツ・収益化 — 将来

- Rakuten Affiliate API / deep link / 成果計測
- お気に入り、履歴、個人化
- grounded LLM 推薦文と炊飯アドバイス
