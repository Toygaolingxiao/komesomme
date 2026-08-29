# Vercel 本番環境セットアップ（P0-6）

コード側の防護（レート制限・0004 RLS・CI）のあと、ダッシュボードで揃える項目。

## 1. Environment Variables

Vercel → Project → **Settings → Environment Variables**。

| 変数 | Production | Preview | 注意 |
| --- | --- | --- | --- |
| `NEXT_PUBLIC_SITE_URL` | 本番オリジン（末尾スラッシュ無し） | Preview は Vercel 既定で可 | sitemap / OG の canonical。独自ドメイン後は必ず更新 |
| `NEXT_PUBLIC_SUPABASE_URL` | 本番プロジェクト | 本番 or 別検証用 | `NEXT_PUBLIC_` のみブラウザに出る |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon | anon | **service_role をここに置かない** |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role | 必要なら | Server only。名前に `NEXT_PUBLIC_` を付けない |
| `EMBEDDING_PROVIDER` | `gemini` 等 | 同左 | DB の `embedding_model` と一致 |
| `GEMINI_API_KEY` | 本番鍵 | 同 or 別 | |
| `OPENAI_API_KEY` | 任意（控え） | 任意 | |
| `SEMANTIC_RECOMMEND_ENABLED` | `true` | `true` | 異常時は `false` で相談だけ止める |
| `SEMANTIC_RATE_LIMIT_PER_MIN` | `8`（目安） | 同左 | |
| `SEMANTIC_RATE_LIMIT_PER_DAY` | `80`（目安） | 同左 | |
| `NEXT_PUBLIC_GTM_ID` | `GTM-…`（任意） | 任意 | 未設定なら GTM スクリプトを出さない。GA4 は GTM 内で接続 |
| `ACCESS_LOG_ENABLED` | `true` | `true` | `false` で Supabase `access_events` 書き込みを止める |
| `RAKUTEN_APPLICATION_ID` | 楽天アプリ ID | 同左 | Item Search 用。未設定ならキーワード検索にフォールバック |
| `RAKUTEN_ACCESS_KEY` | 楽天 accessKey | 同左 | **Server only**。2026-07-01 API 必須 |
| `RAKUTEN_AFFILIATE_ID` | アフィリエイト ID | 同左 | API 応答の `affiliateUrl` 用。未設定なら `NEXT_PUBLIC_` 側を使う |
| `NEXT_PUBLIC_RAKUTEN_AFFILIATE_ID` | アフィリエイト ID | **置かない** | リンクに出る公開情報。未登録 Preview への掲載はガイドライン違反になりうる。Production のみ `rakutenAffiliateWrapEnabled` が包む |
| `NEXT_PUBLIC_AMAZON_ASSOCIATE_TAG` | Amazon アソシエイト tag | 同左 | 検索 URL の `tag=`。未設定なら tag なし |
| `YAHOO_CLIENT_ID` | Yahoo ショッピング appid | 同左 | **Server only**。未設定なら検索 URL |
| `YAHOO_VC_SID` / `YAHOO_VC_PID` | ValueCommerce | **置かない** | 広告主提携承認後。Preview に置くと第14条（登録メディア以外への掲載）に抵触しうる |
| `SATOFULL_SEARCH_BASE_URL` | さとふる検索ベース | 同左 | 未設定時は公式 list.php |
| `SATOFULL_VC_SID` / `SATOFULL_VC_PID` | ValueCommerce MyLink | **置かない** | Yahoo と別 PID。Preview 禁止は同上 |
| `VALUE_COMMERCE_WRAP` | 省略可（Production は自動 on） | `0` または未設定 | `1` は登録済み URL での手動テスト専用 |

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
5. `/sitemap.xml` と `/robots.txt` が開ける
6. 詳細手順は [smoke-test.md](./smoke-test.md)

## 4. ロールバック

Vercel → **Deployments** → 直前の Successful を **⋯ → Promote to Production**（または Redeploy 旧デプロイ）。

相談だけ止めたいとき: `SEMANTIC_RECOMMEND_ENABLED=false` → Redeploy（地図は生きたまま）。

## 5. 独自ドメイン（P0-6d）

Domains で追加 → DNS 指示どおり → HTTPS 自動。証明書エラーが消えたら Done。

## 関連

- 相談防護: [03-system-design.md](./03-system-design.md) §4–5  
- RLS 実測: [rls-verify.md](./rls-verify.md)  
- 全体: [11-launch-checklist.md](./11-launch-checklist.md)
