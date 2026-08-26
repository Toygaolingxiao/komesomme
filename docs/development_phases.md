# KomeSomme 開発フェーズ

日付ありの旧ロードマップではなく、リポジトリの実装状態を基準に管理する。

## Phase 0: 基盤 — 完了

- Next.js 15 App Router、TypeScript、Tailwind CSS 4 のセットアップ
- Supabase client / server / admin の分離
- `rice_brands` 型、pgvector RPC 型の定義
- 構造化シードデータと `npm run seed`
- Gemini `gemini-embedding-001` の 1536 次元 embedding 生成

## Phase 1: MVP 推薦体験 — 実装済み

- Supabase の実データによる風味マトリクス
- X=粒感（hardness）、Y=甘み（sweetness）、粘り=点サイズ
- マップ、探針、スライダーによる座標推薦 Top 4
- 銘柄詳細、近い銘柄、相性料理、楽天検索 CTA
- 相談文を使う Gemini embedding + pgvector 意味検索 Top 4
- Node runtime、非 Streaming JSON API
- Loading / Empty / Error と reduced motion

## Phase 2: UI 正本への適合 — 完了

- [ui_design.md](./ui_design.md) の明るい和紙・炊きたて米テーマへ統一
- Desktop 左にマップと横並び現在値、右に No.1・近い銘柄・相談を配置
- Desktop 右カラムの内部スクロールを解消
- Mobile 単列、keyboard / touch 操作へ対応
- 低彩度地域色、明確な軸・象限、No.1 ラベル階層を適用

## Phase 3: 品質・公開準備 — 未実装

- 単体・統合・E2E・アクセシビリティ試験
- Rate limit、構造化ログ、監視、性能計測
- Supabase RLS と本番環境変数の運用確認
- Vercel 等への本番デプロイ、独自ドメイン、分析
- seed の重複投入対策と更新フロー

## Phase 4: コンテンツ・収益化 — 将来

- `/[brand]` の実データ詳細・SEO
- Rakuten Affiliate API / deep link / 成果計測
- Amazon、ふるさと納税導線
- お気に入り、履歴、個人化
- grounded LLM 推薦文と炊飯アドバイス（評価・安全設計後）
