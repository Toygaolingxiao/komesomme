# 味わいスコア再校正アーカイブ（2026-08）

本番座標軸は変えていない（横=甘み `sweetness`、縦=粒立ち `hardness`。`stickiness` は非座標）。

## ファイル

| ファイル | 内容 |
| --- | --- |
| `taste-map-extract.json` | 5 枚の外部食味図から読んだ銘柄位置 → 仮スコア |
| `taste-consensus-overrides.json` | **適用正本**。図合意 × 公開資料（県 / JA / Wikipedia 等）× 旧値。`reason` に判断メモ |
| `taste-consensus-apply-report.json` | `apply-taste-consensus.ts` の適用結果 |

再適用:

```bash
node --import tsx scripts/apply-taste-consensus.ts
npm run validate:rice
```

## 灌庫（あなたの作業）

ソースを直したあと、本番 / Preview の Supabase へ:

```bash
npm run seed:rice
```

embedding モデルを変えていなければ、既存行の味わい列が更新され、相談用ベクトルは search_text が変わった銘柄で再生成される。完了後に本番 URL で地図の位置感を数銘柄確認すること。

## 図にあって catalog に無い銘柄（未追加）

秋の詩、まいひかり、ささ結、静岡そだち、利根きらり、むつほまれ、花キラリ、女神のほほえみ、田原米
