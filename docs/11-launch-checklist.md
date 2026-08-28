# 本番リリース・チェックリスト（収益化サイト）

対象: **B）アフィリエイト収益を伴う正式サイト**。  
現状: MVP **0.2.1**（体験は閉じているが、防護・法務・計測・収益タグは未達）。  
ゴール: SemVer **1.0.0** — [01-versioning.md](./01-versioning.md) / [06-requirements.md](./06-requirements.md) §3。

使い方: 各タスクの `[ ]` を完了したら `[x]`。完了条件（Done）を満たすまで次フェーズへ進まない。

---

## 0. 前提とスコープ

| 項目 | 決定 |
| --- | --- |
| 公開形態 | ゲスト利用可（Auth は 1.0 必須ではない） |
| 収益 | 楽天 / Yahoo / Amazon / ふるさと納税の **検索 CTA + Affiliate タグ** |
| 分析 | 既存 `track()`（`src/lib/analytics.ts`）を GTM/GA4 等へ接続 |
| 相談 API | 公開する。**レート制限とコスト上限が必須** |
| 後回し（1.0 後可） | Auth、お気に入り、多ターン相談、炊飯アドバイス、PWA、Affiliate 商品 API の本実装 |

```text
P0 公開ブロッカー → P1 公開直後必須 → P2 成長・深化
完了後: VERSION / package.json を 1.0.0、10-changelog に記録、独自ドメインで公開
```

---

## P0 — 公開ブロッカー（全部 Done になるまで 1.0.0 にしない）

### P0-1. 相談 API のレート制限とコスト防護

| ID | タスク | Done 条件 | 主な場所 |
| --- | --- | --- | --- |
| P0-1a | `POST /api/rice/semantic-recommend` にレート制限（IP または匿名トークン） | 閾値超過で 429。正常クエリは通る | **一部完了** `src/lib/security/semanticGuard.ts`（isolate 単位の best-effort。Upstash は後続） |
| P0-1b | 日次 / 月次の呼び出し上限またはプロバイダ予算アラート | 上限到達時に相談を安全に劣化（Top4 なし or 固定メッセージ）。課金爆発しない | **一部完了** 日次 IP 上限 + `SEMANTIC_RECOMMEND_ENABLED` kill switch。プロバイダ側予算アラートは手動設定 |
| P0-1c | エラー時に内部例外を返さないことを再確認 | 本番相当で 4xx/5xx ボディに stack / 鍵が出ない | **継続** 既存どおり日本語メッセージのみ（要スポット確認） |

### P0-2. 本番 Supabase RLS / 権限の実測

| ID | タスク | Done 条件 | 主な場所 |
| --- | --- | --- | --- |
| P0-2a | 本番（または本番同等）プロジェクトで 0003 適用 + `seed:rice` | VIEW `rice_catalog` が読める。銘柄数が validate と一致 | [04-database.md](./04-database.md)、`scripts/seed-rice-profiles.ts` |
| P0-2b | **anon key** で `rice_catalog` SELECT ができることを確認 | 地図が本番 URL で表示される | **手順:** [rls-verify.md](./rls-verify.md) |
| P0-2c | anon が `embedding` / `search_text` を直接読めないことを確認 | details 直 SELECT が失敗。RPC も anon 不可 | **コード完了** `0004_restrict_embedding_access.sql`（**適用と実測は人手**） |
| P0-2d | service role は Vercel サーバー env のみ。Browser バンドルに含まれない | クライアント JS に service role 文字列が無い | Vercel env、ビルド成果物 grep |

### P0-3. CI（最低ゲート）

| ID | タスク | Done 条件 | 主な場所 |
| --- | --- | --- | --- |
| P0-3a | GitHub Actions: `npm ci` → `lint` → `typecheck` → `build` | `main` / PR で必須チェックが緑 | **完了** `.github/workflows/ci.yml`（+ `validate:rice`） |
| P0-3b | CI 失敗時は merge / 本番デプロイしない運用 | branch protection またはチーム合意を文書化 | **要手動** GitHub → Settings → Branches で `main` に status check を必須化 |

### P0-4. 法務ページ（収益サイト最低限）

| ID | タスク | Done 条件 | 主な場所 |
| --- | --- | --- | --- |
| P0-4a | プライバシーポリシー（取得データ、相談 API、Cookie/分析、第三者） | `/privacy` が公開されフッターから辿れる | **完了（草案）** `src/app/privacy/page.tsx` + ヘッダー法務ナビ |
| P0-4b | 利用規約（編集評価である旨、外部 EC は各社責任、免責） | `/terms` 公開、フッターリンク | **完了（草案）** `src/app/terms/page.tsx` |
| P0-4c | アフィリエイト・広告表記（「広告を含む」等） | 購入導線付近またはフッターに常時表示 | **完了** `PURCHASE_NOTE` + SiteFooter |
| P0-4d | 特定商取引法に基づく表記（必要な場合） | `/tokushoho` または同等。事業者情報が揃う | **枠のみ** `/tokushoho`。事業者名等は公開前に埋める |
| P0-4e | 既存 DISCLAIMER（編集評価≠公的測定）を全導線で一貫 | 詳細・銘柄ページ・法務ページで矛盾なし | **完了寄り** 規約・購入注記と整合 |

### P0-5. スモーク試験（自動化または手順書 + 実施記録）

| ID | タスク | Done 条件 | 主な場所 |
| --- | --- | --- | --- |
| P0-5a | 手順書: Desktop / Mobile で地図・スライダー・今日の一膳 | 本番 URL で操作確認し結果を記録 | README「手元での確認」を本番版に拡張 |
| P0-5b | 相談「ハイボールと唐揚げに合う米」→ Top 4 + 短い返事 or フォールバック | 502 連発しない。探針が 1 位へ | `/api/rice/semantic-recommend` |
| P0-5c | `/[brand]` と品鑑パネル: 横溢れなし、購入 1 列（スマホ） | 390px 幅で横スクロール無し | PurchaseLinks、brand page |
| P0-5d | 購入 6 リンクが各 EC / ふるさと検索へ開く | 全ボタン 200 系で検索結果が出る | shared URL helpers |
| P0-5e | （推奨）Playwright 等で P0-5b〜d の最低 3 本を CI または手動ランナー化 | 失敗が検知できる | `e2e/` 等 |

### P0-6. 本番環境・デプロイ checklist

| ID | タスク | Done 条件 | 主な場所 |
| --- | --- | --- | --- |
| P0-6a | Vercel Production と Preview の env 分離 | Production のみ本番 Supabase / 本番鍵 | Vercel Dashboard |
| P0-6b | `.env.example` と本番必須変数の突合 | 欠落で起動失敗または明確な 500 | `.env.example`、[03-system-design.md](./03-system-design.md) |
| P0-6c | `EMBEDDING_PROVIDER` と DB の `embedding_model` 一致 | 相談が Top4 を返す。混在モデルで 0 件にならない | seed 再実行の有無を記録 |
| P0-6d | 独自ドメイン接続 + HTTPS | 本番ホストで証明書エラー無し | DNS / Vercel |
| P0-6e | 障害時ロールバック手順（直前デプロイへ戻す） | 1 ページの runbook | 本ファイル末尾「運用」 |

**P0 出口基準:** 上記すべて `[x]`。公開 URL で「選ぶ → 相談 → 詳細 → 外部 EC」が安全に一周できる。

---

## P1 — 公開直後〜最初の 1〜2 週間で必須（収益化サイト）

### P1-1. 収益タグと成果計測

| ID | タスク | Done 条件 | 主な場所 |
| --- | --- | --- | --- |
| P1-1a | 楽天アフィリエイト: 検索 URL にアフィパラメータ | 管理画面でクリックまたは遷移が確認できる | `shared.ts` の `rakutenUrl` / ふるさと系、env |
| P1-1b | Amazon アソシエイト（該当する場合） | タグ付き URL。未契約なら UI から Amazon を外すか「準備中」 | `amazonUrl` |
| P1-1c | Yahoo! / ふるさと納税の提携状況を確定し URL を合わせる | 契約済みチャネルのみタグ付き。未契約は表記のみ or 非表示 | PurchaseLinks |
| P1-1d | `track(rakuten_click|…)` とアフィ管理画面の突合方法を文書化 | 週次で「クリック vs 成果」を見られる | [07-roadmap.md](./07-roadmap.md) 計測節を更新可 |
| P1-1e | （任意）`RakutenAffiliateClient` を薄いタグ付与ヘルパーまで実装 | プレースホルダではなく本番 URL 生成に使われる | `src/lib/rakuten/` |

### P1-2. 分析の本番接続

| ID | タスク | Done 条件 | 主な場所 |
| --- | --- | --- | --- |
| P1-2a | GTM または GA4（または Vercel Analytics + 同等）を本番に埋設 | `dataLayer` イベントがレポートに出る | `layout.tsx`、タグマネ |
| P1-2b | 必須イベントのダッシュボード: map / slider / detail / purchase_* / language_search | 初週の CVR 概算が取れる | `src/lib/analytics.ts` のイベント一覧 |
| P1-2c | 本番では `console.debug` に依存しない | ユーザー向けコンソールが静か | analytics.ts |

### P1-3. エラー監視

| ID | タスク | Done 条件 | 主な場所 |
| --- | --- | --- | --- |
| P1-3a | Sentry（または同等）を Next フロント + API Route に接続 | 意図的 500 がダッシュボードに出る | SDK 設定、env |
| P1-3b | 相談 API 失敗率のアラート | 閾値超過で通知 | Sentry / Vercel |

### P1-4. SEO・シェア

| ID | タスク | Done 条件 | 主な場所 |
| --- | --- | --- | --- |
| P1-4a | `metadataBase` + Open Graph / Twitter | SNS 貼り付けでタイトル・説明・（可能なら）画像 | `src/app/layout.tsx`、`[brand]/page.tsx` |
| P1-4b | `app/robots.ts` + `app/sitemap.ts` | 本番ホストで sitemap に銘柄 URL が並ぶ | App Router 規約 |
| P1-4c | 銘柄ページの description / OG を銘柄ごとに妥当化 | 主要銘柄を数件人手確認 | generateMetadata |

### P1-5. ハードニング

| ID | タスク | Done 条件 | 主な場所 |
| --- | --- | --- | --- |
| P1-5a | 起動時 env 検証（不足なら fail-fast） | 必須鍵欠落でデプロイ失敗 or 明確な起動エラー | `src/lib/supabase/env.ts` 等 |
| P1-5b | 基本セキュリティヘッダ（少なくとも `X-Frame-Options` / `Referrer-Policy`、CSP は段階的） | レスポンスヘッダで確認 | `next.config.ts` |
| P1-5c | 公開前の依存関係監査（`npm audit` 方針） | Critical の扱いを決めて記録 | package-lock |

**P1 出口基準:** クリックが収益計測に繋がり、障害と導線が数字で見える。

---

## P2 — 1.0 後の成長（ここは 1.0.0 を止めない）

| ID | タスク | 備考 |
| --- | --- | --- |
| P2-1 | E2E（Playwright）を CI 常駐 | P0-5e の拡張 |
| P2-2 | a11y: `prefers-reduced-motion` 実装、主要フローのキーボード確認 | [08-ui-design.md](./08-ui-design.md) §7 |
| P2-3 | Auth / お気に入り / 履歴 | [06-requirements.md](./06-requirements.md) |
| P2-4 | Affiliate 商品検索 API・deep link | `RakutenAffiliateClient` 本実装 |
| P2-5 | grounded LLM 長文・炊飯アドバイス | 推薦式は変えない |
| P2-6 | CTA A/B、初見スコア再評価 | [07-roadmap.md](./07-roadmap.md) |
| P2-7 | PWA / インストール体験 | 任意 |
| P2-8 | 構造化ログ、レート制限の高度化（ユーザー単位等） | 運用規模に応じる |

---

## 実行バックログ（優先順・チェック用）

コピーして Issue / スプリントに貼ってよい。

### Sprint A — 安全に公開できる骨格

- [x] P0-1a レート制限（best-effort / isolate 単位）
- [x] P0-1b 日次上限 + kill switch（プロバイダ予算アラートは別途）
- [x] P0-2c migration 0004（embedding 直読み遮断）— **Supabase で SQL 実行 + [rls-verify.md](./rls-verify.md) 実測が残作業**
- [ ] P0-2a/b/d 本番 seed・anon 実測・service role 露出チェック
- [x] P0-3a CI workflow
- [ ] P0-3b branch protection（GitHub で status check 必須化）
- [ ] P0-6a〜e 本番 env・ドメイン・ロールバック
- [ ] （推奨）Vercel に `SEMANTIC_RECOMMEND_ENABLED` 等を設定

### Sprint B — 法務と品質ゲート

- [x] P0-4a〜c,e 法務草案 + アフィ表記 + DISCLAIMER
- [ ] P0-4d 特商法の事業者情報を確定して記入
- [ ] P0-5a〜d スモーク（記録付き）
- [ ] P0-5e 最低限の自動テスト（推奨）

### Sprint C — 収益と観測（1.0 同梱推奨）

- [ ] P1-1a〜d Affiliate タグ + 突合手順
- [ ] P1-2a〜c 分析接続
- [ ] P1-3a〜b Sentry
- [ ] P1-4a〜c SEO/OG/sitemap
- [ ] P1-5a〜c env 検証・ヘッダ・audit

### リリース作業

- [ ] 全 P0 + 合意した P1 が Done
- [ ] `VERSION` / `package.json` → **1.0.0**
- [ ] [10-changelog.md](./10-changelog.md) に 1.0.0 節を追加
- [ ] [00-overview.md](./00-overview.md) の「現行 MVP」を本番表現に更新
- [ ] 本番 URL で最終スモーク再実施
- [ ] （任意）社内 / 友人クローズド公開 48h → 問題なければ告知

---

## 運用 runbook（最短）

| 事態 | 初動 |
| --- | --- |
| 相談 API 大量エラー / 課金急増 | Vercel で該当デプロイをロールバック、または相談ルートを一時 503。プロバイダダッシュボードでキー制限 |
| 地図が空 | Supabase 接続・anon・seed 件数を確認。`rice_catalog` を SQL で確認 |
| 相談が 0 件 | `embedding_model` 不一致 → 再 seed または env を seed 時モデルに合わせる |
| アフィが計測されない | URL にタグが付いているか、広告ブロッカー、提携審査状態を確認 |
| 個人情報・鍵漏洩疑い | 該当キーを即ローテーション。Vercel / Supabase / Gemini / OpenAI |

---

## 関連文書

| 文書 | 役割 |
| --- | --- |
| [06-requirements.md](./06-requirements.md) | 将来要件の正本 |
| [04-database.md](./04-database.md) | スキーマ・マイグレーション |
| [05-semantic-search.md](./05-semantic-search.md) | 相談 API 仕様 |
| [07-roadmap.md](./07-roadmap.md) | UX・計測イベント |
| [01-versioning.md](./01-versioning.md) | 1.0.0 の意味 |
| [03-system-design.md](./03-system-design.md) | env・データフロー |
| ルート [README.md](../README.md) | ローカル起動・seed |

---

## 現状スナップショット（2026-08、0.2.1）

| 領域 | 状態 |
| --- | --- |
| 味わい地図・座標推薦・意味検索・銘柄詳細・購入 CTA UI | 実装済み |
| Mobile 横溢れ・購入 1 列・探針ランダム・プレビュー拡大 | 0.2.1 済み |
| `track()` イベント配線 | 済み（受け皿未接続） |
| Rate limit / CI / 法務ページ / Affiliate タグ / Sentry / OG・sitemap | **未着手** |
| Auth / お気に入り / Affiliate 商品 API | 1.0 後（P2） |
