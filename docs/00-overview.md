# プロダクト概要

## KomeSomme とは

KomeSomme（コメソム）は、日本のブランド米を味わいの地図から探すサイト。画面の案内役は **侍米師（じべいし）**。

食べたい料理、今日の気分、合わせたいお酒を言葉にすると、地図上の位置と銘柄の解説から、今日の一膳が見えてくる。

## 背景と価値

ブランド米は選択肢が多く、銘柄名だけでは粒感・甘み・粘り・料理や酒との相性を比較しにくい。KomeSomme は味わいマップと自然言語の意味検索で、用途に合う一膳へ到達するまでの迷いを減らす。

## 主な利用者

- カレー、刺身、おにぎり、弁当など料理に合う米を選びたい人
- 粒感や甘みの好みから新しい銘柄を探したい人
- ウイスキーや日本酒と合わせるご飯を探したい人
- ブランド米やふるさと納税返礼品を比較したい人

## 現行 MVP

番号は [`VERSION`](../VERSION)。約 106 銘柄の座標推薦、意味検索 Top 4、`/library/[id]` 銘柄事典、購入導線（通販 / ふるさと納税のタグ切替）。味わいスコアは公開食味図と県・JA 資料で再校正済み。匿名の利用イベントは `access_events` に保管する（GTM は env 設定時）。本番ホストは `komesomme.jp`。

1.0.0 前の残りは主に **アフィ成果突合・VC 本番 SID・スモーク人手記録・branch protection**。詳細は [06-requirements.md](./06-requirements.md) / [11-launch-checklist.md](./11-launch-checklist.md)。技術スタック層別は [16-tech-stack.md](./16-tech-stack.md)。楽天 API と他モールの隔離は [13-affiliate-compliance.md](./13-affiliate-compliance.md)。構想からの経緯は [12-product-journey.ja.md](./12-product-journey.ja.md)（[中国語](./12-product-journey.md)）。

## 関連文書

- 構想からの経緯: [12-product-journey.ja.md](./12-product-journey.ja.md)（[中国語](./12-product-journey.md)）
- 技術振り返り: [02-tech-retrospective.md](./02-tech-retrospective.md)
- 体験・画面: [08-ui-design.md](./08-ui-design.md)
- 技術構成: [03-system-design.md](./03-system-design.md)
- 改善計画: [07-roadmap.md](./07-roadmap.md)
