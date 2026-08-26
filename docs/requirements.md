# KomeSomme 要件定義

## 1. 現行 MVP 要件

### 1.1 風味マトリクス

- X 軸は **粒感**。データフィールド `hardness`（1〜5）を使い、左を「やわらか」、右を「しっかり」とする
- Y 軸は **甘み**。データフィールド `sweetness`（1〜5）を使い、下を「すっきり」、上を「ふくよか」とする
- `stickiness`（粘り、1〜5）は点サイズと詳細情報に使用し、座標軸には使用しない
- 銘柄点、探針、軸、四象限を表示し、クリックまたはドラッグで探針を移動できる
- 粒感・甘みスライダーは探針と同期する
- 同一座標の銘柄は視認できるよう小さく分散配置する

### 1.2 座標推薦

- 探針またはスライダーで指定した `hardness × sweetness` と各銘柄の2次元距離をクライアントで計算する
- 近い順に **Top 4**（No.1 と No.2〜4）を即時表示する
- 座標操作では Gemini API、pgvector RPC、文章生成を起動しない
- No.1 と次点、選択中の銘柄を、色だけでなくサイズ・輪郭・ラベルでも区別する

### 1.3 意味検索

- 「侍米師に相談」へ料理、用途、気分、好みを入力し、明示的な submit 時だけ検索する
- `/api/recommend` が Gemini `gemini-embedding-001` で 1536 次元 embedding を生成する
- Supabase RPC `match_rice_brands` が pgvector cosine similarity で **Top 4** を返す
- API は Node.js runtime の非 Streaming JSON とする
- 意味検索は現在の探針座標を上書きせず、「座標に戻す」で座標推薦に復帰できる
- 現行 MVP は検索結果と定型理由を表示し、LLM による文章生成は行わない

### 1.4 銘柄詳細と購入導線

- 銘柄名、都道府県、説明、粒感、甘み、粘り、相性料理を表示する
- 保存済み embedding を必要時に読み込み、銘柄間の近さを比較する。利用できない場合は座標距離へ fallback する
- `rakuten_search_keyword` がある場合、現行 CTA **「楽天で探す」** を表示し、楽天市場の検索 URL を別タブで開く
- Amazon / ふるさと納税の個別 affiliate CTA は現行必須要件に含めない

### 1.5 データと状態

- 銘柄データは Supabase `rice_brands` から取得し、mock data に置き換えない
- Loading、Empty、Error、再試行、意味検索中、意味検索失敗を日本語で表示する
- Gemini key と Supabase service role key を Browser に公開しない
- 入力、ボタン、銘柄点をキーボード操作でき、reduced motion を尊重する

## 2. 非機能要件

- TypeScript で API response と DB データの境界を型付けする
- 通常の一覧取得では大きな embedding 列を取得せず、必要時だけ遅延取得する
- embedding 次元は DB、seed、API の全箇所で 1536 に統一する
- API 入力を検証し、query を 500 文字に制限する
- API と UI は利用者向けエラーを返し、秘密情報や内部例外を露出しない
- Desktop / Mobile の UI 要件は [ui_design.md](./ui_design.md) を正本とする

## 3. 将来要件（未実装）

- `/[brand]` を実データ対応したブランド詳細・SEO ページにする
- Rakuten Affiliate API、affiliate deep link、成果計測を実装する
- Amazon およびふるさと納税 CTA を、提携・URL管理の設計後に追加する
- LLM を使った個別の推薦理由、炊飯助言、会話を追加する
- Rate limit、bot 対策、監視、構造化ログ、分析を追加する
- Auth、お気に入り、検索履歴、個人プロファイルを追加する
- キャッシュ、性能目標、アクセシビリティ試験、E2E 試験を運用要件として定量化する

将来要件を現行機能として README や UI に記載しない。
