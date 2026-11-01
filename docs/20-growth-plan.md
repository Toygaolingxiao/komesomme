# 1.x 成長計画（曝光と転化）

1.0.0 已上线。本文是**产品侧**「之后做什么、按什么顺序做、怎么验收」的正本。中文，对 GAO。  
上线门禁看 [11-launch-checklist.md](./11-launch-checklist.md)，升号规则看 `.cursor/rules/semver.mdc`。

**职业与回报假设**（アフィ不当主 KPI、轻 B2B、作品集杠杆）见 [22-career-positioning.md](./22-career-positioning.md)。**对外站 UI / 文案不要写那一套。**

**一句话（产品）:** 不去和比价站抢「還元率 / コスパ」，把 106 銘柄 × 味わい一次データ 做成日本「**按口味选米**」的标准答案；料理別 / 県別 / 比較 拿曝光，比較表 + 购买出口 +（Phase 3）診断シェア 拿转化信号。

**一句话（职业）:** 本仓优先产出**可展示的数据产品证据**；常规モールアフィ是便利出口，不是回收时薪的主引擎。

**阶段叙事 ——顺序不能颠倒:**

| 阶段 | 含义 | 状态（2026-11） |
| --- | --- | --- |
| **Phase 1** | 検索基盤（JSON-LD / OG / 面包屑） | **已交付**（`1.1.x`） |
| **Phase 2** | **米の型を完成**——露出、比較、転化、季节面（見つかる → 比べる → 買う） | **进行中**：2A 十面已上；2C 季节特集已有入口；**下一程是 2B**（§4.0） |
| **Phase 3** | **再訪**——診断シェア / share card / LINE | 分享卡已默认开（`1.7.0`）。诊断 URL / LINE 排在 2B 可测之后 |
| **轻 B2B（试验）** | 挑米診断嵌入 / 白标试点（见 [22](./22-career-positioning.md)） | 可选并行；**不**抢 Phase 2–3 主开发 |
| **構想** | **製品マトリクス**——桃Somme / 和牛Somme / 酒Somme 等横展 | **构想，不是承诺**；排在 Phase 2–3 之后 |
| **未確約** | 画像認識・機器連携等 | 破线假设；不验收、不排期 |

叙事图见 [komesomme-1.4.1-case-study.html](./assets/komesomme-1.4.1-case-study.html)（1.0 归档：[1.0.0](./assets/komesomme-1.0.0-case-study.html)）。再访属于米产品的第三阶段；产品矩阵是更远的扩展地图，不要和「让人再来网站」对调。

---

## 1. 方向设计

### 1.1 对手在哪个战场

搜「米 ランキング」「ふるさと納税 米」出来的是这批：

| 类型 | 代表 | 武器 | 我们能不能赢 |
| --- | --- | --- | --- |
| 比价聚合 | furu-sato.com（横断 22 サイト・返礼品 39,658 件）、ふるとく | 每日更新的价格・還元率・g/1000円 | **不能。** 需要长期爬价格库，且与 [13](./13-affiliate-compliance.md) 的隔离约束冲突 |
| 媒体排行 | ザイ・オンライン、コメボウ | 编辑部人力、既有域名权威 | 不能硬拼产出量 |
| 官方数据 | 日本穀物検定協会 食味ランキング | 権威 | 引用即可，不复制 |

这三类都在回答「**哪个便宜 / 哪个有名**」。**没有一家在回答「我家这顿饭该配哪个米」**——因为那需要逐銘柄的味覚評価，人力太贵。

### 1.2 我们的护城河

`RiceProfileV2` 里每个銘柄已有手写的一次データ:

- 12 味わい指標 + 二维座標（甘み・粘り軸）
- `best_match_dishes` / `avoid_pairings`
- `spring/summer/autumn/winter_pairings`
- `sake / beer / wine / whisky / tea_pairings`
- `mood / occasion / lifestyle_scenes`、`pairing_reason`

2026 年的检索现实（AI Overviews / AI Mode 已吃掉大量零点击）里，这正好是唯一还有效的东西:**AI 生成不出来、又能被 AI 引用的一次情報 + 结构化表格**。方向就是把这些字段从「详情页里的装饰」变成「独立的着陆页」。

同时 `avoid_pairings`（不推荐的搭配）是稀缺的负面信息——比较类内容里写缺点能显著提高信任与点击，这个别人抄不了。

### 1.3 三条曲线

| 曲线 | 现状 | 目标 |
| --- | --- | --- |
| **曝光** | 可索引页 ≈ 106 銘柄 + 4 特集 + 首页。只覆盖「銘柄名」这一种检索意图 | 覆盖「〜に合う米」「〇〇県の米」「A と B の違い」三类高意图检索 |
| **転化** | 「お店で探す」多数指向**搜索结果页**（楽天已是商品直リンク）。全站无比較表 | 商品直リンク化 + 比較表 + CTA 位置最优化 |
| **再訪** | 分享卡默认开。无 shareable 診断 URL，无 LINE / メール | 診断結果パーマリンク + 既存シェア +（可选）自前チャネル 1 本（**Phase 3**） |

### 1.4 为什么是 2 → 3 → 構想，而不是先开产品矩阵

三条曲线本身就有顺序：**曝光 → 転化 → 再訪**。产品矩阵是「把已经跑通的型复制到新品类」，必须排在再访之后。

可复用的不是「米站皮肤」，而是米线上已经验证的一套型：

1. **二次元の味わい盤面**（坐标含义按品类重定义）
2. **相談**（埋め込み + 近い候補）
3. **事典 / 比較 / 入口页**（一次データ + 人手リード）
4. **買う出口**（直リンク + 披露 + 页型计测）
5. **また来てもらう**（シェア / 自前チャネル）

因此：

- **Phase 2** = 1–4 在米上可测（見つかる → 比べる → 買う）
- **Phase 3** = 5 在米上可测（再訪ループ）
- **構想** = 同一引擎换品类（桃 / 和牛 / 酒…）；仍是地图，不是排期
- **未確約** = 画像認識・機器連携；破线假设

若把产品矩阵放在再访前面，等于还没证明「人选得完、还会回来」，就去复制整站。

---

## 2. 技术选型

原则:**不加月费、不加运维面、solo 一个人能维护**。

| 需求 | 选型 | 不选什么 · 为什么 |
| --- | --- | --- |
| 新页面内容 | 沿用 Git 内 typed TS/JSON（`src/data/editorial/`）。每类新页手写リード文与 FAQ | 不引 headless CMS（月费 + 又一个后台）。不引 MDX 管线（现有渲染够用） |
| 构造化データ | 自写 `src/lib/seo/jsonLd.ts`，输出 `Article` / `BreadcrumbList` / `ItemList` / `FAQPage` | 不装 schema 库。JSON-LD 就是对象字面量 |
| OG / Discover 图 | 各面 `opengraph-image.tsx`（已有 `next/og`），统一 1200×630 | 不用外部图片服务 |
| 渲染 | 数据驱动页全部 `generateStaticParams` + SSG，`revalidate` 只给会变的面 | 不用 `force-dynamic`，不引 CDN 缓存层 |
| A/B 检证 | 客户端 deterministic bucket（session id hash）→ 变体写进 `access_events` | Hobby 无 Edge Config；不引 Optimize 系 SaaS |
| 效果计测 | 一次パーティ `access_events` + `/ops` 为主，GA4 / GSC 为辅 | Cookie 规制下三方计测只会更差，主指标必须在自家库里 |
| 自前チャネル | LINE 公式アカウント **コミュニケーションプラン（0 円・200 通/月）** 起步 | 先不做邮件系统（需要 ASP + 特商法表記 + 退订流程）。友だち超 200 人再评估 5,000 円/月。属 **Phase 3** |
| 検索・埋め込み | 现有 Supabase pgvector + Gemini 不变 | 不换 |

新增依赖预算:**0**。Phase 2–3 近端工作不需要装任何 npm 包。構想若真开新品类，再单独评估数据与域名，仍默认不加月费 SaaS。

---

## 3. 环境与配置

| 项 | 动作 | 备注 |
| --- | --- | --- |
| `metadata.robots` | 在 `src/app/layout.tsx` 加 `max-image-preview:large`（`/ops` 的 noindex 不动） | Discover 大图卡的前提；Phase 1 范围 |
| GSC | 提交扩容后的 sitemap；开始每周看 **Discover 报表**（30 天 <100 表示 = 还在起步期） | 已注册 |
| GA4 | 建 `page_type` 自定义维度（`brand` / `pair` / `prefecture` / `compare` / `collection`） | 事件已在发；Phase 2 要能分页型看 |
| `/ops` | 漏斗按 `page_type` 拆分 | 现在只有总量 |
| Vercel | 无新增 env（LINE 只是外链，不需要 token） | 免费额度内 |
| `.env.example` | LINE 导线做了之后加 `NEXT_PUBLIC_LINE_ADD_URL`（公开值） | Phase 3 |

---

## 4. 开发路线

用户能感觉到的一次改动，就升一个小版本。Phase 2 可以分成好几次发，先让人找得到，再让人比得清，再补季节页。不要攒成一次大爆。分支怎么开、PR 怎么合，看 [25-dev-playbook.md](./25-dev-playbook.md)。

### 4.0 现在走到哪了，接下来做什么（2026-11）

线上大概是 [`VERSION`](../VERSION) 写的号。地图、咨询、事典、十个料理页、特集、关于页、给 AI 搜索看的说明、分享卡，这些都已经有了。首页下面那一小段「这个站是干什么的」，是写给搜索引擎的，电脑和手机都滚不到。这段就让它待在网页源代码里，不要再解锁，也不要再改首页长相。

缺的是另一件事：两个人搜「コシヒカリ和つや姫有什么不一样」时，我们还没有自己的比较页。店也点得出去，但后台看不出人是从料理页来的、从铭柄页来的，还是从以后的比较页来的。先把这两件事做完，再谈让人把结果转发给朋友。分享卡虽然已经能用，那只是提前做了，不是下一步该去做 LINE 的理由。

接下来按这个顺序。做完一件再开下一件。

先做比较页。人手写 8 到 12 对就够，比如コシヒカリ对つや姫这种真会有人搜的组合。表格沿用料理页那张，第一行是最推荐的，必须有一列写「要小心什么」。页上要有联盟标记，要进站点地图，要有分享图，还要有一条自动测试能打开它。不要拿 106 个铭柄两两配对去堆页面。

同一段时间，把内部观测台按页面种类拆开。要能分开看铭柄页、料理页、县、比较、特集：人来了没有、点开详情没有、点了店没有。拆不开，比较页做了也没法判断有没有用。这件事不要顺便去配 Sentry，也不要再为 GA4 或 Search Console 开一张工单。

比较表下面的购买按钮，写成具体动作，比如「去店里看价格」。乐天、Yahoo、Amazon 里，这个铭柄已经有商品直链的就用直链；没有的继续用搜索链接。不要为了直链去接 Amazon 的商品接口当主线。

这 8 到 12 对如果被收录了，或者观测台上能看见比较页的点击，再加到 30 到 50 对。没有动静就停在第一批，不要靠批量薄页去冲收录。

新米、锅这些已经有的季节特集，数字和开头那段话可以改。不要再开一套特集架子，也不要量产博客。

比较页和观测台都能用之后，再做「这次推荐可以分享」的固定网址。LINE 默认不做。真要做，先改隐私政策和利用规约。不要先做 LINE 再回头补比较页。

如果线上点地图上的米，详情卡仍不出来，从现在的主干重新开一个很小的修补。不要把去年那条旧分支救回来，也不要顺手改分享卡或首页。

这段时间不要做这些：登录和收藏、装成 App、多轮聊天咨询、桃或和牛或酒的新站、把首页那段说明重新显示出来、给一个品种标多个产地、为了观测再开 Issue、改推荐公式或坐标轴的含义。

大概两三个月后，如果料理页在、比较页在、观测台能按页面种类看、季节特集还能人手改，Phase 2 的主体就算齐了。然后再谈分享诊断结果，以及要不要做给别人嵌的挑米工具。

下面几节是各阶段当初怎么设计的。版本号是当时的说法，不要倒回去改已经发出去的号。

### Phase 1 — 検索基盤（→ `1.1.0`）· 已交付

**为什么先做:** 不写一个字新内容，只补技术欠债，对现有 106 页全体生效。

| 交付 | 文件 |
| --- | --- |
| `Article` + `BreadcrumbList` JSON-LD 上銘柄页 / 特集页 | `src/lib/seo/jsonLd.ts`、`src/app/library/[id]/page.tsx`、`src/app/collections/[slug]/page.tsx` |
| `ItemList` 上 `/library`、`/discover`、`/collections` | 同上 |
| `max-image-preview:large` | `src/app/layout.tsx` |
| 銘柄別 OG 图（1200×630，含銘柄名 + 座標位置） | `src/app/library/[id]/opengraph-image.tsx` |
| 面包屑 UI（トップ › ライブラリ › 銘柄） | `src/components/nav/Breadcrumbs.tsx` |
| `/library`、`/` 补 `generateMetadata` | — |

**验收（已满足则勾在 changelog / smoke）:** Rich Results Test 对代表 URL pass；`jsonLd` 单测；OG 在 X / LINE 预览正确。后续 `1.1.x` 是同基线上的修补（地図アート等），不算新 Phase。

---

### Phase 2 — 米の型を完成（进行中）

目标一句话:**让「味わいで選ぶ」在米站上从找到 → 比清楚 → 点得出店，整条链路可测。**

下面按波次排；每波一个 minor，做完再推。

#### Wave 2A — 料理・シーン別着陆（→ 约 `1.2.0`）· **首发 5 + 第二批 5 面**

意图库存、EEAT 大纲、权威 URL 锚点与 AI 引用门禁见 [21-seo-intent-content.md](./21-seo-intent-content.md)。

**曝光的主引擎。** 「Yに最适なX」是 AI 检索时代仍然稳的 query 形状。

- 新路由 `/pair/[dish]`（romaji slug: `curry`、`sashimi`、`bento`、`nabe`、`sushi`…）
- **`1.2.0` 首发 5 面:** `curry` · `sashimi` · `bento` · `nabe` · `sushi`
- **`1.2.3` 第二批 5 面:** `donburi` · `onigiri` · `karaage` · `chahan` · `tamagokake`（唐揚げ・卵かけはカタログ命中が薄いため、座標で Top を補完し sortNote に開示）
- 其余 Wave 2A slug 在后续 `1.2.x` 续写人手リード
- 每面必须有:
  1. 从 `best_match_dishes` + 味わい座標 算出的 Top 5 銘柄（一次データ排序，写明排序依据）
  2. **HTML 比較表**：銘柄 / 甘み / 粘り / 向いている人 / 気をつける点 / お店で探す
  3. 人手写的リード文 2〜3 段（遵守 `japanese-copy.mdc`）
  4. `avoid_pairings` 反查出来的「この料理には向かない米」——差异化的核心（忌避が薄い面は座標対立を明示）
  5. FAQ 3 问 + `FAQPage` JSON-LD
- 数据落在 `src/data/editorial/pairings.ts`（typed；`validate:rice` が pairings も検証）
- 与 [19-editorial-discovery.md](./19-editorial-discovery.md):**特集（`/collections`）继续人手、不量产**；`/pair` 是另一面，由一次データ导出 + 人手リード，不算量产特集

**验收（首发）:** 5 面 SSG；sitemap 收录；每面内部链接 ≥3；Playwright TS-PAIR-*。

#### Wave 2B — 比較と転化 · **下一程（执行顺序见 §4.0）**

> `1.3.0` 只交付了侍米師導視。比較页还没有。本波的 minor 随交付走，不要倒回 `1.3.x`。

| 交付 | 说明 |
| --- | --- |
| 商品直リンク扩大 | 楽天已有商品页。Amazon / Yahoo 仍多是**搜索结果 URL**——最大 CVR 漏点。Yahoo 先接 `yahooShoppingItemUrl`；Amazon 视 PA-API |
| `ComparisonTable` 组件 | 复用到 `/pair`、`/compare`、銘柄页。第一行 = 最推荐；必须有「気をつける点」列 |
| CTA 位置 | 移到**比較表之后 / 章末**。微文案改成具体动作（例:「お店で価格を見る」） |
| `/compare/[a]-vs-[b]` | 人手挑 30〜50 对（コシヒカリ vs つや姫 等）。**不做 106×106** |
| A/B 基盤 | `src/lib/experiment/`：deterministic bucket + 变体记入 `access_events`。首个实验只测 CTA 位置 |
| `page_type` 维度 | GA4 + `/ops` 漏斗按页型拆分 |

**验收:** `/ops` 能分页型看 表示 → 詳細 → shop_click；A/B 有单测；披露 `※PR` 在所有新 CTA 面出现（对照 [15](./15-disclosure-surfaces.md)）。

#### Wave 2C — 季節面と人手特集リード（可与 2B 交错，仍属 Phase 2）

- 新米シーズン（9〜11 月）等季节页，用既有 `*_pairings` 字段
- 特集リード继续人手；**不做量产博客**
- 目的是验证「时序需求」入口，而不是另开产品线

**验收:** 季节面进 sitemap；内部链回銘柄 / pair / compare；文案过 `japanese-copy.mdc`。

**Phase 2 完成判据（叙事上）:** `/pair` + `/compare` 在跑；直リンク与 CTA 可测；页型漏斗能看；季节或特集至少有一条可持续的人手入口。然后进入 Phase 3（再访），**不要**直接跳到产品矩阵。

---

### Phase 3 — 再訪と拡散（Phase 2 主体可测之后；版本号随交付，不锁死 `1.4.0`）

目标一句话:**让人选过一次之后还能回来、还能转发给别人。** 这是米产品环路的最后一环，排在横展之前。

> 注：`1.4.x` 已用于百科合稿与溯源等交付；Phase 3 再访能力用**后续 minor** 承接，不要为了叙事倒回去改历史版本号。

- **診断結果パーマリンク**：相談 / 地图结果变成可分享 URL（銘柄 + 理由）+ OG 图
- **share card 开启**：`SHARE_CARD_ENABLED` 默认开，图里带座標位置
- **LINE 公式アカウント导线**：结果页下方「友だち追加」。0 円起步。**上之前必须改 [privacy](../src/app/privacy/page.tsx) 与 [terms](../src/app/terms/page.tsx)**

**验收:** 分享链接在 X / LINE 预览正常；LINE 导线的隐私记述已上线；`/ops` 能看到 share / line_click；再訪率可测。

**Phase 3 完成判据:** 米线上曝光、転化、再访三条曲线都有可观测信号。此时才具备认真讨论「構想・製品マトリクス」的资格。

---

### 構想 — 製品マトリクス（不排期）

**不是 Phase 3，也不是下一个 sprint。** 米的型（盤面 × 相談 × 事典 × 買う出口 × 再訪）验证之后，才考虑用同一引擎立新品类品牌。

| 设想例 | 要换什么 | 可共用什么 |
| --- | --- | --- |
| 桃Somme | 甜酸 / 香气等坐标；产地与品种一次データ；监修 | 盤面 UI、埋め込み相談管线、公开检查、アフィリエイト導線形态 |
| 和牛Somme | 脂感 / 火入れ等轴；部位・産地データ | 同上 |
| 酒Somme | 香り / 酸 / 旨味等；酒造・酒米データ | 同上 |

**开干之前必须先有的答案（缺一就继续停在构想）:**

1. 该品类是否也存在「按口味选、而不是按价选」的空白
2. 是否能拿到**不可被 AI 批量伪造**的一次データ + 愿意署名的专家编辑
3. 坐标轴含义写进产品文档，且与米轴**语义独立**（禁止硬套 甘み/粒感）
4. 域名 / 品牌 / 联盟类目是否合法可开；运维是否仍 solo 可撑
5. 米站 **Phase 2 + Phase 3** 已证明「型 + 再访」值得复制

**明确不做（构想阶段）:** 不预建多租户框架、不提前抽象「万能 Somme SDK」、不并行开第二条产品线抢 Phase 2–3 人力。

---

### 未確約 — 破线假设

画像認識・機器連携等——只记在 case study 破线框，**本文不验收、不排期**。不要和 Phase 3（再访）混写。

### 持续运营

不再是开发 Phase，是第 6 节的 SOP 常态化。

---

## 5. 测试策略

新页型全部走同一套门禁，不新增框架。

| 层 | 内容 |
| --- | --- |
| `validate:rice` 系 | 扩展成也校验 `pairings.ts` / `compare` 对:slug 唯一、引用的銘柄 id 存在、Top N 不为空、リード文非空 |
| Vitest | `jsonLd.ts` 输出快照；比較表排序函数；`avoid_pairings` 反查；A/B 分桶恒定性；`pair` slug ↔ 料理名 映射 |
| Playwright | 每类新页 1 条 smoke：能打开、比較表可见、CTA 可点、`※PR` 可见、`body` 不含 `service_role` / `GEMINI_API_KEY` |
| 手动（每次 Production 后） | [smoke-test.md](./smoke-test.md) 记录栏。新增一项：抽 1 个新页型跑 Rich Results Test |

CI 不变（lint / typecheck / validate / unit / build / client-bundle / e2e）。

---

## 6. SOP

### 6.1 一次改动（开发）

1. 读本文 §4.0 与 [25](./25-dev-playbook.md)，确认属于 2B / 2C / 3 / 运营文案，还是误进了構想
2. 日常从最新 `main` 开自己的枝，走 [24](./24-collaboration.md) 的 PR。不要直接 commit `main`
3. 写代码 + 测试。日文文案对照 `japanese-copy.mdc` 自查
4. `npm run test:unit` → `npm run build` → `npm run test:e2e`
5. 用户可感知 → 同一 commit 升 `VERSION` + `package.json` + `docs/10-changelog.md`，再 `npm install --package-lock-only`
6. 主人说可以合才合。主人说「推送」且改动已在本地 `main` 时，才按 `ship-main.mdc` 推 `origin HEAD`
7. 等 CI 绿 → 等 Vercel 绿 → 填 `docs/smoke-test.md`

### 6.2 新页型上线 checklist

任何新增可索引页，缺一项不推:

- [ ] `generateStaticParams` + `generateMetadata`（title / description / canonical）
- [ ] `opengraph-image` 1200×630，图内容与页内容一致（不用站 logo 当 OG 图）
- [ ] JSON-LD：`Article` 或 `ItemList` + `BreadcrumbList`（有 FAQ 则加 `FAQPage`）
- [ ] 面包屑 UI
- [ ] 内部链接 ≥3 条出去，且至少 1 条从既有页链进来（不能是孤岛）
- [ ] 人手写的リード文（不是纯模板填空）
- [ ] 一次データ的排序依据写在页面上（这是被 AI 引用的理由）
- [ ] 有联盟 CTA → `※PR` 披露，对照 [15](./15-disclosure-surfaces.md)
- [ ] 进 `sitemap.ts`
- [ ] Playwright smoke 1 条

### 6.3 每周（30 分钟）

| 顺序 | 看什么 | 判断 |
| --- | --- | --- |
| 1 | GSC 検索パフォーマンス：表示回数 / CTR / 平均順位，按页型分 | 表示涨但 CTR 低 → 改 title / OG 图。表示不涨 → 内容或内部链接不够 |
| 2 | GSC Discover 报表 | 30 天 <100 表示 = 仍在起步，别急着改策略 |
| 3 | GSC インデックス | 新页 48h 内未收录 → 检查内部链接与 sitemap |
| 4 | `/ops` 漏斗（按页型） | 找 CTR 与 CVR 分开看:CTR 低改 CTA / 比較表；CVR 低改リンク先 |
| 5 | Sentry | 有新 issue 就当周处理 |
| 6 | 「KomeSomme」指名検索数 | 品牌增长的唯一硬指标 |

**一周只改一件事。** 同时改两处就无法归因。改动与要看的数字要一一对应，记在 changelog 里。

### 6.4 每月

- 联盟管理画面成果 ↔ `/ops` 的 shop_click 突合（P1 遗留项）
- 依赖更新 + `npm audit`
- 内容盘点：表示回数最低的 5 面，判断改写还是 noindex
- 若开始产生收益，去开 Vercel Spend Management 与 Gemini Spend Cap（现在免费额度所以适用外，见 checklist 判定备忘）

---

## 7. KPI

以 1.0.0 上线时为基线，**不设绝对值目标**（新站样本太小），只看方向。

**产品曲线（仍要看）:**

| 指标 | 来源 | 期望 |
| --- | --- | --- |
| 可索引页数 | sitemap | 随 Wave 2A/2B 上升（已含十面 `/pair`） |
| GSC 表示回数 | GSC | Wave 2A 后 4 周内宜单调上升 |
| 収録率 | GSC | 新页 90% 以上被索引（未收录 = 内容太薄的信号） |
| 页型別 shop_click 率 | `/ops` | `/pair` 应高于銘柄页（意图更明确）——作**出口信号**，不作时薪核算 |
| 指名検索 | GSC | 缓慢上升即可 |
| 再訪率 | `access_events` | Phase 3（シェア / LINE）之后可测 |

**职业侧（主评价，见 [22](./22-career-positioning.md)）:** 案例是否更好讲、数据资产（catalog / pair / 百科 claims）是否更硬、轻 B2B 是否多一个可演示切口。  
**明确降权:** 「アフィ月结是否覆盖开发时薪」——结构上对大米常规返利不成立，不作为砍功能或停更的判据。

構想不设 KPI——没有开品类就没有数字。

---

## 8. 不做清单

写下来，防止以后手痒:

- **不做価格・還元率比较。** 需要持续爬价格，且与联盟隔离约束冲突。这是对手的战场
- **不做全组合程序化页面。** `/pair` 上限 ~30、`/compare` 上限 ~50，都人手挑。薄内容量产在 2026 年只会招来评价下调
- **不改推薦式 / 座標軸含義**，除非 GAO 明确同意（见 `semver.mdc`）
- **不引 CMS、不引 A/B SaaS、不引 schema 库**
- **不做 Auth / お気に入り / PWA / 长文生成**，直到曝光曲线站住
- **不用 AI 批量写日文页面正文。** リード文人手写，这恰恰是被引用的理由
- **Phase 2–3 完成前不开第二条 Somme 产品线。** 不预建多租户 / 万能 SDK
- **不把未確約仮説（画像認識・IoT）写进近端验收**
- **不把製品マトリクス排在再访前面**——先闭合米的环路，再谈复制
- **不把常规モールアフィ回报当成停更判据**——见 [22](./22-career-positioning.md)
- **不在公开产品页写「作品集 / 咨询 / B2B 招商」元叙事**——站外 Case Study 另论

---

关联:执行纪律 [25-dev-playbook.md](./25-dev-playbook.md)、职业定位 [22-career-positioning.md](./22-career-positioning.md)、方向与经纬 [12-product-journey.md](./12-product-journey.md)、技术选型史 [02-tech-retrospective.md](./02-tech-retrospective.md)、画面 [08-ui-design.md](./08-ui-design.md)、联盟 [13](./13-affiliate-compliance.md)–[15](./15-disclosure-surfaces.md)、叙事图 [case study 1.4.1](./assets/komesomme-1.4.1-case-study.html)。
