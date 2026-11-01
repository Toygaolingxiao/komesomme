# KomeSomme システム設計書

本書はリポジトリの現行実装を説明する。UI 正本は [08-ui-design.md](./08-ui-design.md)。1.x の次の一手は [20-growth-plan.md](./20-growth-plan.md) §4.0。1.0 門禁の記録は [11-launch-checklist.md](./11-launch-checklist.md)。全体像は [02-tech-retrospective.md](./02-tech-retrospective.md)。

## 1. 技術スタック

詳細な選定理由は [02-tech-retrospective.md](./02-tech-retrospective.md) §2。要約:

- **Web:** Next.js 15 App Router、React 19、TypeScript 5
- **スタイル:** Tailwind CSS 4 · Motion · Phosphor Icons
- **ホスティング:** Vercel（旗艦 `komesomme.jp`）
- **データ:** Supabase（PostgreSQL、pgvector、RLS）
- **Embedding / 返事:** Gemini（OpenAI フォールバック）。1536 次元
- **観測:** `access_events` + `/ops`；任意で GA4 / Sentry
- **試験:** Vitest + Playwright（CI）

チャートは HTML/CSS と Motion。座標推薦はクライアントだけ。相談の短い返事だけ Gemini / OpenAI が書く。

## 2. 実ファイル配置

```text
src/
├── middleware.ts                   # www・末尾 /・旧 URL を 1 ホップの 308 に畳む
├── app/
│   ├── page.tsx                      # 味わいの地図（ホーム）
│   ├── layout.tsx
│   ├── library/page.tsx              # 銘柄ライブラリ一覧
│   ├── library/[id]/page.tsx         # 銘柄事典の正本（SSR）
│   ├── [brand]/page.tsx              # 旧 URL → /library/[id] 永久リダイレクト
│   ├── privacy / terms / tokushoho   # 法務草案
│   ├── api/rice/semantic-recommend/  # 意味検索
│   ├── api/rice/shop-links/          # 購入 URL 解決（楽天 item 等）
│   ├── api/rice/rakuten-item/        # 楽天商品（RakutenOffer 専用）
│   ├── ops/                          # 内部观测台（密钥门禁・noindex）
│   ├── api/analytics/event/          # 匿名 access_events
│   └── api/ops/                      # login / logout / summary
├── components/
│   ├── SiteHeader.tsx                # 共通頂栏（副題は常に「侍米師」／読み じべいし）
│   ├── ShopLinksStrip.tsx            # 通販 / ふるさと納税タグ＋軟色カプセル
│   ├── FlavorMatrix.tsx
│   ├── analytics/                    # GTM + page_view
│   ├── ops/                          # OpsDashboard / OpsLoginForm
│   ├── library/
│   └── matrix/
├── data/rice/                        # sources / overlay / catalog / encyclopedia
├── lib/
│   ├── rice/
│   ├── analytics/
│   ├── affiliate.ts                  # 検索 URL・披露文案の正本
│   ├── embedding/
│   └── supabase/
└── types/

supabase/migrations/
├── 0001 / 0002                       # 既存環境向け。新規は不要
├── 0003_normalize_rice_catalog.sql
├── 0004_restrict_embedding_access.sql
└── 0005_access_events.sql

scripts/
├── validate-rice-profiles.ts
├── seed-rice-profiles.ts
├── audit-shop-inventory.ts
├── generate-rice-encyclopedia.ts
├── apply-taste-consensus.ts
└── data/                             # 味わい再校正・在庫ギャップ表
```

## 3. 主要データフロー

```text
RiceSource → deriveRiceProfile → overlay → cultivarDedup → riceProfiles
  → buildRiceSearchText → createEmbedding
  → rice_regions / rice_brands / rice_profile_details

Browser → fetchRiceCatalog → calculateMatrixDisplayPoint
       → calculateTopCoordinateMatches（ローカル Top 4）

相談 → POST /api/rice/semantic-recommend
    → createEmbedding → match_rice_profiles
    → Flavor Bridge → generateSommelierReply（失敗時は reason）
    → 推薦欄
```

座標操作はサーバーを呼ばない。マップの No.1 は display 座標の最近傍。

## 4. 環境変数

一覧の正本は [`.env.example`](../.env.example) と [vercel-production.md](./vercel-production.md)。`NEXT_PUBLIC_*` だけがブラウザに出る。`SUPABASE_SERVICE_ROLE_KEY` を公開名に付けない。

## 5. データ境界と安全性

- Browser には anon key のみ
- `rice_regions` / `rice_brands` / `rice_profile_details` は匿名 SELECT のみ
- 地図の点色は `rice_regions.color`（VIEW の `region_color`）
- 通常クエリは `embedding` / `search_text` を取得しない
- ベクトル比較は必ず `embedding_model` で絞る
- 公開 URL の相談 API は `guardSemanticRecommend`（kill switch + レート制限）
- 匿名 UI イベントは `POST /api/analytics/event` → `access_events`（anon は SELECT 不可）
- 内部观测台 `/ops` のみ service_role で `access_events` を集計。`OPS_DASHBOARD_SECRET` 未設定なら 404

## 6. 旧 URL（1 ホップ）

正本ホストは `https://komesomme.jp`。`next.config` の redirects に加え、`src/middleware.ts` が末尾 `/` を先に畳む。Next の `trailingSlash: false` が `/path/` を `/path` にしてから redirect すると 2 ホップになる。

- 独立の www サイトは置かない（2026-09-30 に閉じた）。`www.komesomme.com` は DNS なし。`www.komesomme.jp` は開くと 307 で apex へ 1 跳。詳細は [vercel-production.md](./vercel-production.md)
- `/collections` と `/collections/` → `/discover`
- `/{id}` と `/{id}/` → `/library/{id}`
- `/library/collections/:slug/` → 誌面へ 1 ホップ

サイトマップに転送元は載せない。GSC の「ページにリダイレクトがあります」は意図した転送なので、200 のページには戻さない。
