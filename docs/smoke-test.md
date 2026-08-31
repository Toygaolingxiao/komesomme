# 本番スモーク試験（P0-5）

本番（または Preview）URL で実施する。結果は下の記録欄に日付と URL を残す。

対象 URL: ________________  
実施日: ________________  
端末: Desktop / iPhone / Android（該当を残す）

## A. 地図と今日の一膳（Desktop + Mobile）

- [ ] 味わいの地図に点が表示される（空地図ではない）
- [ ] 探針またはスライダーを動かすと「今日の一膳」の No.1 が最近傍になる
- [ ] Mobile: ページ全体が横に溢れない（390px 幅で横スクロール無し）

## B. 侍米師に相談（P0-5b）

入力: `ハイボールと唐揚げに合う米`

- [ ] Top 4 が返る（502 が連発しない）
- [ ] 短い返事がある、または Flavor Bridge のフォールバック文
- [ ] 探針が 1 位の銘柄付近へ動く

失敗時: Vercel の相談ルートログ、`SEMANTIC_RECOMMEND_ENABLED`、embedding モデルと seed の一致を確認。

## C. 銘柄ページ（P0-5c）

`/library/[id]` を 1 件開く（例: カタログにある任意の ID）。任意で旧 `/{id}` が `/library/[id]` へ 301 することも確認。

- [ ] 事典（品鑑＋由来等）が読める
- [ ] Mobile で横溢れなし
- [ ] 購入リンクがスマホでは縦一列（通販 / ふるさとタグ）

## D. 購入リンク（P0-5d）

通販 / ふるさと納税タグ。各タブは縦一列 3 カプセル（等幅）。CTA 横に ※PR。Amazon 定型はフッター（ホームはフッターなし）。

| チャネル | 結果 |
| --- | --- |
| 楽天市場 | |
| Yahoo!ショッピング | |
| Amazon | |
| 楽天ふるさと | |
| Yahoo!ふるさと | |
| さとふる | |

## E. 防護の見た目確認（P0-2d / P1-5b）

- [ ] DevTools → Network → ドキュメントの Response Headers に `X-Frame-Options: SAMEORIGIN`、`X-Content-Type-Options: nosniff`
- [ ] クライアント JS / 応答に `service_role` 文字列が無い
- [ ] `/sitemap.xml` にトップと銘柄 URL が並ぶ
- [ ] `/robots.txt` が sitemap を指す

## F. 内部观测台（任意・P1。`OPS_DASHBOARD_SECRET` 設定後）

- [ ] 未登录访问 `/ops` 会到 `/ops/login`（或未配密钥时 404）
- [ ] 登录后能看到漏斗 / 渠道 / 日趋势，页脚无公开导航
- [ ] 公开页 HTML / 客户端 bundle 不含该密钥与 `service_role`

## 記録

| 日付 | URL | 結果 | メモ |
| --- | --- | --- | --- |
| 2026-08-30 | https://komesomme.jp | OK（ドメイン・301・GSC 登録） | `.com` / `sommeatlas.com` は CF 301→`.jp`。A〜E 全項目は次回 Desktop/Mobile で再実施推奨 |

関連: [vercel-production.md](./vercel-production.md)、[11-launch-checklist.md](./11-launch-checklist.md)、自動試験式样 [test-specification.md](./test-specification.md)、直近結果 [test-results.md](./test-results.md)
