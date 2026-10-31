# ドキュメント索引

開発手順は [README.md](../README.md)。銘柄データは [src/data/README.md](../src/data/README.md)。現在の番号は [`VERSION`](../VERSION)。

**読み分け:** 事実は一箇所だけ書く。ほかの文書はリンクに留める。

| 知りたいこと | 開くファイル | ここに書かない |
| --- | --- | --- |
| 画面・動き | [08-ui-design.md](./08-ui-design.md) | 要件や概要へ同じ仕様を複製しない |
| ファイル配置・データフロー・旧 URL の仕組み | [03-system-design.md](./03-system-design.md) | |
| 本番・ドメイン・GSC | [vercel-production.md](./vercel-production.md) | www の作業はここで閉じた。ほかでは繰り返さない |
| 相談 API | [05-semantic-search.md](./05-semantic-search.md) | |
| DB | [04-database.md](./04-database.md) | |
| 次に何をするか | [20-growth-plan.md](./20-growth-plan.md) | |
| なぜ時間を投じるか | [22-career-positioning.md](./22-career-positioning.md) | 公開ページへ書かない |
| どうここまで来たか | [12-product-journey.md](./12-product-journey.md) | 手順の正本にしない |
| 変更の日付 | [10-changelog.md](./10-changelog.md) | 他文書の文頭に現在バージョンを書かない |
| 誰がどの分支で触るか | [24-collaboration.md](./24-collaboration.md) | 手順を workflow rule に複製しない |

## 正本（実装・運用）

| 文書 | 内容 |
| --- | --- |
| [00-overview.md](./00-overview.md) | プロダクト概要 |
| [01-versioning.md](./01-versioning.md) | SemVer |
| [03-system-design.md](./03-system-design.md) | ディレクトリ・データフロー・env 要約 |
| [04-database.md](./04-database.md) | DB スキーマ |
| [05-semantic-search.md](./05-semantic-search.md) | 相談 / embedding |
| [06-requirements.md](./06-requirements.md) | 現行 MVP 要件（将来は 11 を正本） |
| [08-ui-design.md](./08-ui-design.md) | UI 正本 |
| [10-changelog.md](./10-changelog.md) | 変更履歴 |
| [11-launch-checklist.md](./11-launch-checklist.md) | **1.0 門禁** P0/P1/P2 |
| [13-affiliate-compliance.md](./13-affiliate-compliance.md) | 楽天 API 隔離（中文） |
| [14-affiliate-programs.md](./14-affiliate-programs.md) | 各社アフィ規約・実装メモ |
| [15-disclosure-surfaces.md](./15-disclosure-surfaces.md) | 披露表面一覧（中文） |
| [18-brand-illustration.md](./18-brand-illustration.md) | 銘柄イラスト方針 |
| [19-editorial-discovery.md](./19-editorial-discovery.md) | 編集発見（三銘柄・特集） |
| [20-growth-plan.md](./20-growth-plan.md) | **1.x 成長計画** 曝光・転化・SOP（中文） |
| [21-seo-intent-content.md](./21-seo-intent-content.md) | **SEO 意图与内容** 长尾词库・EEAT・权威锚点・AI 引用门禁（中文） |
| [22-career-positioning.md](./22-career-positioning.md) | **职业定位** 作品集・咨询杠杆・轻 B2B（中文・対外页不写） |
| [23-ai-search-geo.md](./23-ai-search-geo.md) | **AI 検索対応（GEO）** 発端・思考過程・llms.txt と robots 明示放行の方針（中文） |
| [24-collaboration.md](./24-collaboration.md) | **并行协作** 一人一分支・交叉审查・合并门禁（中文） |
| [vercel-production.md](./vercel-production.md) | 本番 env・ドメイン・GSC・CF 防護 |
| [smoke-test.md](./smoke-test.md) | 本番スモーク手順と記録 |
| [test-specification.md](./test-specification.md) | 試験式样（TS-*） |
| [rls-verify.md](./rls-verify.md) | RLS / anon 実測 |

## 振り返り（たまに読む）

| 文書 | 内容 |
| --- | --- |
| [12-product-journey.md](./12-product-journey.md) | 構想〜現行（**中文**・対 GAO） |
| [02-tech-retrospective.md](./02-tech-retrospective.md) | 技術選定・RAG・生成 AI 開発 |

## アーカイブ（スタブ / 完了記録）

旧リンクを壊さないため残す。中身は正本へ誘導。

| 文書 | 誘導先 |
| --- | --- |
| [07-roadmap.md](./07-roadmap.md) | UX Phase 1–6 **完了** → 画面は 08、残タスクは 11 |
| [12-product-journey.ja.md](./12-product-journey.ja.md) | 日本語併置は廃止 → [12 中文](./12-product-journey.md) |
| [16-tech-stack.md](./16-tech-stack.md) | 層別表は 02 / 03 に統合 |
| [09-brand-icon.md](./09-brand-icon.md) | アイコン参考 |
| [17-valuecommerce-reapply.md](./17-valuecommerce-reapply.md) | VC **廃止**記録 |
| [test-results.md](./test-results.md) | 自動生成の試験レポート |

## アプリ（文書ではない）

| 面 | 説明 |
| --- | --- |
| `/library` | 銘柄ライブラリ |
| `/ops` | 内部观测台（`OPS_DASHBOARD_SECRET`。公開ナビに出さない） |

作業リズムは `.cursor/rules/project-workflow.mdc`。WBS/甘特は兄弟倉 `pmo-kit`。

## PJ 文档柜（卷宗 / 备份 / 锐评）

正本以外の留档。对 GAO：**调研备份、锐评原文、固定提示词、对外工件索引**。

| 入口 | 内容 |
| --- | --- |
| [pj/README.md](./pj/README.md) | 构成与用法 |
| [pj/prompts/](./pj/prompts/) | 红队锐评提示词等 |
| [pj/reviews/](./pj/reviews/) | 外部锐评留档（模板 + 每次原文） |
| [pj/research/](./pj/research/) | SEO 等调研快照备份 |
| [pj/artifacts/](./pj/artifacts/) | Case Study 等索引（实体多在 `assets/`） |
