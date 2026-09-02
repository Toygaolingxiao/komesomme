# 本番リリース・チェックリスト（収益化サイト）

対象: **B）アフィリエイト収益を伴う正式サイト**。  
現状: 体験・防護・自前アクセス記録・法務草案（特商法含む）・購入 UI（通販 / ふるさとタグ＋各 3 店）・独自ドメイン `komesomme.jp`・CI（unit/e2e）は入った。GTM ID 本番接続・VC 本番 SID・branch protection・スモーク人手記録・アフィ突合などが残。番号は [`VERSION`](../VERSION)。  
ゴール: SemVer **1.0.0** — [01-versioning.md](./01-versioning.md) / [06-requirements.md](./06-requirements.md) §3。

使い方: 各タスクの `[ ]` を完了したら `[x]`。完了条件（Done）を満たすまで次フェーズへ進まない。

---

## 0. 前提とスコープ

| 項目 | 決定 |
| --- | --- |
| 公開形態 | ゲスト利用可（Auth は 1.0 必須ではない） |
| 収益 | 楽天 / Yahoo / Amazon / ふるさと納税の **検索 CTA + Affiliate タグ** |
| 分析 | 既存 `track()`（`src/lib/analytics/`）を GTM/GA4 等へ接続 |
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
| P0-1c | エラー時に内部例外を返さないことを再確認 | 本番相当で 4xx/5xx ボディに stack / 鍵が出ない | **確認済** JSON は日本語 `message` のみ。詳細は `console.error` |

### P0-2. 本番 Supabase RLS / 権限の実測

| ID | タスク | Done 条件 | 主な場所 |
| --- | --- | --- | --- |
| P0-2a | 本番（または本番同等）プロジェクトで 0003 適用 + `seed:rice` | VIEW `rice_catalog` が読める。銘柄数が validate と一致 | **実測済**（2026-08、catalog / regions 応答確認） |
| P0-2b | **anon key** で `rice_catalog` SELECT ができることを確認 | 地図が本番 URL で表示される | **実測済** + サイト地図・相談 OK |
| P0-2c | anon が `embedding` / `search_text` を直接読めないことを確認 | details 直 SELECT が失敗 | **実測済** `42501 permission denied` |
| P0-2d | service role は Vercel サーバー env のみ。Browser バンドルに含まれない | クライアント JS に service role 文字列が無い | **CI スキャン済** `assert:client-bundle`。anon JWT が service_role なら起動失敗。本番 Network は Redeploy 後に人手 |

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
| P0-4c | アフィリエイト・広告表記（Amazon 第 5 条 + 景表法 PR） | CTA 横は ※PR。定型はフッター（ホームは 100dvh のためフッターなし） | **完了** 表面は [15-disclosure-surfaces.md](./15-disclosure-surfaces.md) |
| P0-4d | 特定商取引法に基づく表記（必要な場合） | `/tokushoho` または同等。事業者情報が揃う | **完了（草案）** `/tokushoho`。運営事務局・責任者・県名・メールを記載。詳細住所・電話は請求時開示 |
| P0-4e | 既存 DISCLAIMER（編集評価≠公的測定）を全導線で一貫 | 詳細・銘柄ページ・法務ページで矛盾なし | **完了寄り** 規約・購入注記と整合 |

### P0-5. スモーク試験（自動化または手順書 + 実施記録）

| ID | タスク | Done 条件 | 主な場所 |
| --- | --- | --- | --- |
| P0-5a | 手順書: Desktop / Mobile で地図・スライダー・今日の一膳 | 本番 URL で操作確認し結果を記録 | **手順書:** [smoke-test.md](./smoke-test.md)（実施記録は人手） |
| P0-5b | 相談「ハイボールと唐揚げに合う米」→ Top 4 + 短い返事 or フォールバック | 502 連発しない。探針が 1 位へ | `/api/rice/semantic-recommend` |
| P0-5c | `/library/[id]` と品鑑パネル: 横溢れなし、購入縦一列（スマホ） | 390px 幅で横スクロール無し。旧 `/{id}` は 301 | `ShopLinksStrip`、library dossier |
| P0-5d | 購入 6 リンクが各 EC / ふるさと検索へ開く | 全ボタン 200 系で検索結果が出る | shared URL helpers |
| P0-5e | Playwright 等で P0-5b〜d の最低 3 本を CI または手動ランナー化 | 失敗が検知できる | **完了** `e2e/` + Vitest + CI。式样 [test-specification.md](./test-specification.md) |

### P0-6. 本番環境・デプロイ checklist

| ID | タスク | Done 条件 | 主な場所 |
| --- | --- | --- | --- |
| P0-6a | Vercel Production と Preview の env 分離 | Production のみ本番 Supabase / 本番鍵 | **手順書:** [vercel-production.md](./vercel-production.md)（Dashboard 作業は人手） |
| P0-6b | `.env.example` と本番必須変数の突合 | 欠落で起動失敗または明確な 500 | **手順書あり** `.env.example` + vercel-production |
| P0-6c | `EMBEDDING_PROVIDER` と DB の `embedding_model` 一致 | 相談が Top4 を返す。混在モデルで 0 件にならない | 相談が既に通っていれば実質 OK。切替時は再 seed |
| P0-6d | 独自ドメイン接続 + HTTPS | 本番ホストで証明書エラー無し | **完了** `komesomme.jp`（[vercel-production.md](./vercel-production.md) §5） |
| P0-6e | 障害時ロールバック手順（直前デプロイへ戻す） | 1 ページの runbook | **文書化済** vercel-production §4 + 本ファイル「運用」 |

**P0 出口基準:** 上記すべて `[x]`。公開 URL で「選ぶ → 相談 → 詳細 → 外部 EC」が安全に一周できる。

---

## P1 — 公開直後〜最初の 1〜2 週間で必須（収益化サイト）

### P1-1. 収益タグと成果計測

| ID | タスク | Done 条件 | 主な場所 |
| --- | --- | --- | --- |
| P1-1a | 楽天アフィリエイト: 検索 URL にアフィパラメータ | 管理画面でクリックまたは遷移が確認できる | **コード済** `wrapRakutenAffiliateUrl` + `NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID` |
| P1-1b | Amazon アソシエイト | タグ付き検索 URL + 第 5 条定型文。未契約なら UI から外す | **コード済** `amazonSearchUrl` + `AMAZON_ASSOCIATE_DISCLOSURE` |
| P1-1c | Yahoo! / さとふるの ValueCommerce | — | **廃止**（2026-09）。VC 再申請しない。Yahoo は公式短鎖 / プレーン検索。記録は [17-valuecommerce-reapply.md](./17-valuecommerce-reapply.md) |
| P1-1d | `track(rakuten_click|…)` とアフィ管理画面の突合方法を文書化 | 週次で「クリック vs 成果」を見られる | [07-roadmap.md](./07-roadmap.md) 計測節を更新可 |
| P1-1e | 楽天 Item Search + クレジット | href のみ（商品名・価格は出さない）。公式クレジット表示 | **コード済** `shop-links` + `src/lib/rakuten/credit.ts`。隔離の次段は [13](./13-affiliate-compliance.md) §4 |

### P1-2. 分析の本番接続

| ID | タスク | Done 条件 | 主な場所 |
| --- | --- | --- | --- |
| P1-2a | GTM または GA4（または Vercel Analytics + 同等）を本番に埋設 | `dataLayer` イベントがレポートに出る | **コード済** `GtmSnippet` + `track()`。本番は `NEXT_PUBLIC_GTM_ID` を入れ GTM 内で GA4 接続 |
| P1-2b | 必須イベントのダッシュボード: map / detail / purchase_* / language_search | 初週の CVR 概算が取れる | **内部完了** `/ops`（`OPS_DASHBOARD_SECRET`）。GA4 看板は P1-2a 後 |
| P1-2c | 本番では `console.debug` に依存しない | ユーザー向けコンソールが静か | `src/lib/analytics/` |

### P1-3. エラー監視

| ID | タスク | Done 条件 | 主な場所 |
| --- | --- | --- | --- |
| P1-3a | Sentry（または同等）を Next フロント + API Route に接続 | 意図的 500 がダッシュボードに出る | SDK 設定、env |
| P1-3b | 相談 API 失敗率のアラート | 閾値超過で通知 | Sentry / Vercel |

### P1-4. SEO・シェア

| ID | タスク | Done 条件 | 主な場所 |
| --- | --- | --- | --- |
| P1-4a | `metadataBase` + Open Graph / Twitter | SNS 貼り付けでタイトル・説明・（可能なら）画像 | **完了** `layout.tsx` + `opengraph-image.tsx`。`NEXT_PUBLIC_SITE_URL` 推奨 |
| P1-4b | `app/robots.ts` + `app/sitemap.ts` | 本番ホストで sitemap に銘柄 URL が並ぶ | **完了** `src/app/robots.ts` / `sitemap.ts` |
| P1-4c | 銘柄ページの description / OG を銘柄ごとに妥当化 | 主要銘柄を数件人手確認 | **コード済** `generateMetadata`。SNS プレビューの人手確認はスモーク時 |

### P1-5. ハードニング

| ID | タスク | Done 条件 | 主な場所 |
| --- | --- | --- | --- |
| P1-5a | 起動時 env 検証（不足なら fail-fast） | 必須鍵欠落でデプロイ失敗 or 明確な起動エラー | **完了** `src/instrumentation.ts`（Production）。anon に service_role JWT なら起動失敗 |
| P1-5b | 基本セキュリティヘッダ（少なくとも `X-Frame-Options` / `Referrer-Policy`、CSP は段階的） | レスポンスヘッダで確認 | **完了（CSP 以外）** `next.config.ts`。CSP は GTM/Sentry 導入時 |
| P1-5c | 公開前の依存関係監査（`npm audit` 方針） | Critical の扱いを決めて記録 | **方針記録済（2026-08）** Critical は公開ブロック。現状 `next` 同梱 postcss が High。`audit fix --force` は Next 16 破壊的アップのため見送り |

**P1 出口基準:** クリックが収益計測に繋がり、障害と導線が数字で見える。

---

## P2 — 1.0 後の成長（ここは 1.0.0 を止めない）

| ID | タスク | 備考 |
| --- | --- | --- |
| P2-1 | E2E シナリオ拡張（`@live` 相談・更多ブラウザ） | **CI 常駐は完了**（P0-5e）。ここはカバレッジ増分 |
| P2-2 | a11y: `prefers-reduced-motion` 実装、主要フローのキーボード確認 | [08-ui-design.md](./08-ui-design.md) §7 |
| P2-3 | Auth / お気に入り / 履歴 | [06-requirements.md](./06-requirements.md) |
| P2-4 | Affiliate 商品検索 API・deep link | `RakutenAffiliateClient` 本実装 |
| P2-5 | grounded LLM 長文・炊飯アドバイス | 推薦式は変えない |
| P2-6 | CTA A/B、初見スコア再評価 | [07-roadmap.md](./07-roadmap.md) |
| P2-7 | PWA / インストール体験 | 任意 |
| P2-8 | 構造化ログ、レート制限の高度化（ユーザー単位等） | 運用規模に応じる |
| P2-9 | 今日の一膳（日付シードの軽推薦） | [08-ui-design.md](./08-ui-design.md) §5「ライブラリの発見」。売り込み口調にしない |
| P2-10 | 季節・用途の編集特集（月次コレクション） | 同上。自動量産しない |
| P2-11 | 銘柄手描きイラスト本番接続 | [18-brand-illustration.md](./18-brand-illustration.md)。スパイク承認後 |

---

## 実行バックログ（優先順・チェック用）

コピーして Issue / スプリントに貼ってよい。

### Sprint A — 安全に公開できる骨格

- [x] P0-1a レート制限（best-effort / isolate 単位）
- [x] P0-1b 日次上限 + kill switch（プロバイダ予算アラートは別途）
- [x] P0-2a/b/c anon 実測完了（0004 + 地図・相談 OK）
- [x] P0-2d CI で client bundle をスキャン（本番 Network は Redeploy 後）
- [x] P0-3a CI workflow
- [ ] P0-3b branch protection（GitHub で status check 必須化）
- [x] P0-6 手順書 + ロールバック文書（[vercel-production.md](./vercel-production.md)）
- [ ] P0-6a/b Dashboard で env を Production に投入・突合（`NEXT_PUBLIC_SITE_URL` 含む）
- [x] P0-6d 独自ドメイン `komesomme.jp`
- [x] P1-5a/b env fail-fast + 基本セキュリティヘッダ
- [x] （推奨）Vercel に `SEMANTIC_RECOMMEND_ENABLED` / `NEXT_PUBLIC_SITE_URL` を設定（本番運用中）

### Sprint B — 法務と品質ゲート

- [x] P0-4a〜c,e 法務草案 + アフィ表記 + DISCLAIMER
- [x] P0-4d 特商法の事業者情報を確定して記入
- [x] P0-5a 手順書（[smoke-test.md](./smoke-test.md)）
- [ ] P0-5b〜d スモーク実施と記録（人手）
- [x] P0-5e 最低限の自動テスト（推奨）

### Sprint C — 収益と観測（1.0 同梱推奨）

- [ ] P1-1a〜d Affiliate タグ + 突合手順
- [x] P1-2a GTM 埋込 + Supabase `access_events`（GA4 は GTM 側設定が人手）
- [ ] P1-2b〜c ダッシュボード確認・本番 console 静音確認
- [ ] P1-3a〜b Sentry
- [x] P1-4a〜b SEO/OG/sitemap（銘柄 OG の SNS 人手確認はスモーク時）
- [x] P1-5a〜b env 検証・ヘッダ
- [x] P1-5c `npm audit` 方針記録（Critical なし。next 同梱 postcss High は Next 16 強制アップを見送り）

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
| [vercel-production.md](./vercel-production.md) | Vercel env・ロールバック |
| [smoke-test.md](./smoke-test.md) | 本番スモーク手順 |
| [rls-verify.md](./rls-verify.md) | RLS / anon 実測 |

---

## 現状スナップショット（2026-08）

| 領域 | 状態 |
| --- | --- |
| 味わい地図・座標推薦・意味検索・銘柄詳細・購入 CTA UI | 実装済み |
| Mobile 横溢れ・購入 1 列・探針ランダム・プレビュー拡大 | 0.2.1 済み |
| 味わい再校正 + `access_events` / GTM コード | 0.3.0 済み（`NEXT_PUBLIC_GTM_ID` は未設定） |
| Rate limit / CI / 法務草案 / RLS 0004 / セキュリティヘッダ / OG・sitemap / 独自ドメイン | 実装済み |
| 購入 UI（通販 / ふるさとタグ）・楽天/Amazon タグ配線 | 実装済み。**VC 本番 SID・成果突合は未** |
| GTM 埋込 / GA4 実連 / Sentry | コード済み or **未**（GTM ID・GA4・Sentry は人手） |
| Auth / お気に入り / Affiliate 商品 API | 1.0 後（P2） |
