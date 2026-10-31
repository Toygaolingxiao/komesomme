# 23 — AI 検索への対応（GEO）:llms.txt と robots の明示放行

## 0. 一句话

Google 検索だけでなく、AI に直接聞く人の流れにも KomeSomme を載せる。そのための「門」の整備（robots の明示放行 + llms.txt）が本文書の対象で、「中身」の整備（トップページの可読テキスト）は改造 Batch 2 が担う。両方で一つの idea である。

## 1. 発端（なぜ突然これを考えたか）

- 2026-10-30、Cloudflare から「komesomme.jp のボットトラフィックが異常に増えた（10-28 に自動化トラフィック 95%）」というメールが届いた。内容を確認すると、数字自体は実測の告警だが、文面は Super Bot Fight Mode と Business プランへの upsell が主目的だった（結論:買わない、様子見）。
- その過程で逆に気づいた:サイトへのボット来訪は敵とは限らない。検索と AI のクローラは「見つけてもらう」ための来訪でもある。
- 2026-10-31、オーナーからの問い:「今は Google の検索順位しか見ていない。多くの人は直接 AI に聞く。うちのサイトは AI に搜してもらえるのか。各 AI には独自のクローラがあるのか。あるなら、サイトの趣旨を伝える定義ファイルのようなものが要るのではないか。」
- この問いが本対応の起点。以降、本書に思考過程と実測を残す（後から「なぜやったか」を辿れるようにする）。

## 2. 思考過程（AI に「搜してもらう」とは何か）

AI のクローラは一括りにできない。混同すると判断を誤る。

| 種類 | 役割 | 代表例 | 回答に引用されるか |
| --- | --- | --- | --- |
| 検索インデックス型 | AI 回答のための検索索引を作る | OAI-SearchBot（ChatGPT 検索）、PerplexityBot、Claude-SearchBot | **される（本命）** |
| ユーザー起因型 | 会話中のリンク先をその場で開く | ChatGPT-User、Perplexity-User、Claude-User | その場の回答に使われる |
| 学習型 | モデルの学習データ収集 | GPTBot、ClaudeBot、CCBot、Google-Extended | 引用とは無関係 |

要点:

- 「学習データに入る」ことと「AI の回答に引用される」ことは別物。引用は検索インデックス型とユーザー起因型の到達可能性で決まる。Gemini / Google AI 概覧は Google の検索索引を使う（専用の門はない）。
- 定義ファイルにあたるものは実在する:robots.txt（クローラごとの可否）、llms.txt（サイトの趣旨と主要ページを Markdown で AI に渡す新興の約束事。公式標準ではないが低コスト）、sitemap.xml（URL の全量）、構造化データ（ページ内の事実の機械可読化）。分工は「可否 = robots、趣旨 = llms.txt、全量 = sitemap、事実 = JSON-LD」。
- AI の取得器はページの本文テキストを読む。JavaScript の中にデータを抱えただけのページは、Google ほどには解釈してもらえない。だから「門」だけでなく「中身（読める本文）」が効く — これが Batch 2 と接続する理由。

## 3. 現状の実測（2026-10-31、ライブ確認）

- robots.txt は Cloudflare の Managed Content が前段に入り、学習型はほぼ全て Disallow。冒頭の Content-Signal は `search=yes, ai-train=no, use=reference`。サイト側（`src/app/robots.ts`）は `Allow: /`（/api/ 等を除く）のみ。
- 実 UA でブランドページへアクセスした結果:OAI-SearchBot = 200、PerplexityBot = 200、ChatGPT-User = 200、Claude-SearchBot = 200、GPTBot = 403。つまり「学習は締め、検索は通す」という姿勢は既に成立していた。偶然ではなく Cloudflare 側の管理リストの効果。
- llms.txt は未設置（404）。
- 弱点は中身側:トップページは HTML 約 368KB に 106 銘柄のデータを直列化して載せ、可読の本文がほぼ無い（2026-10-29 の全面審査で確認済み）。AI が来ても引用する材料が薄い。
- 特集・銘柄ページには JSON-LD（datePublished / dateModified 等）があり、sitemap は 130 URL で健全。この土台は流用できる。

## 4. 方針

1. **姿勢は変えない:学習は締め、検索は通す。** コンテンツの権利についての既存の立場（Content-Signal: ai-train=no）と矛盾する施策はしない。llms-full.txt のような全文ダンプもしない。
2. **暗黙の放行を明示に変える。** 検索型・ユーザー起因型は「ブラックリストに居ないから通れている」状態。robots.ts に専用グループを書いて明示放行し、Cloudflare 側リストの将来の変更で誤って締められないようにする。許可範囲は既存の `*` ルールと同一（/api/、/ops、/prototypes は引き続き除外）— 明示化であって拡大ではない。
3. **llms.txt を置く。** サイトの趣旨、主要ページの地図、銘柄ページの URL 形式、評価が編集物である旨を短く正確に書く。誇張した宣伝文句は入れない（AI に渡す「定義」なので、事実の正確さがそのまま引用の正確さになる）。
4. **中身は Batch 2 で直す。** トップページの SSR 本文帯とデータ瘦身が、GEO としても本命の改善であることをここに明記する（本書の PR だけでは idea の半分）。

## 5. 実装（この変更）

- `src/app/robots.ts`:ルールを配列化し、AI 検索グループ（OAI-SearchBot / ChatGPT-User / PerplexityBot / Perplexity-User / Claude-SearchBot / Claude-User）を明示追加。範囲は `*` と同一。
- `public/llms.txt`:新規。構成は「H1 + 要約 > 構成の説明 > 主要ページへのリンク > 銘柄ページの形式 > データと評価について > 運営」。
- 本書（docs/23）と docs/README の索引、変更履歴 1 行。
- 続編:改造 Batch 2（トップページの可視 SSR 本文帯 + MapProfile 投影で HTML 瘦身）。設計は `~/workspace/komesomme-work/RENOVATION-DESIGN.md` の Batch 2 項。

## 6. 効果の測り方（KPI を盛らない）

- Cloudflare の Bot Report / AI Audit で、AI 検索クローラの来訪量と対象パスの推移を見る（あの upsell メールの後台で無料で見られる範囲）。
- 月に一度、ChatGPT / Perplexity / Gemini に「粘りの少ない米は」「カレーに合う銘柄は」等の問いを投げ、KomeSomme が引用されるか・記述が正しいかを手で記録する。引用ゼロを焦って施策を増やさない（索引反映には時間がかかる）。
- 判断材料が揃うまでは、追加の GEO 商材・有料ツールは買わない。

## 7. やらないこと

- 学習型クローラの放行（姿勢 1 と矛盾するため）。
- Cloudflare Business プラン等、この件を理由にした upsell の購入。
- llms.txt へのキーワード詰め込み、AI 向けだけの隠しテキスト。見つけてもらうための整備と、騙すための整備は違う。
