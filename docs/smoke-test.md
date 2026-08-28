# 本番スモーク試験（P0-5）

本番（または Preview）URL で実施する。結果は下の記録欄に日付と URL を残す。

対象 URL: ________________  
実施日: ________________  
端末: Desktop / iPhone / Android（該当を残す）

## A. 地図と今日の一膳（Desktop + Mobile）

- [ ] 味わいの地図に点が表示される（空地図ではない）
- [ ] 探針またはスライダーを動かすと「今日の一膳」の No.1 が最近傍になる
- [ ] Mobile: ページ全体が横に溢れない（390px 幅で横スクロール無し）

## B. 米ソムリエに相談（P0-5b）

入力: `ハイボールと唐揚げに合う米`

- [ ] Top 4 が返る（502 が連発しない）
- [ ] 短い返事がある、または Flavor Bridge のフォールバック文
- [ ] 探針が 1 位の銘柄付近へ動く

失敗時: Vercel の相談ルートログ、`SEMANTIC_RECOMMEND_ENABLED`、embedding モデルと seed の一致を確認。

## C. 銘柄ページ（P0-5c）

`/[brand]` を 1 件開く（例: カタログにある任意の ID）。

- [ ] 品鑑パネルが読める
- [ ] Mobile で横溢れなし
- [ ] 購入リンクがスマホでは 1 列

## D. 購入 6 リンク（P0-5d）

各ボタンが検索結果ページを開く（アフィタグは週末以降でよい）。

| チャネル | 結果 |
| --- | --- |
| 楽天市場 | |
| Yahoo!ショッピング | |
| Amazon | |
| 楽天ふるさと | |
| Yahoo!ふるさと | |
| ふるさと納税（さとふる） | |

## E. 防護の見た目確認（P0-2d / P1-5b）

- [ ] DevTools → Network → ドキュメントの Response Headers に `X-Frame-Options: SAMEORIGIN`、`X-Content-Type-Options: nosniff`
- [ ] クライアント JS / 応答に `service_role` 文字列が無い
- [ ] `/sitemap.xml` にトップと銘柄 URL が並ぶ
- [ ] `/robots.txt` が sitemap を指す

## 記録

| 日付 | URL | 結果 | メモ |
| --- | --- | --- | --- |
| | | | |

関連: [vercel-production.md](./vercel-production.md)、[11-launch-checklist.md](./11-launch-checklist.md)
