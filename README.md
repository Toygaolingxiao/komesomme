# KomeSomme 侍米師

KomeSomme 侍米師（じべいし）は、日本のブランド米を味わいの地図から探すサイトです。

食べたい料理、今日の気分、合わせたいお酒を言葉にすると、地図上の位置と銘柄の解説から、今日の一膳が見えてきます。インストールは要りません。下の表から、動いているサイトと読み物へ進めます。番号は [`VERSION`](./VERSION)。

| 見たいもの | どこを開く |
| --- | --- |
| デモ（本番サイト） | [https://komesomme.jp](https://komesomme.jp) |
| プロジェクト紹介（短い概要） | [docs/00-overview.md](./docs/00-overview.md) |
| プロジェクト紹介（1.0.0 の記録） | [docs/assets/komesomme-1.0.0-case-study.html](./docs/assets/komesomme-1.0.0-case-study.html) |

## デモの見方

ブラウザで [https://komesomme.jp](https://komesomme.jp) を開きます。アカウントはありません。パソコンは画面幅を 100% のまま見る想定です。電話では、おすすめ、小さな地図、大きく見る、の順に下がります。

### 味わいの地図

[https://komesomme.jp](https://komesomme.jp)

左がすっきり澄む、右が甘みふくらむ。下が粒立ちしっかり、上がやわらか、ほどける。点の色は産地、形は米粒です。

1. 地図の好きな位置を置くか、スライダーを動かす
2. 右の「今日の一膳」から銘柄を開く
3. 料理やお酒、気分を言葉にするときは、下の入力に書いて送る。試し文は「ハイボールと唐揚げに合う米」

地図を触ると、近い銘柄が並びます。相談を送ると、探針はおすすめの位置へ移ります。

ヘッダ（画面が狭いときは下のタブ）から、次のページへ進めます。

| ページ | リンク | 中身 |
| --- | --- | --- |
| 料理で選ぶ | [https://komesomme.jp/pair](https://komesomme.jp/pair) | カレー、刺身、弁当、唐揚げなど、料理ごとの銘柄 |
| 唐揚げの例 | [https://komesomme.jp/pair/karaage](https://komesomme.jp/pair/karaage) | 一品のページ |
| ライブラリ | [https://komesomme.jp/library](https://komesomme.jp/library) | 銘柄の一覧 |
| 魚沼コシヒカリの例 | [https://komesomme.jp/library/koshihikari-uonuma](https://komesomme.jp/library/koshihikari-uonuma) | 由来、炊き方、お店で探す |
| ピックアップ | [https://komesomme.jp/discover](https://komesomme.jp/discover) | きょうの三銘柄と、旬の特集 |
| 特集の例 | [https://komesomme.jp/collections/bento-cold](https://komesomme.jp/collections/bento-cold) | 「冷めても、弁当に」 |

銘柄ページの「お店で探す」は、通販（楽天 / Yahoo! / Amazon）とふるさと納税（楽天 / Yahoo! / さとふる）の切替です。当サイトでは米そのものは売りません。

法務のページは [利用規約](https://komesomme.jp/terms)、[プライバシーポリシー](https://komesomme.jp/privacy)、[特定商取引法に基づく表記](https://komesomme.jp/tokushoho) です。

## プロジェクト紹介の見方

紹介は二つです。先に短い概要、あとから一枚の記録、の順が読みやすいです。

### 1. 短い概要

[docs/00-overview.md](./docs/00-overview.md)

いまのサイトが誰向けで、本番に何があるかを数分で読めます。GitHub ではこのファイルを開くと、整形された文章になります。文書の一覧が要るときは [docs/README.md](./docs/README.md) です。

### 2. 1.0.0 の記録

[docs/assets/komesomme-1.0.0-case-study.html](./docs/assets/komesomme-1.0.0-case-study.html)

タイトルは「KomeSomme 1.0.0 — 技術実験の記録」です。本番サイトとは別の HTML で、背景、体験、設計、公開の判断までを一枚にしています。右上の「公開サイト」から [https://komesomme.jp](https://komesomme.jp) に戻れます。

ページ上部の順は、要点、体験、独自性、設計、検証、結論です。本文の「読む順番」では、流れ、体験、独自性、設計、検証、道筋、結論と続きます。

あとの改稿は [docs/assets/komesomme-1.4.1-case-study.html](./docs/assets/komesomme-1.4.1-case-study.html) にあります。紹介として開くのは 1.0.0 のほうです。

GitHub のファイル画面はソースが見えるだけで、ページとしては動きません。次のどちらかでブラウザに出してください。

1. ファイルを保存し、手元のブラウザで開く。リポジトリをクローンしているときは、`docs/assets/komesomme-1.0.0-case-study.html` をブラウザへドロップします。
2. リポジトリが公開になっているときは、このプレビューで開けます。  
   [htmlpreview: 技術実験の記録](https://htmlpreview.github.io/?https://github.com/Toygaolingxiao/komesomme/blob/main/docs/assets/komesomme-1.0.0-case-study.html)

## 開発者向け

Next.js 15 と Supabase で動いています。旧 URL の 308 は `src/middleware.ts` と `next.config` の redirects。末尾スラッシュは middleware が先に畳む。カタログは手書きの銘柄データから seed します。空のプロジェクトでは SQL Editor で [`0003_normalize_rice_catalog.sql`](./supabase/migrations/0003_normalize_rice_catalog.sql) のあと [`0004_restrict_embedding_access.sql`](./supabase/migrations/0004_restrict_embedding_access.sql)、[`0005_access_events.sql`](./supabase/migrations/0005_access_events.sql)、Yahoo 短鎖を使うなら [`0006_yahoo_shopping_affiliate_links.sql`](./supabase/migrations/0006_yahoo_shopping_affiliate_links.sql) を実行してください。0001 / 0002 は既存環境向けで、新規には不要です。Vercel 本番の env は [docs/vercel-production.md](./docs/vercel-production.md)。

```bash
npm install
cp .env.example .env.local
npm run validate:rice
npm run seed:rice
npm run dev
```

`.env.local` は `.env.example` をコピーして埋める。変数の意味は [docs/vercel-production.md](./docs/vercel-production.md)。

`npm run validate:rice` は 80 件以上、ID / 名称の重複なし、魚沼・佐渡・仁多・龍の瞳の独立行を見ます。禁止語は warning です。

`npm run seed:rice` は約 106 銘柄に embedding を付け、`rice_regions` / `rice_brands` / `rice_profile_details` へ upsert します。読み取りは VIEW `rice_catalog`。embedding モデルを変えたら再シードが必要です。地域色の正本は `src/lib/rice/regions.ts`。既存プロジェクトは `0011_rice_region_appetite_colors.sql` か `npm run seed:rice` で `rice_regions.color` を揃えます。

相談の短い返事は Gemini `gemini-3.6-flash`（失敗時は OpenAI、それも失敗なら Flavor Bridge の reason）です。照合そのものは返事生成が落ちても Top 4 を返します。

### 手元での確認

http://localhost:3000 で:

- 点色が産地凡例と一致する
- Desktop で第一画面にページ全体のスクロールが出ない。マップが左ペインいっぱいに広がる。サイト説明の案内帯は HTML に残し、画面では届かない
- 探針やスライダーを動かすと、No.1 が常に最近傍
- 「ハイボールと唐揚げに合う米」で Top 4 が返る
- 銘柄事典 `/library/[id]` から通販 / ふるさと納税の各モールが開く（旧 `/{id}` はリダイレクト）

本番 URL での確認手順と記録欄は [docs/smoke-test.md](./docs/smoke-test.md)。

画面の約束は [docs/08-ui-design.md](./docs/08-ui-design.md)、DB は [docs/04-database.md](./docs/04-database.md)、技術振り返りは [docs/02-tech-retrospective.md](./docs/02-tech-retrospective.md)、構想からの経緯は [docs/12-product-journey.md](./docs/12-product-journey.md)（中文）、1.x 成長は [docs/20-growth-plan.md](./docs/20-growth-plan.md)（次の一手は §4.0）、進め方は [docs/25-dev-playbook.md](./docs/25-dev-playbook.md)、職業定位（運営者向け・中文）は [docs/22-career-positioning.md](./docs/22-career-positioning.md)、並行作業は [docs/24-collaboration.md](./docs/24-collaboration.md)（中文）、文書一覧は [docs/README.md](./docs/README.md)。バージョンは [`VERSION`](./VERSION)。
