# Gemini Embedding・意味検索設計

## 1. 現行仕様: embedding-only

現行の「侍米師に相談」は、LLM に文章を生成させる RAG chat ではない。自然言語を embedding に変換し、保存済み銘柄ベクトルとの近さで Top 4 を返す意味検索である。

### 1.1 シード時

`scripts/seed.ts` が各銘柄について次のテキストを作る。

```text
{description}
相性の良い料理: {best_match_dishes を「、」で連結}
```

処理:

1. Gemini `gemini-embedding-001` の `embedContent` を呼ぶ
2. `outputDimensionality: 1536` を指定する
3. 1536 次元へ切り詰めた MRL 出力を L2 正規化する
4. Supabase `rice_brands.embedding`（`vector(1536)`）へ保存する
5. rate limit を避けるため逐次実行し、失敗時は jitter 付き exponential backoff で最大5回試行する

### 1.2 検索時

```text
相談フォーム
  → POST /api/recommend { query, matchCount: 4 }
  → Gemini embedContent
  → 1536次元であることを検証
  → L2正規化
  → Supabase RPC match_rice_brands
  → JSON { matches: [...] }
```

- Route Handler: `src/app/api/recommend/route.ts`
- Runtime: Node.js（`runtime = "nodejs"`）
- Response: 非 Streaming JSON
- query: trim 後に最大 500 文字
- matchCount: 1〜10、既定値 4
- match threshold: 現行値 0
- similarity: pgvector の cosine distance に基づく RPC 戻り値

UI は返された銘柄 ID を読み込み済みプロフィールへ対応付け、similarity 順の No.1 と No.2〜4 を表示する。探針座標は変更しない。

## 2. 現行仕様に含まれないもの

- chat completion / generateContent
- LLM による推薦理由や炊飯助言の生成
- System Prompt
- 検索結果を Prompt context に連結する処理
- token streaming
- OpenAI API、`text-embedding-3-small`、`gpt-4o-mini`
- hardness / sweetness の server-side hard filter

画面上の推薦理由は、座標差または意味検索モードに応じたローカルの定型文である。

## 3. エラーと秘密情報

- `GEMINI_API_KEY` と `SUPABASE_SERVICE_ROLE_KEY` はサーバー環境変数として扱う
- 空 query / 不正 JSON は 400、embedding または RPC の上流失敗は 502、設定不足は 500 の JSON を返す
- Gemini や Supabase の内部エラー詳細はレスポンスへそのまま返さない
- Browser から Gemini を直接呼ばない

## 4. 将来仕様: LLM 文章生成

文章生成を追加する場合に限り、検索 Top 4 を grounding context として LLM へ渡す。embedding-only 検索を先に完了させ、その結果以外の銘柄や属性を創作させない。

将来の System Prompt が満たすべき条件:

- 日本の米と料理のペアリングに限定する
- 選んだ銘柄と、粒感・甘み・粘り・相性料理に基づく理由を簡潔に説明する
- DB にない生産者、価格、栄養、炊飯条件を断定しない
- Prompt injection で system instruction や秘密情報を開示しない
- 検索結果が空の場合は推薦を捏造せず、条件変更を案内する

文章生成 API の model、Prompt 本文、出力 schema、streaming 採否、rate limit、評価方法は未決定であり、現行仕様として扱わない。
