# 購入導線ギャップ（API 監査・公開セーフ）

生成: 2026-08-30T04:46:21.035Z

このファイルは **銘柄 id / 解決クラス / 検索キーワード** のみ。
楽天・Yahoo API の商品名・価格・商品 URL は載せない（[13-affiliate-compliance.md](../../docs/13-affiliate-compliance.md)）。

詳細（URL・item ペイロード）は gitignore の `scripts/data/shop-inventory/latest.json`。

## サマリ

| 指標 | 件数 |
| --- | ---: |
| 監査銘柄 | 106 |
| 楽天 item ヒット | 93 |
| 楽天 search のみ | 13 |
| Yahoo item ヒット | 0 |
| 楽天も Yahoo も item なし | 13 |
| Amazon / さとふる | 検索 URL のみ（PA-API 未接続） |

## 両モールとも item なし（優先してキーワード見直し）

| id | 銘柄 | 県 | keyword | rakuten | yahoo |
| --- | --- | --- | --- | --- | --- |
| `asahi-no-yume` | あさひの夢 | 栃木県 | あさひの夢 白米 5kg 栃木県産 | search | search |
| `emihokoro` | えみほころ | 埼玉県 | えみほころ 白米 5kg 埼玉県産 | search | search |
| `kumasan-no-chikara` | くまさんの力 | 熊本県 | くまさんの力 白米 5kg 熊本県産 | search | search |
| `goropikari` | ゴロピカリ | 群馬県 | ゴロピカリ 白米 5kg 群馬県産 | search | search |
| `hikari-shinseiki` | ヒカリ新世紀 | 全国 | ヒカリ新世紀 白米 5kg | search | search |
| `fukuhibiki` | ふくひびき | 福島県 | ふくひびき 白米 5kg 福島県産 | search | search |
| `hoshijirushi` | ほしじるし | 茨城県 | ほしじるし 白米 5kg 茨城県産 | search | search |
| `mie-no-yume` | みえのゆめ | 三重県 | みえのゆめ 白米 5kg 三重県産 | search | search |
| `ai-hitotsubu` | 愛ひとつぶ | 愛知県 | 愛ひとつぶ 白米 5kg 愛知県産 | search | search |
| `yukihotaka` | 雪ほたか | 群馬県 | 雪ほたか 白米 5kg 群馬県産 | search | search |
| `daichi-no-hoshi` | 大地の星 | 北海道 | 大地の星 白米 5kg 北海道産 | search | search |
| `ryu-no-hitomi` | 龍の瞳（いのちの壱） | 岐阜県 | 龍の瞳 白米 5kg 岐阜県産 | search | search |
| `koi-no-yokan` | 恋の予感 | 山口県 | 恋の予感 白米 5kg 山口県産 | search | search |

## 運用

```bash
npm run inventory:audit
```

- 楽天・Yahoo は公式 API。Amazon / さとふる HTML のスクレイピングはしない。
- ギャップ銘柄は `rakuten_search_keyword` / `amazon_search_keyword` / `furusato_keywords` を source で調整して再監査。
- モール側に在庫が無い銘柄は、UI で検索フォールバックのままにするか、購入 CTA を弱める判断をする。
