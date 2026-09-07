# 技術振り返り — 侍米師をゼロから

KomeSomme を一から組み立てたときの技術選定、システム設計、生成 AI 活用、RAG 試行の記録。構想から現行までの経緯は [12-product-journey.md](./12-product-journey.md)（中文）。現行実装の入口は [03-system-design.md](./03-system-design.md)、RAG 詳細は [05-semantic-search.md](./05-semantic-search.md)。

## 1. プロジェクトの出発点

**課題**: ブランド米は名前と産地だけでは比較できない。粒感・甘み・料理や酒との相性を、直感と言葉の両方で辿りたい。

**コンセプト**: AI ダッシュボードではなく「和紙の味わい地図」。裏側にベクトル検索があっても、表では米・産地・相性が主役（[08-ui-design.md](./08-ui-design.md)）。

**ゼロからの進め方**:

1. 要件とデータモデルを [06-requirements.md](./06-requirements.md)・[03-system-design.md](./03-system-design.md) に整理
2. 手書き `RiceSource` → ルール derive → カタログ化 → seed
3. 地図 UI と座標推薦を先に成立させ、意味検索は「相談」導線に限定
4. 生成 AI は文案・実装支援に広く使い、**推薦の芯はルール + ベクトル**に留めた

## 2. 技術スタック一覧

### フロントエンド

| 技術 | 用途 | 選定理由 |
| --- | --- | --- |
| Next.js 15 App Router | SSR、API Route、ルーティング | `/library/[id]` 事典の SEO と単一リポジトリ（旧 `/{id}` は永久リダイレクト） |
| React 19 | UI | App Router の標準 |
| TypeScript 5 | 型安全 | 銘柄プロファイル・DB 型の共有 |
| Tailwind CSS 4 | スタイル | デザイントークンを utility で統一 |
| Motion | 探針・フェード | 短い spring。chart ライブラリは使わない |
| Phosphor Icons | アイコン | 線画で和紙 UI に合う |
| 素の SVG | 味わいの輪郭 | 依存を増やさずデザイン正本に従う |

### バックエンド・データ

| 技術 | 用途 | 選定理由 |
| --- | --- | --- |
| Supabase | PostgreSQL + Auth 基盤 | マネージド DB、pgvector、RLS |
| pgvector | 銘柄 embedding 検索 | 意味検索 Top-K を RPC で完結 |
| 3 テーブル + VIEW | `rice_regions` / `rice_brands` / `rice_profile_details` → `rice_catalog` | 名称・味わい・ベクトルを分離（[04-database.md](./04-database.md)） |
| tsx スクリプト | validate / seed | ビルドと分離したデータパイプライン |

### AI / Embedding

| 技術 | 用途 | 選定理由 |
| --- | --- | --- |
| Gemini `gemini-embedding-001` | 既定 embedding（1536 次元） | コストと品質のバランス |
| OpenAI `text-embedding-3-small` | 代替 embedding | プロバイダ切替の検証 |
| Gemini Flash 系 | 相談の短い返事 | 候補確定後のみ。失敗時は reason にフォールバック |
| Flavor Bridge（非 LLM） | 推薦理由文 | 酒種・場面ルールで安定。幻覚を避ける |

### 観測・アフィ・試験（要約）

| 層 | 选型 |
| --- | --- |
| 托管 | Vercel Production（`komesomme.jp`） |
| 观测 | `access_events` + `/ops`；GA4 gtag（任意）；Sentry（DSN 未设则关） |
| 联盟 | 搜索 CTA + wrap；楽天隔离见 [13](./13-affiliate-compliance.md)；披露见 [15](./15-disclosure-surfaces.md) |
| 试验 | Vitest · Playwright · `validate:rice` · CI |

### 開発環境

| 技術 | 用途 |
| --- | --- |
| ESLint + Next config | 静的解析 |
| cross-env + system CA | 企業ネットワークでの API 接続 |
| Cursor + エージェント | 実装・リファクタ・ドキュメント整備 |
| Vitest + Playwright | unit / e2e（GitHub Actions 常駐） |
| Vercel | Production（旗艦 `komesomme.jp`） |

## 3. システム設計の要点

### 3.1 二系統の推薦

```text
【座標推薦】クライアントのみ
  探針・スライダー → display 座標 → 2D 距離 → Top 4
  → API 不要、即時、コストゼロ

【意味検索】サーバー + pgvector
  相談 submit → embedding → match_rice_profiles → Top 4
  → Flavor Bridge → 短い返事（任意）
```

地図操作のたびに LLM / embedding を呼ばない設計が、体感速度とコストの両方で正解だった。

### 3.2 データパイプライン（編集可能な正本）

```text
sources/（手書き打分・文案）
  → deriveRiceProfile（ルール派生）
  → overlay（ソースに無い商標行のみ追加）
  → cultivarDedup（品種統合・GI 独立）
  → catalog（実行時配列）
  → buildRiceSearchText → embedding → Supabase
```

打分の正本を TypeScript に置くことで、seed 前に `validate:rice` で品質を担保。DB は配信と検索のキャッシュ層。

### 3.3 境界と安全

- Browser は anon key のみ。embedding 列は通常クエリで返さない
- `embedding_model` でベクトル空間を分離（混在比較を防ぐ）
- 相談 query は 500 文字上限。内部例外はクライアントに出さない

### 3.4 UI アーキテクチャ

- `FlavorMatrix.tsx` がオーケストレーション
- `matrix/` 配下に地図・レール・相談・詳細・購入を分割
- Desktop は 1 画面収め、Mobile は推薦優先の縦フロー

## 4. RAG としての設計（試行と学び）

厳密には「文書 QA」ではなく **銘柄カタログに対する意味検索 + ルール付き説明**。構成は RAG に近い。

| 層 | 実装 | 役割 |
| --- | --- | --- |
| **Corpus** | 各銘柄の `search_text`（自然語で結合） | embedding の入力。JSON キー名は入れない |
| **Index** | pgvector + `match_rice_profiles` RPC | Top-K 類似度 |
| **Retriever** | 相談文 + `expandConsultationQuery`（補助語） | 酒・料理の同義を少し足す |
| **Generator（軽量）** | `generateSommelierReply` | Top 4 確定後のみ 2 文。候補外の銘柄名を創作しない |
| **非 LLM 説明** | Flavor Bridge | 酒種・場面テンプレで reason。幻覚リスク低 |

### うまくいったこと

- **検索と作文の分離**: 順位はベクトル、理由はルール、返事だけ LLM
- **search_text の自然文化**: 相談文（「ハイボールと唐揚げ」）と同じ語彙空間に寄せた
- **モデル固定**: `embedding_model` 列で再現性を確保
- **失敗耐性**: 返事生成が落ちても Top 4 は必ず返す

### やらなかったこと（意図的）

- チャット履歴・マルチターン RAG
- 銘柄データ全体を LLM コンテキストに載せる
- Streaming 応答（MVP は非 Streaming JSON）
- 推薦順位を LLM に任せる

### 今後の拡張候補

- 本番計測に基づく threshold / 補助語の調整
- grounded な長文解説（候補プロファイルのみを context に）
- 炊飯アドバイス（requirements の将来要件）

## 5. 生成 AI を用いた開発

### ドキュメント駆動

- UI・要件・DB を md 正本化し、実装前にエージェントへ渡す
- 差分は `08-ui-design.md` と `06-requirements.md` に集約
- リファクタはフェーズ計画 → 実装 → changelog の順

### データ整備

- 手作業アーカイブは廃止し、`sources` + `overlay` に一本化（[10-changelog.md](./10-changelog.md)）
- 禁止語は validate スクリプトで warning

### エージェント向けのルール

- 推薦式・座標式・打分正本は変更しない
- mock / 勝手な seed 禁止
- 案内役は「侍米師（じべいし）」、UI 文案は日本語

### 限界と人間の判断が要る箇所

- 銘柄打分と相性コピーの事実確認
- 購入導線の UX 優先順位（Phase 1–6 の判断）
- デザインの「安っぽさ」排除（色・余白・禁止語）

## 6. 関連文書

| 文書 | 内容 |
| --- | --- |
| [03-system-design.md](./03-system-design.md) | ディレクトリ・データフロー・環境変数 |
| [04-database.md](./04-database.md) | スキーマ・マイグレーション |
| [05-semantic-search.md](./05-semantic-search.md) | embedding・API・Flavor Bridge の運用仕様 |
| [01-versioning.md](./01-versioning.md) | SemVer ルール |
| [10-changelog.md](./10-changelog.md) | バージョン別の変更履歴 |
| [11-launch-checklist.md](./11-launch-checklist.md) | 1.0.0 までの実行タスク |
| [12-product-journey.md](./12-product-journey.md) | 構想〜現行の経緯（中文） |
