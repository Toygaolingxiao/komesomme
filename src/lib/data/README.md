# 銘柄データの置き場

| ファイル | 役割 | seed / マップ |
| --- | --- | --- |
| `riceProfilesv2.ts` | 編集 overlay。`src/data/rice/*.ts` と名前で結合する | 使う |
| `backup_riceP.ts` | 手作業で集めたアーカイブ。県違い・SKU の重複を含む | **直接は使わない** |

実行時カタログは `src/data/riceProfilesV2.ts` が derive → overlay → `cultivarDedup` した配列。魚沼・佐渡・仁多・龍の瞳だけ独立 ID を保つ。
