# Vercel 本番環境セットアップ（P0-6）

コード側の防護（レート制限・0004 RLS・CI）のあと、ダッシュボードで揃える項目。

## 1. Environment Variables

Vercel → Project → **Settings → Environment Variables**。

| 変数 | Production | Preview | 注意 |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | 本番プロジェクト | 本番 or 別検証用 | `NEXT_PUBLIC_` のみブラウザに出る |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon | anon | **service_role をここに置かない** |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role | 必要なら | Server only。名前に `NEXT_PUBLIC_` を付けない |
| `EMBEDDING_PROVIDER` | `gemini` 等 | 同左 | DB の `embedding_model` と一致 |
| `GEMINI_API_KEY` | 本番鍵 | 同 or 別 | |
| `OPENAI_API_KEY` | 任意（控え） | 任意 | |
| `SEMANTIC_RECOMMEND_ENABLED` | `true` | `true` | 異常時は `false` で相談だけ止める |
| `SEMANTIC_RATE_LIMIT_PER_MIN` | `8`（目安） | 同左 | |
| `SEMANTIC_RATE_LIMIT_PER_DAY` | `80`（目安） | 同左 | |

アフィリエイト用（週末以降）:

| 変数 | 用途 |
| --- | --- |
| `RAKUTEN_AFFILIATE_ID` 等 | 実装後に追加（いまはコード未接続でも env だけ先に置ける） |

変更後は **Redeploy** する。

## 2. 分離の目安

- **Production**: 本番 Supabase + 本番 AI 鍵  
- **Preview**: できれば別 Supabase、または同じでも相談上限を厳しく  

## 3. デプロイ後の確認（2 分）

1. 本番 URL で地図が出る  
2. 相談が Top 4 を返す  
3. DevTools → Network → 任意 HTML の Response Headers に  
   `X-Frame-Options: SAMEORIGIN`、`X-Content-Type-Options: nosniff` がある  
4. クライアント JS や Network に `service_role` 文字列が **無い**

## 4. ロールバック

Vercel → **Deployments** → 直前の Successful を **⋯ → Promote to Production**（または Redeploy 旧デプロイ）。

相談だけ止めたいとき: `SEMANTIC_RECOMMEND_ENABLED=false` → Redeploy（地図は生きたまま）。

## 5. 独自ドメイン（P0-6d）

Domains で追加 → DNS 指示どおり → HTTPS 自動。証明書エラーが消えたら Done。

## 関連

- 相談防護: [03-system-design.md](./03-system-design.md) §4–5  
- RLS 実測: [rls-verify.md](./rls-verify.md)  
- 全体: [11-launch-checklist.md](./11-launch-checklist.md)
