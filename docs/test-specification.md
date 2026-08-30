# KomeSomme 試験式样书（Test Specification）

版: **TS-1.0** · 対象製品: [`VERSION`](../VERSION) · 自動実行: Playwright E2E + Vitest  
関連: [smoke-test.md](./smoke-test.md) · [11-launch-checklist.md](./11-launch-checklist.md) · P0-5e

本文は**試験設計の正本**。ケース ID（`TS-*`）は自動テスト名・結果レポートと対応する。

---

## 0. 試験方針

| 項目 | 内容 |
| --- | --- |
| 目的 | 主要ユーザー導線の回帰防止、P0 スモークの自動化、CI ゲート |
| レベル | L1 単体（純関数）/ L2 E2E（Chromium）/ L3 手動（本番のみ・本式样の「手動」列） |
| 環境 | CI / ローカル: 静的 catalog 可。相談 API は既定で kill-switch（`SEMANTIC_RECOMMEND_ENABLED=false`）し、**劣化メッセージ**を検証。本番 live 相談は手動または `@live` |
| ブラウザ | Chromium（Desktop 1280×800 / Mobile 390×844） |
| 合否 | 自動: exit 0。レポート: `docs/test-results.md`（実行後生成） |

### 優先度

| 記号 | 意味 |
| --- | --- |
| P0 | 公開ブロッカー相当（壊れたらリリースしない） |
| P1 | 収益・観測・法務周辺 |
| P2 | 体験強化・将来 |

---

## 1. 機能カバレッジマトリクス

| 領域 | ケース ID | 優先 | 自動 | 手動 |
| --- | --- | --- | --- | --- |
| ホーム地図・座標推薦 | TS-HOME-01〜05 | P0 | ✓ | |
| スライダー連動 | TS-HOME-06〜07 | P0 | ✓ | |
| 今日の一膳 / レール | TS-HOME-08〜10 | P0 | ✓ | |
| 相談（劣化モード） | TS-CONSULT-01〜02 | P0 | ✓ | |
| 相談（live） | TS-CONSULT-03 | P0 | 任意 `@live` | ✓ 本番 |
| 品鑑オーバーレイ | TS-DETAIL-01〜03 | P0 | ✓ | |
| 銘柄ページ | TS-BRAND-01〜04 | P0 | ✓ | |
| 銘柄ライブラリ | TS-LIBRARY-01〜03 | P1 | ✓ | |
| 購入 4 CTA | TS-BUY-01〜04 | P0 | ✓ | ✓ 実クリック |
| 法務ページ | TS-LEGAL-01〜03 | P0 | ✓ | |
| SEO / robots | TS-SEO-01〜02 | P1 | ✓ | |
| セキュリティ見た目 | TS-SEC-01〜02 | P0 | ✓ | |
| 解析耐性 | TS-ANALYTICS-01 | P1 | ✓ | |
| Mobile レイアウト | TS-MOBILE-01〜03 | P0 | ✓ | |
| 純関数（座標・URL） | TS-UNIT-01〜04 | P0 | ✓ Vitest | |

---

## 2. 詳細ケース

### 2.1 ホーム · 地図 / 座標（Desktop）

#### TS-HOME-01 トップが描画される
- **前置:** `/` を Desktop で開く  
- **手順:** ロード完了を待つ  
- **期待:** `#matrix` 可視。空の致命エラーパネルが主面を占拠しない  
- **自動:** `e2e/home.spec.ts`

#### TS-HOME-02 地図に銘柄点が存在する
- **期待:** 味わい地図キャンバス内に複数の点（またはプロフィールノード）が存在する  
- **自動:** ノード / プロット要素数 ≥ 1（実装セレクタに追従）

#### TS-HOME-03 「今日の一膳」No.1 が表示される
- **期待:** 文言「今日の一膳」と銘柄名（serif 見出し相当）が表示される

#### TS-HOME-04 甘みスライダーで No.1 が変わりうる
- **手順:** `#km-sweetness` を極端値へ変更し短時間待つ  
- **期待:** レール No.1 の銘柄テキストが変化する**または**スコア/理由が更新される（同一銘柄が最適の場合は変化なしを許容し、少なくとも UI が応答する）

#### TS-HOME-05 粒感スライダーが操作可能
- **手順:** `#km-hardness` を変更  
- **期待:** 値変更後もページがクラッシュせずレールが残る

#### TS-HOME-06 / TS-HOME-07（スライダー境界）
- **期待:** min/max 付近でも例外なし（コンソール error の致命的 React crash なし）

#### TS-HOME-08 レールに近傍銘柄リスト
- **期待:** 「近い味わいの銘柄」または相談モード相当のリスト領域が存在する（銘柄数 ≥ 1）

#### TS-HOME-09 くわしく見る / カードで詳細が開く
- **手順:** 今日の一膳カードをクリック  
- **期待:** 品鑑ダイアログ / パネルが開く（閉じる操作可能）

#### TS-HOME-10 お店で探す（※PR・Progressive Disclosure）
- **期待:** ホームに「お店で探す」。初期は 4 モールリンクが非表示。展開後に Amazon / 楽天 / Yahoo / さとふる（モール色・ホームは微減彩度）と ※PR。Amazon 定型文の長文はホームに**無い**。Mobile では地図の後・相談の前

---

### 2.2 相談

#### TS-CONSULT-01 kill-switch 時の安全劣化（CI 既定）
- **前置:** `SEMANTIC_RECOMMEND_ENABLED=false`  
- **手順:** `#km-query` に「ハイボールと唐揚げに合う米」→ 送信  
- **期待:** 地図は使えるまま。ユーザー向け日本語の一時停止 / 不可メッセージ。スタックトレースや鍵が UI に出ない

#### TS-CONSULT-02 例句チップが入力に入る
- **手順:** 例句ボタンを押す  
- **期待:** `#km-query` に例句テキストが入る

#### TS-CONSULT-03 live 意味検索（手動 / `@live`）
- **前置:** 本番相当キー + enabled  
- **期待:** Top4 + 短い返事またはフォールバック。探針が 1 位へ（[smoke-test.md](./smoke-test.md) B）

---

### 2.3 品鑑オーバーレイ / 銘柄ページ

#### TS-DETAIL-01 オーバーレイに主要ブロック
- **期待:** 銘柄名・ソムリエ系説明・購入導線のいずれかが可視

#### TS-DETAIL-02 銘柄ページへ遷移
- **手順:** 「詳しく見る」系リンク  
- **期待:** URL が `/[brand]` 形式

#### TS-BRAND-01 静的銘柄ページ 200
- **手順:** カタログ既知 ID（例: ソース上の安定 ID）を開く  
- **期待:** 200、銘柄名表示

#### TS-BRAND-02 `#km-purchase` と 4 CTA
- **期待:** Amazon / 楽天 / Yahoo! / さとふる。フル開示（Amazon 定型 + アフィリエイト広告 + Rakuten Developers）

#### TS-BRAND-03 類似銘柄リンク
- **期待:** 類似があれば内部リンクで他銘柄へ

#### TS-BRAND-04 Mobile 横溢れなし
- **viewport:** 390×844  
- **期待:** `document` 横スクロール幅 ≈ innerWidth（許容 1px）

#### TS-LIBRARY-01 `/library` が描画される
- **期待:** 「銘柄ライブラリ」見出し、または記事未生成時の準備中  
- **自動:** `e2e/library.spec.ts`

#### TS-LIBRARY-02 統合事典が品鑑＋百科を一ページに出す
- **手順:** `/library/yumepirika`  
- **期待:** 米ソムリエメモ、由来、季節と飲み物、炊飯。catalog `description` を origin に再掲しない

#### TS-LIBRARY-03 旧 `/{id}` がライブラリへリダイレクト
- **手順:** `/yumepirika`  
- **期待:** URL が `/library/yumepirika` になり、銘柄見出しが表示される

---

### 2.4 購入リンク

#### TS-BUY-01〜04 各モール href 形状
| ID | チャネル | 期待（非 Production wrap 可） |
| --- | --- | --- |
| TS-BUY-01 | Amazon | `amazon.co.jp` を含む。tag は env 依存 |
| TS-BUY-02 | 楽天 | `rakuten.co.jp` または `hb.afl.rakuten.co.jp` |
| TS-BUY-03 | Yahoo | `shopping.yahoo.co.jp` または VC |
| TS-BUY-04 | さとふる | `satofull.jp` または VC |
- **共通:** `rel` に `noopener` / `nofollow`  
- **自動:** href アサートのみ（外部 EC への実ナビは手動）

---

### 2.5 法務 / SEO / セキュリティ

#### TS-LEGAL-01〜03
- `/privacy` `/terms` `/tokushoho` が 200、見出し相当テキスト、フッターまたは戻る導線

#### TS-SEO-01 `/sitemap.xml` に `/` と銘柄 URL
#### TS-SEO-02 `/robots.txt` が sitemap を指し `/api/` を拒否

#### TS-SEC-01 応答ヘッダ
- `X-Frame-Options: SAMEORIGIN`（または同等）  
- `X-Content-Type-Options: nosniff`

#### TS-SEC-02 クライアントに service_role が無い
- 既存 `assert:client-bundle`（CI）+ ページ HTML/主要 bundle に文字列無し

#### TS-ANALYTICS-01
- analytics API を route mock で 500 にしてもホーム操作可能

---

### 2.6 Mobile

#### TS-MOBILE-01 今日の一膳が地図より上
#### TS-MOBILE-02 横溢れなし（ホーム）
#### TS-MOBILE-03 フルスクリーン地図を開ける（ボタンがあれば）

---

### 2.7 単体（Vitest）

| ID | 対象 | 期待 |
| --- | --- | --- |
| TS-UNIT-01 | `clamp` / `normalizeTasteValue` | 境界・NaN |
| TS-UNIT-02 | `hardnessToDisplayY` 往復 | 表示 Y と硬度の整合 |
| TS-UNIT-03 | `calculateDisplayScore` | 距離→45〜100 |
| TS-UNIT-04 | `shopQuery` / `amazonSearchUrl` | クエリ結合・URL |

---

## 3. トレーサビリティ（Checklist 対応）

| Checklist | 式样 |
| --- | --- |
| P0-5a | TS-HOME-* / TS-MOBILE-* |
| P0-5b | TS-CONSULT-* |
| P0-5c | TS-BRAND-* / TS-DETAIL-* |
| P0-5d | TS-BUY-* |
| P0-5e | 本式样の自動一式 |
| P0-2d / P1-5b | TS-SEC-* |
| P1-4b | TS-SEO-* |

---

## 4. 実行コマンド

```bash
npm run test:unit
npm run build   # e2e 前（CI は webServer で実施）
npm run test:e2e
npm run test    # unit + e2e
```

結果レポート生成: `npm run test:report`（または e2e 後処理）。

---

## 5. 改訂履歴

| 版 | 日付 | 内容 |
| --- | --- | --- |
| TS-1.0 | 2026-08-30 | 初版。Playwright + Vitest + CI 対応 |
