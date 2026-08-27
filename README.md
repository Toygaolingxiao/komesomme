# KomeSomme

KomeSomme（コメソム）は、日本のブランド米を「粒感」と「甘み」の地図から選べる選米ナビゲーションです。名前は kome と sommelier。画面の案内役は **米ソムリエ** です。

食べたい料理、今日の気分、合わせたいお酒を言葉にすると、地図上の位置と銘柄の解説から、今日の一膳が見えてきます。

## できること

- **味わいの地図** 左がしっかり、右がやわらか。上がふくよか、下がすっきり。点の色は産地、大きさは粘りです。
- **探針** 地図を触ると、近い銘柄がすぐ並びます。
- **米ソムリエに相談** 「ハイボールと唐揚げに合う米」のように話しかけると、短い返事とおすすめの銘柄が返ります。
- **銘柄の詳細** 12 の味わい指標、季節や酒との相性、楽天・Amazon・ふるさと納税への案内。

対象は、スーパーの棚で迷う人、贈り物を選びたい人、酒とご飯の組み合わせを知りたい人です。

## 使い方

1. サイトを開く
2. 地図の好きな位置を置くか、下の粒感・甘みを動かす
3. 右の「米ソムリエのおすすめ」から一膳を開く
4. 料理やお酒の言葉で相談するときは、下の入力から送る

## 開発者向け

Next.js と Supabase で動いています。カタログは手書きの銘柄データから seed します。

```bash
npm install
cp .env.example .env.local
```

空の Supabase プロジェクトでは SQL Editor で [`supabase/migrations/0003_normalize_rice_catalog.sql`](./supabase/migrations/0003_normalize_rice_catalog.sql) を実行し、そのあと:

```bash
npm run validate:rice
npm run seed:rice
npm run dev
```

必要な環境変数は `.env.example` を見てください。相談機能は Gemini（または OpenAI）の embedding と、短い返事の生成を使います。

詳細なデータ設計は [docs/database_schema.md](./docs/database_schema.md)、画面の約束は [docs/ui_design.md](./docs/ui_design.md) です。
