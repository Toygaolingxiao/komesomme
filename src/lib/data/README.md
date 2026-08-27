# 銘柄データの置き場

| ファイル | 役割 | seed / マップ |
| --- | --- | --- |
| `riceProfilesv2.ts` | ソースに無い商標・残余行だけを足す overlay。打分は上書きしない | 使う |
| `backup_riceP.ts` | 手作業で集めたアーカイブ。県違い・SKU の重複を含む | **直接は使わない** |

実行時カタログは `src/data/riceProfilesV2.ts` が derive → overlay（ソースに無い行だけ追加）→ `cultivarDedup` した配列。魚沼・佐渡・仁多・龍の瞳に加え、雪ほたか・銀の朏・結びの神は商標として独立 ID を保つ。地域ソースの打分が正本。
