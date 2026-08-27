# ドキュメント索引

画面は [ui_design.md](./ui_design.md)、開発手順はリポジトリ直下の [README.md](../README.md) を正とする。原典は編集しない。

| 文書 | 役割 |
| --- | --- |
| [ui_design.md](./ui_design.md) | UI デザイン正本 |
| [master_design_spec.md](./master_design_spec.md) | ファイル配置とデータフロー |
| [requirements.md](./requirements.md) | 現行 MVP と将来要件 |
| [database_schema.md](./database_schema.md) | 3 テーブル + `rice_catalog` + 適用 SQL |
| [rag_prompt_design.md](./rag_prompt_design.md) | embedding / 相談の補助語と短い返事 |
| [business_plan.md](./business_plan.md) | 事業概要 |
| [kome-somme-rice-v2-implementation.md](./kome-somme-rice-v2-implementation.md) | V2 原典。**編集しない**。画面コピーは「米ソムリエ」を正とする |

## データファイル

| パス | 役割 |
| --- | --- |
| `src/data/rice/*.ts` | 地域別の手書き `RiceSource` |
| `src/lib/data/riceProfilesv2.ts` | 編集 overlay（文章・スコア） |
| `src/lib/data/backup_riceP.ts` | 整理途中の手作業アーカイブ。マップ / seed は使わない |
| `src/data/riceProfilesV2.ts` | derive + overlay + 去重の実行時カタログ |
| `src/lib/data/README.md` | overlay / backup の使い分け |
