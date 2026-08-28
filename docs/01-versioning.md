# バージョン管理

KomeSomme は [Semantic Versioning 2.0.0](https://semver.org/lang/ja/)（`X.Y.Z`）で内部管理する。

## 現在のバージョン

**0.2.0** — 正本はリポジトリ直下の [`VERSION`](../VERSION)。`package.json` の `version` も同期する。

## 番号の意味

| 桁 | 上げるタイミング | 例 |
| --- | --- | --- |
| **X**（Major） | 利用者向け体験や API の破壊的変更 | 推薦式の変更、スキーマの非互換移行 |
| **Y**（Minor） | 後方互換の機能追加・データ拡張 | 銘柄追加、新導線、計測イベント追加 |
| **Z**（Patch） | バグ修正・文案・ドキュメントのみ | 購入 URL 修正、禁止語の除去 |

`0.x.y` は MVP 期間。`1.0.0` は本番公開（独自ドメイン、監視、RLS 確認、Affiliate 計測など [06-requirements.md](./06-requirements.md) の将来要件を満たした時点）を想定する。

## 更新手順

1. 変更内容を [10-changelog.md](./10-changelog.md) に追記
2. `VERSION` と `package.json` の `version` を同じ値に更新
3. 必要なら [00-overview.md](./00-overview.md) の MVP 説明を見直す

## バージョン履歴（要約）

| バージョン | 日付 | 概要 |
| --- | --- | --- |
| 0.1.0 | 2026-08 前半 | MVP 初版。味わいマップ、意味検索、Supabase カタログ、derive パイプライン |
| 0.2.0 | 2026-08 後半 | UX Phase 1–6、データ / ドキュメント整理、番号付き docs、技術振り返り文書 |

詳細は [10-changelog.md](./10-changelog.md)。
