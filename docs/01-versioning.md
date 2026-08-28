# バージョン管理

KomeSomme は [Semantic Versioning 2.0.0](https://semver.org/lang/ja/)（`X.Y.Z`）で内部管理する。

## 現在のバージョン

**0.3.0** — 正本はリポジトリ直下の [`VERSION`](../VERSION)。`package.json` の `version` も同期する。

## 番号の意味

| 桁 | 上げるタイミング | 例 |
| --- | --- | --- |
| **X**（Major） | 利用者向け体験や API の破壊的変更 | 推薦式の変更、スキーマの非互換移行 |
| **Y**（Minor） | 後方互換の機能追加・データ拡張 | 銘柄追加、新導線、計測イベント追加 |
| **Z**（Patch） | バグ修正・文案・ドキュメントのみ | 購入 URL 修正、禁止語の除去 |

`0.x.y` は MVP 期間。`1.0.0` は本番公開（独自ドメイン、監視、RLS 確認、Affiliate 計測など [06-requirements.md](./06-requirements.md) の将来要件を満たした時点）を想定する。実行タスクは [11-launch-checklist.md](./11-launch-checklist.md)。**通常の機能 commit で 1.0.0 に上げない。**

## いつ上げるか（運用）

毎回の commit で機械的に上げない。代わりに:

- **上げる:** `main` に乗る変更が、利用者または運用から見て分かるとき（機能、公開ページ、分析 / セキュリティ、catalog の座標・文案、seed の挙動、API）。**その commit と同じ変更セットで** `VERSION` を更新する。
- **上げない:** Cursor rule / skill のみ、コメントのみ、実行時に影響しない内部整理。履歴は [10-changelog.md](./10-changelog.md) の `## Unreleased` にだけ書いてよい。
- **1.0.0:** チェックリストの P0 と合意した P1 が揃い、明示的に「1.0.0 を切る」と言ったときだけ。

エージェント向けの短い手順は [`.cursor/rules/semver.mdc`](../.cursor/rules/semver.mdc)（毎回の会話に適用）。hook や CI で VERSION を自動書き換えしない。

## 更新手順

1. 現在の [`VERSION`](../VERSION) を読む。指定がなければ 1 段だけ上げ、飛ばさない
2. `VERSION` と `package.json` の `version` を同じ値にする
3. [10-changelog.md](./10-changelog.md) の該当 Unreleased を `## X.Y.Z — YYYY-MM` へ移し、文頭の「現在」を同期する
4. この文書の「現在のバージョン」と下の履歴表を更新する。[docs/README.md](./README.md) に書いてある番号も合わせる
5. 必要なら [00-overview.md](./00-overview.md) の MVP 説明を見直す（1.0.0 のときは必須）
6. `11-launch-checklist.md` の「現状スナップショット」は 1.0.0 以外では無理に合わせない

## バージョン履歴（要約）

| バージョン | 日付 | 概要 |
| --- | --- | --- |
| 0.1.0 | 2026-08 前半 | MVP 初版。味わいマップ、意味検索、Supabase カタログ、derive パイプライン |
| 0.2.0 | 2026-08 後半 | UX Phase 1–6、データ / ドキュメント整理、番号付き docs、技術振り返り文書 |
| 0.2.1 | 2026-08 後半 | Mobile 横溢れ修正、購入 1 列、探針ランダム、プレビュー地図拡大 |
| 0.3.0 | 2026-08 後半 | 味わい再校正、access_events / GTM、公開前の防護と SEO、VERSION 運用 |

詳細は [10-changelog.md](./10-changelog.md)。
