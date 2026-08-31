# 本番 RLS 実測手順（P0-2）

0004 適用後、**anon key** で次を確認する。書き込みは service role のみ。

## 1. SQL Editor で 0004 を実行

[`supabase/migrations/0004_restrict_embedding_access.sql`](../supabase/migrations/0004_restrict_embedding_access.sql)

## 2. anon として拒否されること

Supabase → Settings → API の `anon` `public` キーで REST を叩く（または SQL を `set role anon` できる環境）。

期待: **失敗**（permission denied）

```http
GET /rest/v1/rice_profile_details?select=embedding,search_text&limit=1
apikey: <ANON_KEY>
Authorization: Bearer <ANON_KEY>
```

## 3. anon として成功すること

期待: **200** と銘柄行（`embedding` 列は無い）

```http
GET /rest/v1/rice_catalog?select=id,name,region_color&limit=3
apikey: <ANON_KEY>
Authorization: Bearer <ANON_KEY>
```

```http
GET /rest/v1/rice_regions?select=id,name,color&order=sort_order
apikey: <ANON_KEY>
Authorization: Bearer <ANON_KEY>
```

## 4. RPC が anon から呼べないこと

期待: **失敗**

```http
POST /rest/v1/rpc/match_rice_profiles
```

（本文にダミー embedding を入れても権限エラーになること）

## 5. アプリ確認

- 本番 / Preview URL で味わい地図が表示される
- 「侍米師に相談」が Top 4 を返す（サーバーは service role）

## 完了条件

[11-launch-checklist.md](./11-launch-checklist.md) の P0-2b〜c は実測済み。P0-2d は CI `assert:client-bundle` + 起動時 JWT 検査。本番 Network の目視は Redeploy 後。

## 実測メモ

- 2026-08: A（details → 42501）、B（catalog / regions OK）、C（地図・相談 OK）を確認済み。
