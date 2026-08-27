# ドキュメント索引

製品 UI の日語正本と、運用手順を分ける。

| 文書 | 役割 |
| --- | --- |
| [ui_design.md](./ui_design.md) | UI デザイン正本 |
| [master_design_spec.md](./master_design_spec.md) | 現行システムのファイル配置とデータフロー |
| [requirements.md](./requirements.md) | 現行 MVP 要件と将来要件 |
| [database_schema.md](./database_schema.md) | 3 テーブル + `rice_catalog` + 適用 SQL |
| [rag_prompt_design.md](./rag_prompt_design.md) | embedding / 意味検索（文章生成ではない） |
| [development_phases.md](./development_phases.md) | 実装フェーズ |
| [business_plan.md](./business_plan.md) | 事業概要 |
| [next-steps.md](./next-steps.md) | 運用チェックリスト（GAO 向け・中文） |
| [kome-somme-rice-v2-implementation.md](./kome-somme-rice-v2-implementation.md) | V2 原典。**編集しない**。画面コピーは現行の「米ソムリエ」を正とする |

## データファイル

| パス | 役割 |
| --- | --- |
| `src/data/rice/*.ts` | 地域別の手書き `RiceSource` |
| `src/lib/data/riceProfilesv2.ts` | 編集 overlay（文章・スコア） |
| `src/lib/data/backup_riceP.ts` | 整理途中の手作業アーカイブ。マップ / seed は `cultivarDedup` 後のカタログを使う |
| `src/data/riceProfilesV2.ts` | derive + overlay + 去重の実行時カタログ |
