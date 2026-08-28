# ドキュメント索引

画面は [ui_design.md](./ui_design.md)、開発手順はリポジトリ直下の [README.md](../README.md) を正とする。原典は編集しない。参考図と手作業アーカイブは [references/](./references/README.md)。

| 文書 | 役割 |
| --- | --- |
| [ui_design.md](./ui_design.md) | UI デザイン正本 |
| [master_design_spec.md](./master_design_spec.md) | ファイル配置とデータフロー |
| [requirements.md](./requirements.md) | 現行 MVP と将来要件 |
| [database_schema.md](./database_schema.md) | 3 テーブル + `rice_catalog` + 適用 SQL |
| [rag_prompt_design.md](./rag_prompt_design.md) | embedding / 相談の補助語と短い返事 |
| [business_plan.md](./business_plan.md) | 事業概要 |
| [brand-icon.md](./brand-icon.md) | アイコンシステム正本 |
| [kome-somme-rice-v2-implementation.md](./kome-somme-rice-v2-implementation.md) | V2 原典。**編集しない**。画面コピーは「米ソムリエ」を正とする |
| [リファクタリング計画書.md](./リファクタリング計画書.md) | 現行評価と改善フェーズの正本。購買リンクは 2 行 × 3 列 |
| [references/README.md](./references/README.md) | 参考図・手作業アーカイブ。実行時は使わない |

## データファイル

| パス | 役割 |
| --- | --- |
| `src/data/rice/*.ts` | 地域別の手書き `RiceSource` |
| `src/lib/data/riceProfilesv2.ts` | 編集 overlay（文章・スコア） |
| `src/lib/data/riceHandArchive.ts` | 手作業アーカイブ。マップ / seed は使わない |
| `src/data/riceProfilesV2.ts` | derive + overlay + 去重の実行時カタログ |
| `src/lib/data/README.md` | overlay / archive の使い分け |
