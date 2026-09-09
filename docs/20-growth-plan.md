# 1.x 成長計画（曝光と転化）

1.0.0 已上线。本文是**之后做什么、按什么顺序做、怎么验收**的正本。中文，对 GAO。
上线门禁看 [11-launch-checklist.md](./11-launch-checklist.md)，升号规则看 `.cursor/rules/semver.mdc`。

**一句话:** 不去和比价站抢「還元率 / コスパ」，把 106 銘柄 × 味わい一次データ 做成日本「**按口味选米**」的标准答案，靠 料理別 / 県別 / 比較 三类数据驱动页拿曝光，靠 比較表 + 商品直リンク + 診断シェア 拿转化。

**阶段叙事（与 case study 对齐）——顺序不能颠倒:**

| 阶段 | 含义 | 状态 |
| --- | --- | --- |
| **Phase 1** | 検索基盤（JSON-LD / OG / 面包屑） | **已交付**（`1.1.x`） |
| **Phase 2** | **米の型を完成**——露出、比較、転化、季节面（見つかる → 比べる → 買う） | 下一步 |
| **Phase 3** | **再訪**——診断シェア / share card / LINE；把米的用户环路闭合 | Phase 2 之后 |
| **構想** | **製品マトリクス**——桃Somme / 和牛Somme / 酒Somme 等横展 | **构想，不是承诺**；排在 Phase 2–3 之后 |
| **未確約** | 画像認識・機器連携等 | 破线假设；不验收、不排期 |

叙事图见 [komesomme-1.0.0-case-study.html](./assets/komesomme-1.0.0-case-study.html)。再访属于米产品的第三阶段；产品矩阵是更远的扩展地图，不要和「让人再来网站」对调。

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
| **再訪** | 无。無 shareable 診断結果、無 LINE / メール、share card 关着 | 診断結果パーマリンク + シェア + 自前チャネル 1 本（**Phase 3**） |

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

每个可感知交付仍对应一个 minor。**叙事上 Phase 2 可以跨多个 minor**（先入口、再転化、再季节面），不要攒成一个大爆。

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

### Phase 2 — 米の型を完成（下一步）

目标一句话:**让「味わいで選ぶ」在米站上从找到 → 比清楚 → 点得出店，整条链路可测。**

下面按波次排；每波一个 minor，做完再推。

#### Wave 2A — 料理・シーン別着陆（→ 约 `1.2.0`）

意图库存、EEAT 大纲、权威 URL 锚点与 AI 引用门禁见 [21-seo-intent-content.md](./21-seo-intent-content.md)。

**曝光的主引擎。** 「Yに最适なX」是 AI 检索时代仍然稳的 query 形状。

- 新路由 `/pair/[dish]`（romaji slug: `curry`、`sashimi`、`bento`、`nabe`、`donburi`、`chahan`、`sushi`、`karaage`…）
- **首发 20〜25 个，人手挑选**，不做全量组合。每面必须有:
  1. 从 `best_match_dishes` + 味わい座標 算出的 Top 5 銘柄（一次データ排序，写明排序依据）
  2. **HTML 比較表**：銘柄 / 甘み / 粘り / 向いている人 / 気をつける点 / お店で探す
  3. 人手写的リード文 2〜3 段（遵守 `japanese-copy.mdc`）
  4. `avoid_pairings` 反查出来的「この料理には向かない米」——差异化的核心
  5. FAQ 3 问 + `FAQPage` JSON-LD
- 数据落在新 `src/data/editorial/pairings.ts`（typed；`validate:rice` 同类校验要扩展）
- 与 [19-editorial-discovery.md](./19-editorial-discovery.md):**特集（`/collections`）继续人手、不量产**；`/pair` 是另一面，由一次データ导出 + 人手リード，不算量产特集

**验收:** 首发面全部 SSG；sitemap 收录；每面内部链接 ≥3 条（銘柄 / 別料理 / 特集）；Lighthouse SEO 100。

#### Wave 2B — 比較と転化（→ 约 `1.3.0`）

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

### Phase 3 — 再訪と拡散（→ 约 `1.4.0`）

目标一句话:**让人选过一次之后还能回来、还能转发给别人。** 这是米产品环路的最后一环，排在横展之前。

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

1. 读 [11-launch-checklist.md](./11-launch-checklist.md) 与本文，确认属于 Phase 2 哪一波 / Phase 3 / 还是误进了構想
2. 开 Issue（`.github/ISSUE_TEMPLATE/`，标题带 `[1.x-P2A]` 之类）
3. 写代码 + 测试。日文文案对照 `japanese-copy.mdc` 自查
4. `npm run test:unit` → `npm run build` → `npm run test:e2e`
5. 用户可感知 → 同一 commit 升 `VERSION` + `package.json` + `docs/10-changelog.md`，再 `npm install --package-lock-only`
6. `git push origin HEAD`（被 Auto-review 拦是预期，走审批卡，见 `ship-main.mdc`）
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

以 1.0.0 上线时为基线，**不设绝对值目标**（新站样本太小），只看方向:

| 指标 | 来源 | 期望 |
| --- | --- | --- |
| 可索引页数 | sitemap | 111 → 约 190（Phase 2 的 2A+2B 后） |
| GSC 表示回数 | GSC | Wave 2A 完成后 4 周内单调上升 |
| 収録率 | GSC | 新页 90% 以上被索引（未收录 = 内容太薄的信号） |
| 页型別 shop_click 率 | `/ops` | `/pair` 应高于銘柄页（意图更明确） |
| 指名検索 | GSC | 缓慢上升即可 |
| 再訪率 | `access_events` | Phase 3（シェア / LINE）之后可测 |

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

---

关联:方向与经纬 [12-product-journey.md](./12-product-journey.md)、技术选型史 [02-tech-retrospective.md](./02-tech-retrospective.md)、画面 [08-ui-design.md](./08-ui-design.md)、联盟 [13](./13-affiliate-compliance.md)–[15](./15-disclosure-surfaces.md)、叙事图 [case study](./assets/komesomme-1.0.0-case-study.html)。
