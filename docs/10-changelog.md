# 変更履歴

[Semantic Versioning](./01-versioning.md) に従う。現在の番号は [`VERSION`](../VERSION)。

見出し日付は発版日（`YYYY-MM-DD`）。旧版は VERSION を上げた commit 日で遡及記入。

## Unreleased

## 0.8.1 — 2026-08-31

- ホーム地図が短辺 &lt; 280px で Top 4 だけ描いて「米粒が消えた」ように見えていたのを修正。点は常に全件表示し、小画面は縮小・淡化のみ
- 探針に No.1 があるだけでは雲全体を薄くしない（明示選択時のみ）

## 0.8.0 — 2026-08-31

- 案内役を **侍米師（じべいし）** に改称。画面・meta・OG・相談 CTA・メモ見出しから「米ソムリエ」を除去（登録商標「お米ソムリエ」との称呼衝突を避ける）
- 指定読みは音読み統一の **じべいし**（姉妹・仕舞いとの同音混同を避ける）。頂栏副題は読みを併記
- 利用規約に資格・認定制度と無関係である旨を明記
- 正本定数は `src/lib/brand/guideRole.ts`

## 0.7.0 — 2026-08-31

- 内部观测台 `/ops`：密钥 `OPS_DASHBOARD_SECRET` + HttpOnly HMAC cookie（Edge Web Crypto），服务端聚合 `access_events`
- 看板：购入率 / 咨询率、JST 日趋势、ふるさと按按钮文案拆渠道、recharts
- 未配置密钥时整面 404；`robots` / sitemap 隔离；login 10/min、summary 30/min；client bundle 扫描 ops 密钥
- `/ops` 不写入 `access_events`、不加载 GTM
- 本机 localhost、Preview、已登录观测台的浏览器不再写入 `access_events`
- 看板按通販 / ふるさと分网站计数；说明改成给使用者看的段落
- ふるさと搜索改走现行楽天モール検索・Yahoo!ショッピング検索（旧 `/furusato/search`、`furusato.yahoo.co.jp` 已失效）

## 0.6.1 — 2026-08-31

- ホームと `/library` の頂栏を完全同一化（副題は常に「米ソムリエ」、高さ `h-12`）
- Library の実心背景を外し、本文と同じ紙感グラデを透かす
- ライブラリ lead を1文に整え、変な折り返しを解消
- `scrollbar-gutter: stable` でスクロールバーの有無による頂栏横ずれを防ぐ
- 文書を 0.6.x に同期（購入タグ UI・`/library/[id]` 正本・チェックリスト）。SC 向け [16-tech-stack.md](./16-tech-stack.md) を追加

## 0.6.0 — 2026-08-31

- お店カプセルを全画面で軟色に統一。通販 / ふるさと納税のタグ切替。各 3 店は等幅の縦一列（楽天→Yahoo→Amazon / さとふる）
- モール色は各社公式色相の軟色（楽天は暗め赤、Yahoo は明るめピンク赤、Amazon 金、さとふる緑）
- 楽天ふるさと・Yahoo!ふるさとの検索導線を追加。Amazon は在庫 API 未接続のため検索フォールバックのまま

## 0.5.6 — 2026-08-31

- 地図と `/library` の版心を `SITE_COLUMN`（`max-w-[1440px]`）に統一。ヘッダーと本文が横位置で揃う
- `/library` の検索向けリードから「公的測定ではありません」を外し、meta を招待文に。味わい免責はフッターのまま
- 広告開示を最小化: CTA 横は ※PR、Amazon 定型・短 PR・楽天クレジットはフッター一箇所。ASP 名は利用規約のみ
- 開示の正本を `docs/15-disclosure-surfaces.md` に固定（文案は `src/lib/affiliate.ts`）
- Desktop 右レール: 外側の微妙な縦スクロールバーを消し、一覧だけ内側スクロール（バー非表示）。お店 CTA は下端に固定
- 地図のテイスティングラベルは同時に 1 枚だけ（hover / 選択 / No.1 の優先順）

## 0.5.5 — 2026-08-31

- ホーム / ライブラリの頂栏を `SiteHeader` に統一（ナビ順: 味わいの地図 → ライブラリ、現在ページを強調）
- e2e: 銘柄名 heading を `h1` に限定（購入カード見出しとの strict 衝突を解消）

## 0.5.4 — 2026-08-31

- 銘柄詳細を `/library/[id]` 一冊に統合（品鑑＋由来＋季節・酒＋炊飯）。旧 `/{id}` は永久リダイレクト
- ライブラリヘッダーをホームと同じ版心に揃え、味わい輪郭の縦書き崩れを修正
- 地図ダイアログの深掘り導線をライブラリ一本に

## 0.5.3 — 2026-08-31

- （0.5.4 で統合）品鑑とライブラリの役割分離を試行

## 0.5.2 — 2026-08-31

- 相談返事 Gemini: `3.5-flash` 優先 → Lite フォールバック（品質優先。百科バッチは従来どおり Lite 優先）
- 相談 embedding 429 短リトライ；CF 質詢で JSON 失敗時の UI メッセージ
- `sitemap.xml` に `/library` と事典 URL；フッター Somme Atlas リンク
- `vercel-production.md` §5–7（ドメイン・CF 防御。相談 POST 全量托管质询は非推奨）

## 0.5.1 — 2026-08-31

- Gemini 事典を Flash-Lite 起点で 106 銘柄まで充足（無料枠はモデル別。`3.6` / `3.5` Flash 枯渇時は Lite へフォールバック）
- ホーム地図は従来どおり一膳選びに留め、品鑑は炊飯をライブラリから引用、ライブラリはソムリエ品鑑を引用。ダイアログは一行の事典導線のみ
- `encyclopedia:audit` で catalog スコア・禁止語・相性との衝突を検査

## 0.5.0 — 2026-08-30

### 銘柄ライブラリ

- `/library` 可視化事典（検索・地域フィルタ・カード一覧）と `/library/[id]` 詳細
- 構造化記事生成 `npm run encyclopedia:generate`（`--mode=template|gemini|auto`。禁止語フィルタ・catalog 根拠・円金額非記載）
- Gemini 無料枠がある日は上書き生成、枠切れ時は template で 106 銘柄を完走可能
- ホームヘッダーから「ライブラリ」へ導線

### 運営

- `npm run inventory:audit`：全銘柄の楽天 / Yahoo 公式 API 在庫監査。詳細 JSON は gitignore、ギャップ表のみ `scripts/data/shop-inventory-gaps.md`（商品ペイロード非公開）

## 0.4.4 — 2026-08-30

### UX

- ホーム「お店で探す」展開後の 4 モールを、色相はそのまま彩度だけ少し落とした実心ボタンに（Modal / 銘柄ページはフル彩度のまま）
- Mobile: 折りたたみ店舗帯を地図の直後・相談カードの上へ（選んだ銘柄への近道）

## 0.4.3 — 2026-08-30

### UX

- ホーム購入を Sommelier-first に再設計: 既定は「お店で探す」のみ。展開後はモール色 4 ボタン＋※PR（線枠トーンは採用せず）
- Mobile は地図・相談の後に購入帯。Desktop は近傍銘柄の下に折りたたみ

## 0.4.2 — 2026-08-30

### 試験

- 試験式样书 `docs/test-specification.md`（TS-*）
- Vitest 単体 + Playwright E2E（Desktop/Mobile）+ CI ゲート + `docs/test-results.md` 生成

### UX

- 相談失敗時、API の日本語 `message`（kill-switch の一時停止文を含む）をフォームに出す

### 運営

- GitHub Issue テンプレ（bug / feature / task）と PR テンプレ
- Cursor rule `project-workflow.mdc`：本仓工作流；PMO 交付工具迁出独立仓 `pmo-kit`

## 0.4.1 — 2026-08-30

### UX

- 「購入候補」をやめ、ホーム右レールに「取扱オンラインショップ」4 モール入口＋※PR のみ（Amazon 定型文・楽天 Developers クレジットは購入カード／フッター側）
- 詳細 CTA は「くわしく見る」、下部カード見出しは「お店で探す」

### 法務

- `/tokushoho` に運営事業者・責任者・連絡先等を記入（アフィリエイト案内サイトである旨を明記）

## 0.4.0 — 2026-08-30

### 購入

- 推薦カード `RiceProductCard`：Amazon / 楽天 / Yahoo! / さとふるの 4 CTA。Amazon は Associate Tag、楽天・Yahoo は API があれば商品 URL、なければ検索。さとふるは VC 自由転鎖を予約
- Amazon 運営規約第 5 条の定型文をカードとフッターに常時表示。景表法・VC 向けに「アフィリエイト広告」と明示。楽天 API 利用に公式クレジット（HTML 未改変）。外链 `rel="noopener noreferrer nofollow"`
- 楽天 API の商品名・価格はカードに出さない（href のみ）。手順は [13-affiliate-compliance.md](./13-affiliate-compliance.md)
- 楽天アフィ包装と ValueCommerce 転鎖は登録済み Production のみ（Preview は素の検索 URL）

### ドキュメント

- [14-affiliate-programs.md](./14-affiliate-programs.md): Amazon / 楽天ウェブサービス / パートナー規約・ガイドライン / ValueCommerce / ポイントクラブ
- [13-affiliate-compliance.md](./13-affiliate-compliance.md): 楽天 API と他モール共存の隔離設計
- 現在バージョンの正本を `VERSION` / `package.json` に限定。他 md は番号を手書きしない。`package-lock.json` は `npm install` で同期し、手で編集しない
- [12-product-journey.md](./12-product-journey.md) / [12-product-journey.ja.md](./12-product-journey.ja.md): 構想から現行までの振り返り（中国語 / 日本語）

## 0.3.0 — 2026-08-28

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

## 0.2.1 — 2026-08-28

### Mobile UX

- 銘柄品鑑・`/[brand]` の横溢れを抑制（`min-w-0`、指標 2 列）
- 購入リンク: スマホは 1 列、`sm+` は 2 行 × 3 列
- 初期探針をセッションごとにランダム（正中心を避ける）
- 地図プレビューを拡大（約 42svh）、点の間引きを緩和、初回ヒントをモバイルにも表示
- 今日の一膳 → 地図の順序は維持

## 0.2.0 — 2026-08-28

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

## 0.1.0 — 2026-08-28

- MVP 初版: 味わいマップ、座標推薦 Top 4、意味検索 API
- V2 カタログ（derive + dedup）、Supabase 3 テーブル + `rice_catalog` VIEW
- Flavor Bridge、米ソムリエ短い返事
- UI デザイン正本、Grain + Tasting Probe アイコン

## それ以前

- V2 カタログ設計、意味検索 API、UI デザイン正本の策定（当時の草案は整理のため削除）
