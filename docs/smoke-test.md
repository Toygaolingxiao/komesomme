# 本番スモーク試験（P0-5）

本番（または Preview）URL で実施する。結果は下の記録欄に日付と URL を残す。

対象 URL: _[KomeSomme | 侍米師](https://komesomme.jp/)  
実施日: __09.07  
端末: Desktop / iPhone / Android（該当を残す）

## A. 地図と今日の一膳（Desktop + Mobile）

- [x] 味わいの地図に点が表示される（空地図ではない）
- [x] 探針またはスライダーを動かすと「今日の一膳」の No.1 が最近傍になる
- [x] Mobile: ページ全体が横に溢れない（390px 幅で横スクロール無し）

## B. 侍米師に相談（P0-5b）



- [x] Top 4 が返る（502 が連発しない）
- [x] 短い返事がある、または Flavor Bridge のフォールバック文
- [x] 探針が 1 位の銘柄付近へ動く

失敗時: Vercel の相談ルートログ、`SEMANTIC_RECOMMEND_ENABLED`、embedding モデルと seed の一致を確認。

## C. 銘柄ページ（P0-5c）

`/library/[id]` を 1 件開く（例: カタログにある任意の ID）。任意で旧 `/{id}` が `/library/[id]` へ 301 することも確認。

- [x] 事典（品鑑＋由来等）が読める
- [x] Mobile で横溢れなし
- [x] 購入リンクが通販 / ふるさとタグで切替できる（ライブラリは縦一列）



## D. 購入リンク（P0-5d）

通販 / ふるさと納税タグ。通販は楽天 / Yahoo / Amazon / メルカリ（ホーム compact は 2×2、ライブラリは縦一列）、ふるさとは 3 カプセル。CTA 横に ※PR。Amazon 定型はフッター（ホームはフッターなし）。


| チャネル         | 結果  |
| ------------ | --- |
| 楽天市場         | OK  |
| Yahoo!ショッピング | OK  |
| Amazon       | OK  |
| メルカリ         | OK  |
| 楽天ふるさと       | OK  |
| Yahoo!ふるさと   | OK  |
| さとふる         | OK  |




## E. 防護の見た目確認（P0-2d / P1-5b）

- [x] DevTools → Network → ドキュメントの Response Headers に `X-Frame-Options: SAMEORIGIN`、`X-Content-Type-Options: nosniff`
- [x] クライアント JS / 応答に `service_role` 文字列が無い
- [x] `/sitemap.xml` にトップと銘柄 URL が並ぶ
- [x] `/robots.txt` が sitemap を指す
- [x] `/pair/curry`（または任意の料理ページ）が開き、比較表と ※PR、向かない欄がある（Wave 2A）



## F. 内部观测台（任意・P1。`OPS_DASHBOARD_SECRET` 設定後）

- [x] 未登录访问 `/ops` 会到 `/ops/login`（或未配密钥时 404）
- [x] 登录后能看到漏斗 / 渠道 / 日趋势，页脚无公开导航
- [x] `/ops/yahoo` 能贴推广链；空行仍走普通 Yahoo 搜索
- [x] ふるさとタブの Yahoo は普通搜索（寄附は公式アフィ成果対象外）
- [x] 公开页 HTML / 客户端 bundle 不含该密钥与 `service_role`



## 記録


| 日付         | URL                                          | 結果                  | メモ                                                                        |
| ---------- | -------------------------------------------- | ------------------- | ------------------------------------------------------------------------- |
| 2026-09-30 | [https://komesomme.jp](https://komesomme.jp) | 要確認（1.4.4 の見た目） | 地図の粒は短く暖かく、推薦欄は交叉。本番の見た目は未記録 |
| 2026-09-30 | [https://komesomme.jp](https://komesomme.jp) | 要確認（GSC リダイレクト） | `/collections` → `/discover` は 308×1。末尾 `/` は middleware で 1 ホップ（1.4.3）。www は独立サイトにしない（作業は閉じた） |
| 2026-09-11 | [https://komesomme.jp](https://komesomme.jp) | OK（E `/pair/curry`） | 1.4.0 本番。並び根拠にフィールド名なし、比較表・向かない欄あり。百科 registry 拡充は後続 1.4.1 |
| 2026-09-07 | [https://komesomme.jp](https://komesomme.jp) | OK（A〜F） | 0.16.1。E: ヘッダ SAMEORIGIN/nosniff、HTML に service_role 無し、sitemap 116 URL、robots が sitemap を指す。F は人手 OK |
| 2026-08-30 | [https://komesomme.jp](https://komesomme.jp) | OK（ドメイン・301・GSC 登録） | `.com` / `sommeatlas.com` は CF 301→`.jp` |


関連: [vercel-production.md](./vercel-production.md)、[11-launch-checklist.md](./11-launch-checklist.md)、自動試験式样 [test-specification.md](./test-specification.md)、直近結果 [test-results.md](./test-results.md)