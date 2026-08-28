# バージョン管理

KomeSomme は [Semantic Versioning 2.0.0](https://semver.org/lang/ja/)（`X.Y.Z`）で内部管理する。

**現在の番号の正本は [`VERSION`](../VERSION) と `package.json` の `version` だけ。** 他の md に「現在 0.x.y」を手で書かない。履歴の見出しは [10-changelog.md](./10-changelog.md) に置く。

## 番号の意味

| 桁 | 上げるタイミング | 例 |
| --- | --- | --- |
| **X**（Major） | 利用者向け体験や API の破壊的変更 | 推薦式の変更、スキーマの非互換移行 |
| **Y**（Minor） | 後方互換の機能追加・データ拡張 | 銘柄追加、新導線、計測イベント追加 |
| **Z**（Patch） | バグ修正・文案・ドキュメントのみ | 購入 URL 修正、禁止語の除去 |

`0.x.y` は MVP 期間。`1.0.0` は [11-launch-checklist.md](./11-launch-checklist.md) の P0 と合意した P1 が揃い、明示的に切るときだけ。**通常の機能 commit で 1.0.0 に上げない。**

## いつ上げるか

- **上げる:** `main` に乗る変更が、利用者または運用から見て分かるとき。**その commit と同じ変更セットで** `VERSION` を更新する。
- **上げない:** Cursor rule、コメント、実行時に影響しない文書整理。`10-changelog.md` の `## Unreleased` にだけ書いてよい。
- hook / CI で VERSION を自動書き換えしない。エージェント手順は [`.cursor/rules/semver.mdc`](../.cursor/rules/semver.mdc)。

## 更新手順

1. [`VERSION`](../VERSION) を読む。指定がなければ 1 段だけ上げ、飛ばさない
2. `VERSION` と `package.json` の `version` を同じ値にする
3. `npm install` を一度走らせ、`package-lock.json` のルート `version` を同期する（**lock は手で編集しない**）
4. [10-changelog.md](./10-changelog.md) の Unreleased を `## X.Y.Z — YYYY-MM` へ移す

1.0.0 のときだけ [00-overview.md](./00-overview.md) の現行説明と [11-launch-checklist.md](./11-launch-checklist.md) のスナップショットを見直す。
