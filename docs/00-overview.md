# プロダクト概要

## KomeSomme とは

KomeSomme（コメソム）は、日本のブランド米を味わいの地図から探すサイト。画面の案内役は **侍米師（じべいし）**。

食べたい料理、今日の気分、合わせたいお酒を言葉にすると、地図上の位置と銘柄の解説から、今日の一膳が見えてくる。

## 主な利用者

- 料理や気分に合う米を選びたい人
- 粒感・甘みから新しい銘柄を探したい人
- 酒・ふるさと納税返礼品を比較したい人

## 現行（本番）

番号は [`VERSION`](../VERSION)。旗艦ホストは **`https://komesomme.jp`**。

約 106 銘柄の味わい地図と座標推薦、「侍米師に相談」の意味検索 Top 4、`/library/[id]` 銘柄事典、`/pair` 料理十面、購入導線（通販 / ふるさと納税）、編集発見（ピックアップ / 特集）、`/about`、共有カード。防護（レート制限・RLS・法務頁・CI）とスモーク記録済み。匿名利用は `access_events`、任意で GA4 / Sentry。

**まだない:** `/compare`（銘柄どうしの比較ページ）。次に作るものは [20-growth-plan.md](./20-growth-plan.md) §4.0。

画面の動きは [08-ui-design.md](./08-ui-design.md)。旧 URL とドメインは [vercel-production.md](./vercel-production.md)。

公開後の観測は週 30 分（[20 §6.3](./20-growth-plan.md)）。Auth / お気に入りなどは構想外。1.0 門禁の記録は [11-launch-checklist.md](./11-launch-checklist.md)。

1.x の製品ロードマップ（Phase / Wave）は [20-growth-plan.md](./20-growth-plan.md)。進め方は [25-dev-playbook.md](./25-dev-playbook.md)。運営者向けの職業・回収仮説（中文・対外ページには出さない）は [22-career-positioning.md](./22-career-positioning.md)。

## 関連

| 用途 | 文書 |
| --- | --- |
| 画面 | [08-ui-design.md](./08-ui-design.md) |
| 実装入口 | [03-system-design.md](./03-system-design.md) |
| 技術振り返り | [02-tech-retrospective.md](./02-tech-retrospective.md) |
| 構想からの経緯 | [12-product-journey.md](./12-product-journey.md)（中文） |
| 1.x 成長 | [20-growth-plan.md](./20-growth-plan.md)（中文） |
| 進め方 | [25-dev-playbook.md](./25-dev-playbook.md)（中文） |
| 職業定位 | [22-career-positioning.md](./22-career-positioning.md)（中文・対 GAO） |
| 文書索引 | [README.md](./README.md) |
