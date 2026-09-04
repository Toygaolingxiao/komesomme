# バリューコマース — 廃止記録

**2026-09 以降、KomeSomme は ValueCommerce を採用しない。**

2026-08 にサイト登録が見送られたあと、再申請は行わない方針に切り替えた。Yahoo!ショッピングは **公式アフィリエイト短鎖**（通販 `yahoo_shopping_affiliate_links` / `/ops/yahoo`、ふるさと `yahoo_furusato_affiliate_links` / `/ops/yahoo-furusato`）またはプレーン検索 URL。さとふるはプレーン検索。楽天・Amazon は従来どおり。

## コード上の扱い

| 項目 | 状態 |
| --- | --- |
| `valueCommerceWrapEnabled()` | **常に false**（環境変数では再有効化しない） |
| `wrapValueCommerceIfReady` | 入力 URL をそのまま返す |
| `YAHOO_VC_*` / `SATOFULL_VC_*` / `VALUE_COMMERCE_WRAP` | `.env.example` から削除。Production にも置かない |
| 開示文 | `/terms`・`/privacy`・`AFFILIATE_PR_NOTICE_DETAIL` から VC 名を除去 |

旧・再申請自己点検の詳細は git 履歴（本ファイルの 2026-08 版）を参照。

関連: [14-affiliate-programs.md](./14-affiliate-programs.md)、[15-disclosure-surfaces.md](./15-disclosure-surfaces.md)。
