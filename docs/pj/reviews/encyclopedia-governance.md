# 百科データガバナンス

Git の `src/data/rice/encyclopedia/` が正本。Supabase は公開ミラーと溯源クエリ用（`0013_rice_encyclopedia.sql` → `npm run seed:encyclopedia`）。

## ディレクトリ

| パス | 役割 |
| --- | --- |
| `articles/*.json` | 公開文案（106） |
| `sources/registry.json` | 公式／準公式 URL（`url` 必須。捏造禁止） |
| `claims/<brand_id>.json` | 事実クレームと `source_ids` |
| `manifest.json` | 一覧用ヘッドライン |

## 事実ステータス

- 篇級 `factStatus`: `verified` | `partial` | `unverified`
- Claim `status`: `verified` | `partial` | `unverified` | `removed` | `tradition`
- `verified` / `partial` の claim は `source_ids` 必須（`encyclopedia:audit` で検査）
- 特A・献上・金賞の断定は registry URL が無い限り弱化または `removed` / `unverified`

## URL 登録の優先順位

1. 農研機構・品種公開ページ  
2. 都道府県のブランド米／農林公式  
3. 日本穀物検定協会（食味ランキング／特A）  
4. 産地協議会・品種公式ブランド  
5. 見つからない叙述は文面を弱化し、偽リンクを付けない（最低でも `maff-kome` を篇級入口とする）

## 作業フロー

1. `npm run encyclopedia:merge`（Gemini HEAD 快照 + GPT 批次 → 合稿）  
2. `npm run encyclopedia:facts`（registry / claims / `factStatus`）  
3. `npm run encyclopedia:audit`（findings 0）  
4. SQL Editor で `0013_rice_encyclopedia.sql`  
5. `npm run seed:encyclopedia`

ランタイムの事典表示は当面 Git `loadEncyclopediaArticle`。DB 切替は別タスク。

## 1B 完了定義（本ラウンド）

- 106 篇すべてに `claims/<id>.json`  
- 篇級 `factStatus` は `verified` または `partial`  
- 各篇 `sourceIds.length >= 1` かつ registry の `url` が http(s)  
- 受賞系の硬断定は source 無しで `verified` にしない  
