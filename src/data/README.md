# 銘柄データ

実行時カタログと手書きソースの置き場。ロジック（derive / dedup / matrix）は `src/lib/rice/`。

```text
src/data/
├── riceProfilesV2.ts          # 互換 shim → rice/catalog.ts
└── rice/
    ├── index.ts               # RiceSource 集約（@/data/rice）
    ├── sources/               # 地域別手書き RiceSource（打分・文案の正本）
    ├── overlay.ts             # ソースに無い商標・残余行だけを足す
    └── catalog.ts             # derive → overlay → dedup の実行時カタログ
```

| ファイル | 役割 | seed / マップ |
| --- | --- | --- |
| `rice/sources/*.ts` | 地域別 `RiceSource`。打分と文案の正本 | 使う（derive 入力） |
| `rice/overlay.ts` | ソースに無い商標・残余行だけを足す。打分は上書きしない | 使う |
| `rice/catalog.ts` | derive → overlay（ソースに無い行だけ追加）→ `cultivarDedup` | 使う |

魚沼・佐渡・仁多・龍の瞳に加え、雪ほたか・銀の朏・結びの神は商標として独立 ID を保つ。

ドキュメント索引は [docs/README.md](../../docs/README.md)。
