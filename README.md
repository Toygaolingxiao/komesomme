# KomeSomme

KomeSomme（コメソム）は、日本のブランド米を味わいの地図から選べる選米ナビゲーションです。名前は kome と sommelier。画面の案内役は **米ソムリエ** です。

食べたい料理、今日の気分、合わせたいお酒を言葉にすると、地図上の位置と銘柄の解説から、今日の一膳が見えてきます。

## できること

- **味わいの地図** 左がすっきり澄む、右が甘みふくらむ。下が粒立ちしっかり、上がやわらか、ほどける。点の色は産地、形は米粒です。
- **探針** 地図を触ると、近い銘柄がすぐ並びます。相談すると、探針はおすすめの銘柄の位置へ移ります。
- **米ソムリエに相談** 「ハイボールと唐揚げに合う米」のように話しかけると、短い返事とおすすめの銘柄が返ります。
- **銘柄の詳細** 12 の味わい指標、季節や酒との相性、楽天・Amazon・ふるさと納税への案内。

対象は、スーパーの棚で迷う人、贈り物を選びたい人、酒とご飯の組み合わせを知りたい人です。

## 使い方

1. サイトを開く
2. 地図の好きな位置を置くか、スライダーを動かす
3. 右の「今日の一膳」から銘柄を開く
4. 料理やお酒、気分の言葉で相談するときは、下の入力から送る

Desktop は 100% 表示で一画面に収まります。Mobile は推薦 → 小さな地図 → 大きく見る、の順です。

## 開発者向け

Next.js 15 と Supabase で動いています。カタログは手書きの銘柄データから seed します。空のプロジェクトでは SQL Editor で [`0003_normalize_rice_catalog.sql`](./supabase/migrations/0003_normalize_rice_catalog.sql) のあと [`0004_restrict_embedding_access.sql`](./supabase/migrations/0004_restrict_embedding_access.sql)、[`0005_access_events.sql`](./supabase/migrations/0005_access_events.sql) を実行してください。0001 / 0002 は既存環境向けで、新規には不要です。Vercel 本番の env は [docs/vercel-production.md](./docs/vercel-production.md)。

```bash
npm install
cp .env.example .env.local
npm run validate:rice
npm run seed:rice
npm run dev
```

`.env.local` は `.env.example` をコピーして埋める。変数の意味は [docs/vercel-production.md](./docs/vercel-production.md)。

`npm run validate:rice` は 80 件以上、ID / 名称の重複なし、魚沼・佐渡・仁多・龍の瞳の独立行を見ます。禁止語は warning です。

`npm run seed:rice` は約 106 銘柄に embedding を付け、`rice_regions` / `rice_brands` / `rice_profile_details` へ upsert します。読み取りは VIEW `rice_catalog`。embedding モデルを変えたら再シードが必要です。地域色の正本は `src/lib/rice/regions.ts` と 0003 の upsert です。

相談の短い返事は Gemini `gemini-3.6-flash`（失敗時は OpenAI、それも失敗なら Flavor Bridge の reason）です。照合そのものは返事生成が落ちても Top 4 を返します。

### 手元での確認

http://localhost:3000 で:

- 点色が産地凡例と一致する
- Desktop でページ全体のスクロールが出ない。マップが左ペインいっぱいに広がる
- 探針やスライダーを動かすと、No.1 が常に最近傍
- 「ハイボールと唐揚げに合う米」で Top 4 が返る
- 銘柄詳細と `/[brand]` から楽天 / Amazon / ふるさと納税が開く

本番 URL での確認手順と記録欄は [docs/smoke-test.md](./docs/smoke-test.md)。

画面の約束は [docs/08-ui-design.md](./docs/08-ui-design.md)、DB は [docs/04-database.md](./docs/04-database.md)、技術振り返りは [docs/02-tech-retrospective.md](./docs/02-tech-retrospective.md)、文書一覧は [docs/README.md](./docs/README.md)。バージョンは [`VERSION`](./VERSION)。
