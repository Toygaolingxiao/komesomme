# 味わいスコア再校正アーカイブ（2026-08）

本番座標軸は変えていない（横=甘み `sweetness`、縦=粒立ち `hardness`。`stickiness` は非座標）。

## ファイル

| ファイル | 内容 |
| --- | --- |
| `taste-map-extract.json` | 5 枚の外部食味図から読んだ銘柄位置 → 仮スコア |
| `taste-consensus-overrides.json` | **適用正本**。図合意 × 公開資料（県 / JA / Wikipedia 等）× 旧値。`reason` に判断メモ |
| `taste-consensus-apply-report.json` | `apply-taste-consensus.ts` の適用結果 |
| `shop-inventory-gaps.md` | 購入 API 監査の**公開セーフ**ギャップ表（id / クラスのみ） |
| `shop-inventory/`（gitignore） | 楽天・Yahoo の item URL 等を含む非公開 JSON |

## 銘柄ライブラリ記事

```bash
npm run encyclopedia:generate -- --mode=template   # catalog 根拠の全文（API 不要）
npm run encyclopedia:generate -- --mode=gemini     # Gemini で上書き（要 GEMINI_API_KEY）
npm run encyclopedia:generate                      # auto: 不足を template → 可能なら Gemini
```

出力: `src/data/rice/encyclopedia/articles/*.json` + `manifest.json`  
閲覧: `/library`

Gemini 無料枠が尽きた日は template で完走し、翌日 `--mode=gemini` で上書きできる。

## 購入在庫監査（公式 API のみ）

Amazon / 楽天 / Yahoo の**商品ページ HTML スクレイピングはしない**（規約・安定性）。  
楽天 Ichiba・Yahoo ItemSearch で全銘柄を監査し、item ヒット有無を見る。

```bash
npm run inventory:audit
npm run inventory:audit -- --limit=10
npm run inventory:audit -- --id=koshihikari
```

- 詳細 JSON → `shop-inventory/latest.json`（**Git に入れない**）
- ギャップ表 → `shop-inventory-gaps.md`（商品名・価格・商品 URL なし）
- 規約: [docs/13-affiliate-compliance.md](../../docs/13-affiliate-compliance.md)

Amazon / さとふるは現状検索 URL のみ（PA-API 未接続）。百科 enrich（県・JA・Wikipedia）は味わい校正と同系統の**人手レビュー**前提で別作業。

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
