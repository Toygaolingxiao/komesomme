# Embedding・意味検索設計

現行の「侍米師に相談」は、LLM に文章を生成させる RAG chat ではない。自然言語を embedding に変換し、保存済み `search_text` ベクトルとの近さで Top 4 を返す意味検索である。理由文は決定論的な Flavor Bridge が付ける。

## 1. search_text

`buildRiceSearchText` が JSON を stringify せず、空フィールドを除いた自然な日本語を改行結合する。相談文（「ハイボールと唐揚げに合う米」など）と向き合うため、フィールド名のノイズを入れない。

含める内容: 銘柄・産地・象限・食感/甘みラベル、短評、説明、侍米師メモ、料理、季節、酒、気分・場面、タグ、検索意図。

## 2. プロバイダ

`src/lib/embedding/index.ts` が切替を担う。次元はどちらも 1536。

| 項目 | Gemini | OpenAI |
| --- | --- | --- |
| env | `EMBEDDING_PROVIDER=gemini`（既定） | `openai` |
| モデル | `gemini-embedding-001` | `text-embedding-3-small` |
| 鍵 | `GEMINI_API_KEY` | `OPENAI_API_KEY` |
| 正規化 | MRL 1536 切詰後に L2 | L2（念のため） |

異なるモデルのベクトルは比較できない。`rice_profiles.embedding_model` に生成モデルを記録し、RPC は同モデルの行だけを対象にする。切替後は再シードが必要。

## 3. シード

`npm run seed:rice` → `scripts/seed-rice-profiles.ts`

1. `riceProfiles` を走査する
2. `buildRiceSearchText` で本文を作る
3. `createEmbeddingWithRetry`（指数バックオフ + jitter、最大5回）
4. `rice_profiles` へ upsert（`onConflict: id`）、`embedding_model` も書き込む
5. 銘柄間は 1 秒間隔

## 4. 検索時

```text
相談フォーム
  → POST /api/rice/semantic-recommend { query, matchCount: 4 }
  → createEmbedding
  → RPC match_rice_profiles (p_embedding_model, match_count, match_threshold)
  → Flavor Bridge で reason を付与
  → JSON { query, embeddingModel, matches }
```

- Route: `src/app/api/rice/semantic-recommend/route.ts`
- Runtime: Node.js
- Response: 非 Streaming JSON
- query: trim 後最大 500 文字
- matchCount: 1〜10、既定 4
- match_threshold: 0.1
- score: similarity を 0–100 の整数に丸める

マップとスライダーはこの API を呼ばない。探針座標は意味検索では動かさない。

## 5. Flavor Bridge

`src/lib/rice/flavorBridge.ts`。LLM は呼ばない。

問い合わせから酒種を判定する: ハイボール / スモーキー / シェリー樽 / バーボン / ジャパニーズウイスキー / 日本酒 / ビール / ワイン / 茶。汎用の「ウイスキー」はジャパニーズへ倒す。

酒種が無い場合は弁当・カレー・刺身・疲れ・秋・すき焼き・夏などの場面ルール、それも無ければ銘柄の `pairing_reason` を使う。

## 6. エラーと秘密情報

- 鍵はサーバー環境変数のみ
- 空 query は 400、embedding / RPC 失敗は 502、設定不足は 500
- 内部例外をレスポンスへ出さない
- Browser から embedding プロバイダを直接呼ばない

## 7. 将来仕様: LLM 文章生成

文章生成を追加する場合も、先に embedding 検索を完了し、Top 4 以外を創作させない。System Prompt、streaming、rate limit は未決定。
