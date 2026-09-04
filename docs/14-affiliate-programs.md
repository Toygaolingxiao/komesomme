# アフィリエイト各社：実装メモと遵守要点

**法律意見ではない。** 正文は各社の最新規約。改定後は本ファイルの日付とリンクを更新する。

楽天 API と他モールの **DOM 隔離** は [13-affiliate-compliance.md](./13-affiliate-compliance.md)。  
公開 UI の定型文は `src/lib/affiliate.ts`。どの画面に何を出すかは [15-disclosure-surfaces.md](./15-disclosure-surfaces.md)。

---

## 1. Amazon アソシエイト

| 項目 | 内容 |
| --- | --- |
| 正文 | [Amazonアソシエイト・プログラム運営規約](https://affiliate.amazon.co.jp/help/operating/agreement?ac-ms-src=ac-nav)（確認した改定日: **2026/4/20**） |
| 日本の契約相手 | アマゾンジャパン合同会社 / amazon.co.jp |
| 準拠法 | 日本法。東京地裁・簡裁 |
| env | `NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG`（検索 URL の `tag=`） |
| 実装 | `amazonSearchUrl()` → `https://www.amazon.co.jp/s?k=…&tag=…` |

### 実装に効く条項（要約）

| 条 | サイトでやること |
| --- | --- |
| 1 | 紹介料は **特別リンク**（タグ付き）経由の適格販売のみ。PA-API の商品データはアマゾン・サイト向け。他店の商品データと混ぜない |
| 3 | Amazon の顧客は当サイトの顧客ではない。注文・CS は amazon.co.jp へ案内 |
| 5 | **必須表示（目立つ位置）:** 「Amazonのアソシエイトとして、KomeSommeは適格販売により収入を得ています。」Amazon の後援・提携を暗示しない |
| 5 違反 | 重大な違反としてアカウント停止・紹介料没収の対象になりうる（第 6 条） |
| 12 | プログラム・ポリシー（参加要件、IP ライセンス、商標ガイドライン、料率表）も拘束。Amazon ロゴの独自変形はしない |

PA-API（`AMAZON_ACCESS_KEY` / `SECRET`）は未接続。検索タグだけで第 1 条の特別リンクには足りる。

---

## 2. 楽天ウェブサービス（API）とアフィリエイト

アフィリエイト（成果）とウェブサービス（商品検索 API）は別契約。隔離の DOM 設計は [13-affiliate-compliance.md](./13-affiliate-compliance.md)。

| 項目 | 内容 |
| --- | --- |
| API 正文 | [楽天ウェブサービス規約](https://webservice.rakuten.co.jp/guide/rule)（英語ページ注記: 日本語原文が正文。英訳末尾の改定: **2012/6/28**） |
| クレジット | [クレジット表示方法と注意](https://webservice.rakuten.co.jp/guide/credit)（API 利用アプリは必須） |
| 契約相手 | 楽天グループ株式会社 |
| 準拠法 | 日本法。東京地裁（第20条） |
| アフィリエイト | [パートナー規約](https://affiliate.rakuten.co.jp/guideline/terms/)（制定 2003/5/1、確認時の末尾改定: **2022/2/1**）。[ガイドライン](https://affiliate.rakuten.co.jp/guideline/rule/)（確認時の更新: **2025/6/26**）。法人は別規約（非公開、審査後） |
| env | `RAKUTEN_APPLICATION_ID` / `RAKUTEN_ACCESS_KEY`（Server）、`NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID` |
| 実装 | 検索は `hb.afl.rakuten.co.jp/ichiba/{id}/`。Item Search があるとき href だけ商品 URL。カードに API の商品名・価格・画像は出さない |

### ウェブサービス規約：実装に効く条項（要約）

| 条 | サイトでやること |
| --- | --- |
| 2 | デベロッパーは楽天会員であること |
| 3 | 成果目的のリンクは楽天アフィリエイトで作る。パートナー規約に従う |
| 5 | アプリ ID / accessKey を漏らさない。`accessKey` は Server only |
| 7③ | アクセス回数などの制約に従う。`/api/rice/shop-links` にレート制限あり |
| 8④ | 楽天サイトへのリンクを置く（「楽天市場で探す」）。**API を使った DOM 部分**に他モールへのリンクを置かない。現状は混排カードに API フィールドを出さず href のみ |
| 8⑦ | クロール監視を妨害しない |
| 9 | 楽天商標はガイドラインどおり。独自ロゴ変形をしない |
| 10① | 「クリックしてください」嘆願、楽天グループとの提携暗示、最安・誤解表示、JADMA 自主基準違反を置かない |
| 10④⑤ | API 経由の収入は楽天アフィリエイト以外で取らない。同一楽天成果商品を他 ASP に載せない |
| 10⑥ | 楽天と競合する比価サービスに API を使わない |
| 10⑦⑨ | API の商品情報を公開 catalog / Git に保管しない。短時サーバーキャッシュのみ |
| 10⑩ | 特定人だけが使える閉じた環境での API 利用は原則禁止（公開サイトであること） |
| 11 | アプリは KomeSomme が制作・運営すると明示。楽天グループの一部ではない |
| 13 | 当社が求めるクレジット表示 → 下表の公式スニペット |
| 17③ | 違反時はリンク拒否・API 停止・アプリ ID 削除 |
| 19 | ウェブサービス / アプリについて事前書面承諾なくプレスリリースしない |

### クレジット表示（必須）

API を使うアプリは、[公式 3 パターン](https://webservice.rakuten.co.jp/guide/credit)のいずれか **HTML を改変せず**置く。画像の加工、楽天公式サイトであるかのような誤認、API を使っていないページへのバッジ転用は禁止。改変すると API 停止がありうる。

採用: テキスト（カード・フッター）。定数は `src/lib/rakuten/credit.ts`。

```
<!-- Rakuten Web Services Attribution Snippet FROM HERE -->
<a href="https://developers.rakuten.com/" target="_blank">Supported by Rakuten Developers</a>
<!-- Rakuten Web Services Attribution Snippet TO HERE -->
```

バナー画像版（221×21 / 311×30）を使う場合も同ページのソースをそのまま貼る。

### パートナー規約（公開ページから確認）

| 項目 | 内容 |
| --- | --- |
| 正文 | [楽天アフィリエイト パートナー規約](https://affiliate.rakuten.co.jp/guideline/terms/) |
| 付随 | [楽天アフィリエイトガイドライン](https://affiliate.rakuten.co.jp/guideline/rule/)、[成果報酬のルール](https://affiliate.rakuten.co.jp/guides/rank/)（規約第2条(11)で本規約等に含まれる） |
| 契約相手 | 楽天グループ株式会社。業務の一部はリンクシェア・ジャパン株式会社に委託（第4条3項） |
| 改定 | ページ末尾: 2022/2/1。ガイドラインは別途更新（確認時 2025/6/26） |

#### 規約で実装・運用に効く条

| 条 | やること |
| --- | --- |
| 2(11) | ガイドラインと料率ページも契約の一部 |
| 5① | **本番ドメインをアフィリエイトメディアとして登録**。追加・変更は直ちに再登録。未登録の Preview にアフィリンクを置かない → `rakutenAffiliateWrapEnabled()` |
| 5③ | リンク作成用コンテンツを所定の方法で使う。バナー HTML の独自改変はガイドライン禁止。検索 URL の `hb.afl.rakuten.co.jp/ichiba/{id}/?pc=` ラップは所定のリンク形式 |
| 6 | 誤解表示、クリック嘆願、楽天が取引を代理・保証するかのような文言、JADMA 自主基準違反を置かない |
| 8 | 不正クリック監視。リンク切れを直す。巡回クロールを妨害しない |
| 9 | 成果はクッキー等の識別技術。料率はジャンル・案件で異なる。高額支払いは本人確認。ユーザ個人情報は開示されない |
| 10 | 楽天商標の独自利用は許諾されていない |
| 14 | 違反時はリンク拒否・資格停止・報酬停止・キャッシュ失効・**過去報酬の返金請求** |
| 16 | 事前書面なく本サービスの機能についてプレスリリースしない |
| 18③ | 契約終了後はアフィリンクを直ちに削除（env の ID を空にして Redeploy） |

#### ガイドラインで効く禁止（2025/6/26）

| 項目 | KomeSomme |
| --- | --- |
| 自己・同居親族・示し合わせ購入 | 自分や家族はサイトの楽天ボタン経由で買わない |
| 未登録メディア・https 非対応 | 本番 HTTPS のみ。Preview はゲートで素の楽天 URL |
| 特定少数だけが見られる場所 | Discord / LINE 等にアフィリンクを貼らない |
| 認定 SNS 以外 | サイト本体はウェブメディア。SNS に載せるならガイドラインの認定 SNS のみ |
| リンク先が楽天と分からない | CTA は「楽天市場で探す」 |
| ステマ / 景表法 | 既存の「アフィリエイト広告」表示。最安・根拠なきランキング禁止 |
| 楽天ページのスクショ転載 | API 商品画像をカードに出さない現状と一致。出すならアフィ公式素材か権利処理 |
| 短縮 URL（楽天提供以外） | 使わない |
| 有料広告の着地を直接アフィ URL に | Google 広告等で楽天アフィ URL を最終 URL にしない |
| 1 サイト複数アカウント | しない |
| 競合サービス | 比価エンジンにしない |

食品ジャンルの市場料率目安はガイドライン上 4%（案件・キャンペーンで変動。管理画面が正）。

---

## 3. バリューコマース（ASP）— **廃止**

**2026-09: ValueCommerce は採用しない。** 転鎖ヘルパは常に無効。記録は [17-valuecommerce-reapply.md](./17-valuecommerce-reapply.md)。Yahoo は下記 §4 の公式短鎖、さとふるはプレーン検索。

以下は歴史メモ（再有効化しない）。

| 項目 | 内容 |
| --- | --- |
| 正文 | [アフィリエイトサイト運営者利用規約](https://www.valuecommerce.ne.jp/st_affiliate/terms.html) |
| 契約相手 | バリューコマース株式会社 |
| 実装 | `valueCommerceWrapEnabled()` は **常に false** |

本文は転載しない。改定通知（第32条）が来たらリンクと本表を更新する。

### 実装に効く条項（要約）

| 条 | サイト / 運用でやること |
| --- | --- |
| 1 | 本規約に付随する規則・ガイドラインも拘束 |
| 3 | VC が申込を承諾して契約成立。**承諾前に SID を本番へ入れない** |
| 4 | メディア審査。景表法違反の表現、内容の乏しいページ、ログイン必須の主要コンテンツは拒否対象。独自コンテンツ（味わい評価）を維持する |
| 5 | 提携可否の理由は開示されない |
| 8 | **広告主ごとの提携承認が別途必要**。Yahoo とさとふるは別 PID。承認前はプレーン検索のまま |
| 8・16・17 | 提携終了後は HTML / リンク / 周辺説明を遅滞なく外す → env の SID/PID を空にして Redeploy |
| 9 | 成果の正は VC トラッキング。広告主未承認の注文は報酬なし。報酬請求は広告主へ直接しない。月次 1,000 円未満は繰越 |
| 11④ | **原則「広告」であることの表示**（CTA の `※PR` + フッターの `AFFILIATE_PR_NOTICE`） |
| 11② | 不正クリック・虚偽注文が起きないよう管理。自己クリックしない |
| 12 | 継続的に広告を最低 1 つ掲載するよう努める（購入 CTA が該当） |
| 14 改変 | 公式の referral クエリ（`sid` / `pid` / `vc_url`）以外に広告コードを改変しない。バナー HTML を独自改変しない |
| 14 掲載場所 | **VC に登録したメディア以外へ広告コードを置かない**（Vercel Preview、未登録ドメイン、SNS 投稿は事前承諾がない限り不可） |
| 14 禁止語句 | 「クリックして」報酬を嘆願する文言、誤解を招く誘導を置かない。CTA は「探す」に留める |
| 14 自己注文 | 自サイトの広告経由で自分は注文しない。自分で買うときは [バリューポイントクラブ](https://www.value-point.jp/terms/) 経由（下記） |
| 14 ランキング | 掲載順位は根拠のある編集評価のみ。広告主指定の順位には応じない |
| 14 SEM | 広告主指定キーワード・権利侵害 KW を検索連動広告で買わない |
| 14 報酬還元 | ユーザーへアフィ報酬を還元しない |
| 19 | VC は監視し、不正と判断すれば報酬拒否・即時登録解除できる |
| 29 | 1 年以上未ログイン / 未配信 / 未クリックで登録解除されうる。管理画面は定期ログインする |
| 10③ | 規約違反で解除されると未払報酬も出ない |

### 転鎖ゲート

| 条件 | 転鎖するか |
| --- | --- |
| SID または PID が空 | しない |
| `VALUE_COMMERCE_WRAP=0` | しない |
| `VERCEL_ENV=preview` または `development` | しない（明示 `WRAP=1` 以外） |
| `VERCEL_ENV=production` かつ SID+PID | する |
| ローカルで試す | `VALUE_COMMERCE_WRAP=1` が必要。localhost が未登録なら規約上やってはいけない |

公式転鎖（コード済）:

```
https://ck.jp.ap.valuecommerce.com/servlet/referral?sid={SID}&pid={PID}&vc_url={encodeURIComponent(targetUrl)}
```

Yahoo ItemSearch の `affiliate_id` は `http://ck.jp.ap.valuecommerce.com/servlet/referral?sid=&pid=&vc_url=`（API 仕様）。ゲートが off のときは `affiliate_type=vc` も付けない。

### バリューポイントクラブ（運営者個人。サイトには出さない）

| 項目 | 内容 |
| --- | --- |
| 正文 | [会員利用規約](https://www.value-point.jp/terms/)（確認した改定: **2022/4/1**） |
| 対象 | 運営者（または契約者個人）が **自分で** ショップを買うときのポイント還元。KomeSomme の公開 UI・報酬還元ではない |
| 準拠法 | 日本法。東京地裁（第21・23条） |

アフィリエイト運営者規約第14条「自己注文」は、自分の広告リンク経由の購入を禁じ、例外として本クラブ経由を指定する。第14条「報酬還元」により、**エンドユーザーへポイントや現金を還元する機能を KomeSomme に載せない**。コード・CTA・フッターに value-point.jp は置かない。

連坐（どちらか落ちると両方落ちる）:

| 方向 | 条文 |
| --- | --- |
| アフィリエイト契約が解約される | ポイントクラブ会員資格も同時喪失（本規約第32条） |
| ポイントクラブ会員資格を喪失する | アフィリエイト契約も事前通知なく解除（運営者規約第30条末項） |
| 運営者規約違反でアフィ解約 | ポイントも消滅（本規約第33条3項） |

運用メモ:

| 条 | やること |
| --- | --- |
| 3・6 | 一個人一登録。未成年・国外居住・他人名義メール・第三者委託申込は不可。本人確認資料を求められることがある |
| 6(4)・30 | 複数アカウントを作らない。ポイントの合算・譲渡・売買は不可 |
| 15④ | 各ショップの「ポイント付与条件」を守る。KomeSomme の CTA とは別経路 |
| 24〜28 | 付与率・対象ショップはクラブサイトの告知が正。取消・返品でポイントは付かない |
| 29 | 退会・不正・返品指示などでポイント消滅。一般会員は 2 年未ログインでも消滅 |
| 31 | 1,000 ポイント到達後、月末締め・翌々月 15 日振込。口座名義は登録氏名と揃える |
| 33 | 退会後はポイント還元とアフィ報酬の合計が 1,000 円以上なら第31条2項のスケジュールで支払。口座不備が 1 年続くと消滅 |
| 34 | 条文は「第28条1号を適用しない」（タイトルは不失効）。趣旨はアフィ運営者について 2 年未ログイン消滅を外す読みが自然だが、正文の条番号が第29条(1)とずれている。改定通知が来るまで公式文言に従い、失効の扱いは管理画面で確認する |

プライバシー: クラブ経由購入時、ショップから注文個数・金額・日時・ユーザー環境が会員情報に紐づく（第25条）。これは運営者個人のクラブ契約であり、KomeSomme の `/privacy` がユーザーに説明する対象ではない。

---

## 4. Yahoo!ショッピング（公式短鎖 / 検索）

| 項目 | 内容 |
| --- | --- |
| 成果 | VC 上の Yahoo!ショッピング案件。**提携承認後**に SID / PID |
| 商品 API | [Yahoo!ショッピング ItemSearch](https://developer.yahoo.co.jp/webapi/shopping/shopping/v1/itemsearch.html)（任意。成果とは別契約） |
| env | `YAHOO_CLIENT_ID`（Server）、`YAHOO_VC_SID`、`YAHOO_VC_PID` |
| 実装 | ゲート通過後に検索 URL または商品 URL を包む |

広告主側の禁止事項・掲載規定は管理画面の案件詳細が正文。承認時に本節へ箇条書きする。

クライアント直出しリンクにも付けたい場合のみ `NEXT_PUBLIC_YAHOO_VC_*`。Preview には置かない。

### 公式ショッピングアフィリエイト短鎖（VC 不使用）

ValueCommerce 未承認の間は、LINE Yahoo ショッピング公式の**検索結果**短鎖（`https://yahoo.jp/xxxx`）を銘柄ごとに手貼りする。商品 SKU 短鎖は使わない。

| 項目 | 内容 |
| --- | --- |
| 表 | Supabase `yahoo_shopping_affiliate_links`（migration 0006） |
| 記入 | 観測台 [`/ops/yahoo`](../src/app/ops/yahoo/page.tsx) の「推广链接」列。Table Editor でも可 |
| 実行時 | `promo_url` があれば Yahoo CTA に使う。空なら従来の検索 URL |
| 時刻 | `recorded_at` はトリガが書く。観測台は東京時間で表示 |
| 同期 | `npm run yahoo:sync`（名称行だけ。既存の短鎖は上書きしない） |

### 公式ふるさと納税アフィリエイト短鎖（VC 不使用）

Yahoo ふるさと CTA も同じ `yahoo.jp` 検索結果短鎖。通販表とは別（検索語が違う）。

| 項目 | 内容 |
| --- | --- |
| 表 | Supabase `yahoo_furusato_affiliate_links`（migration 0012） |
| 記入 | 観測台 [`/ops/yahoo-furusato`](../src/app/ops/yahoo-furusato/page.tsx) |
| 実行時 | `promo_url` があればふるさと Yahoo CTA に使う。空ならプレーン検索 |
| 同期 | `npm run yahoo:sync:furusato` |

楽天ふるさとは `wrapRakutenAffiliateUrl`（本番で `NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID`）。Yahoo ふるさとに楽天 ID は付けない。

---

## 5. メルカリ（検索結果アフィ）

| 項目 | 内容 |
| --- | --- |
| プログラム | [メルカリアンバサダー](https://jp-news.mercari.com/articles/2023/12/05/mercari-ambassador/)（個人向け。検索結果・商品ページともリンク成果の対象） |
| env | `NEXT_PUBLIC_MERCARI_AFID`（公開クエリ `afid=`。未設定時はコード側フォールバック） |
| 実装 | `mercariSearchUrl()` → `https://jp.mercari.com/search?keyword=…&afid=…` |
| UI | 通販タブの 4 本目カプセル。公式ウィジェット HTML は埋め込まない（自前カプセル＋※PR） |

商品ウィジェットではなく**検索リンク**でよい。キーワードは他モールと同じ `shopQuery`（産地・銘柄・白米）。管理画面で発行した afid を本番 env に置く。

---

## 6. さとふる（プレーン検索）

| 項目 | 内容 |
| --- | --- |
| 検索 | `SATOFULL_SEARCH_BASE_URL`（既定: `https://www.satofull.jp/products/list.php?q=`） |
| 成果 | 自由テキスト / MyLink。`SATOFULL_VC_SID` / `SATOFULL_VC_PID`（Yahoo と番号が違うことが多い） |
| 実装 | `wrapSatofullSearchUrl()`。カードは `/api/rice/shop-links`（サーバー）。上部「ふるさと納税で探す」はクライアントのため、ゲート用 env がブラウザに出ない限りプレーン URL |

さとふる案件の提携条件・ふるさと納税特有の表記は契約書で再確認。未承認の間はタグなし検索のまま。

---

## 7. 景表法（ステマ規制）との関係

Amazon 第 5 条定型文は **フッター一箇所**（`AffiliateDisclosure` `full`）。購入 CTA 横は `※PR` のみ。ASP 名の列挙は `/terms`。詳細は [15-disclosure-surfaces.md](./15-disclosure-surfaces.md)。外链は `rel="noopener noreferrer nofollow"`。「最安」「公式最安」、Amazon / 広告主の後援を示す文言は置かない。

---

## 8. コード対応表

| ファイル | 役割 |
| --- | --- |
| `src/lib/rakuten/affiliate.ts` | 検索 URL とアフィ包装。未登録 Preview では包まない |
| `src/lib/affiliate.ts` | Amazon tag、メルカリ afid、VC 転鎖とゲート、開示文定数 |
| `src/lib/affiliate/yahoo.ts` | ItemSearch。ゲート off なら `affiliate_type=vc` なし |
| `src/lib/affiliate/yahooPromo.ts` | Supabase の `promo_url`（通販・ふるさと別表）。未記入・表未作成は検索 URL |
| `src/app/api/rice/shop-links/route.ts` | 通販 4 + ふるさと 3 をサーバーで解決 |
| `src/components/AffiliateDisclosure.tsx` | `pr` = ※PR。`full` = フッター用（Amazon + 短 PR + 楽天クレジット） |
| `src/components/ShopLinksStrip.tsx` | 通販 4 / ふるさと 3 カプセル。塗りは内側 span |
| `src/components/RiceProductCard.tsx` | 通販 / ふるさと CTA。開示は `pr`（定型はフッター） |
| `src/components/SiteFooter.tsx` | サイト全体の `full` 開示 |
| [15-disclosure-surfaces.md](./15-disclosure-surfaces.md) | 表面一覧の正本 |
