# ドキュメント索引

KomeSomme の文書は **`docs/` 直下の番号付き md のみ**。開発手順は [README.md](../README.md)、銘柄データは [src/data/README.md](../src/data/README.md)。現在の番号は [`VERSION`](../VERSION)。

## 命名ルール

| ルール | 例 |
| --- | --- |
| `docs/` 直下にフラット配置 | サブフォルダは使わない |
| 先頭 `00`〜`14` + kebab-case | `03-system-design.md` |
| 本文は日本語。**12・13 は中国語** | — |
| この README が唯一の索引 | — |

## 文書一覧

| # | 文書 | 内容 |
| --- | --- | --- |
| 00 | [00-overview.md](./00-overview.md) | プロダクト概要 |
| 01 | [01-versioning.md](./01-versioning.md) | SemVer ルール |
| 02 | [02-tech-retrospective.md](./02-tech-retrospective.md) | 技術選定・RAG・生成 AI 開発の振り返り |
| 03 | [03-system-design.md](./03-system-design.md) | ディレクトリ・データフロー |
| 04 | [04-database.md](./04-database.md) | DB スキーマ |
| 05 | [05-semantic-search.md](./05-semantic-search.md) | 意味検索・embedding |
| 06 | [06-requirements.md](./06-requirements.md) | MVP 要件・将来要件 |
| 07 | [07-roadmap.md](./07-roadmap.md) | UX 改善計画 |
| 08 | [08-ui-design.md](./08-ui-design.md) | UI デザイン正本 |
| 09 | [09-brand-icon.md](./09-brand-icon.md) | アイコン（参考図: [grain-probe-brand-board.png](./grain-probe-brand-board.png)） |
| 10 | [10-changelog.md](./10-changelog.md) | 変更履歴 |
| 11 | [11-launch-checklist.md](./11-launch-checklist.md) | 収益化本番リリースの実行タスク（P0/P1/P2） |
| 12 | [12-product-journey.md](./12-product-journey.md) | 構想〜現行の開発者 / コンサル振り返り（**中国語**） |
| 13 | [13-affiliate-compliance.md](./13-affiliate-compliance.md) | 楽天 API と他モール共存の隔離設計（**中国語**） |
| 14 | [14-affiliate-programs.md](./14-affiliate-programs.md) | Amazon / 楽天 / Yahoo・さとふる VC の規約リンクと実装メモ |
| — | [rls-verify.md](./rls-verify.md) | 本番 RLS / anon 実測手順（0004 後） |
| — | [vercel-production.md](./vercel-production.md) | Vercel 本番 env・Redeploy・ロールバック |
| — | [smoke-test.md](./smoke-test.md) | 本番スモーク試験の手順と記録欄 |
| — | [test-specification.md](./test-specification.md) | 試験式样书（TS-*）· 自動テスト正本 |
| — | [test-results.md](./test-results.md) | 直近の自動試験結果レポート（生成物） |
| — | `/library`（アプリ） | 銘柄ライブラリ：検索・地域フィルタ・詳細事典 |
| — | [scripts/data/README.md](../scripts/data/README.md) | 味わい再校正アーカイブと灌庫メモ |

## 読み分け

| 知りたいこと | 文書 |
| --- | --- |
| プロジェクトとは | 00 |
| 技術の全体像 | 02 |
| コードの置き場所 | 03 |
| 画面を直す | 08 |
| バージョンを上げる | 01 → 10（番号の正本は `VERSION`） |
| 構想から今までの経緯 | 12（中国語） |
| 本番公開までにやること | 11 |
| アフィリエイト各社の規約・転鎖 | 14（楽天隔離は 13） |
| プライバシー / 利用規約 | `/privacy` `/terms` `/tokushoho` |

作業リズム（Issue / DoD / Go-live）は Cursor rule `.cursor/rules/project-workflow.mdc`。コンサル向け WBS/甘特ツールは別リポジトリ `pmo-kit`。
