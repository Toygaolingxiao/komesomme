# 锐评留档 · 2026-11-01-cursor-unslop-ui-audit

| 字段 | 填写 |
| --- | --- |
| 日期 | 2026-11-01 |
| 来源 | Cursor Cloud Agent · UI 向 unslop（[no-ai-slop](https://github.com/claudiusararu/unslop-ui-skill) / TELLS）；非 Marketplace 文案 `unslop` |
| 提示词 | 用户：「调用 unslop 的 skill 来审查我们的页面设计，并给出详尽的改进方案」 |
| 被评材料 | 本番 `komesomme.jp`（home / pair / discover / collections / library，桌面≈1280 + 手机≈390）+ 仓内 UI 正本与实现 |
| 吸收状态 | `open` |
| 约束 | 米色纸底按 [08-ui-design.md](../../08-ui-design.md) 为有意品牌，**不计** cream SaaS tell；下一程仍以 [20-growth-plan.md](../../20-growth-plan.md) §4.0 为准，**勿**借本审查重做首页 |

## 吸收跟踪（triage 后填）

| 锐评点（摘要） | disposition | 落到何处 |
| --- | --- | --- |
| F1 overlay 禁词 |  |  |
| F2 料理页表上移 |  |  |
| F3 咨询 CTA 去渐变胶囊 |  |  |
| F4 DiscoverDailyHint 去玻璃 |  |  |
| F5 料理页 eyebrow |  |  |
| F6 ambient 色晕 |  |  |
| F7 Discover teaser 权重 |  |  |
| F8 ライブラリ密度 |  |  |
| Plan 05 銘柄比較 8–12（产品） |  | 见 docs/20 §4.0；非本审查发明 |

## 总判

公开面已经有清晰方向：和纸米色、插画、地图交互、编辑列表。常见 AI 壳（Inter、紫渐变、icon 三卡、fade-up 全页、双 CTA hero）基本没有。

真正像「生成物」的是目录 `overlay` 的夸张日文，以及咨询按钮 / 提示浮卡上残留的软 SaaS 零件。料理页写得像杂志，但对「比起就买」偏慢——这和成长计划的転化目标打架，比换圆角更值得改。

| 计数 | 值 |
| --- | --- |
| 确认 findings | 8 |
| 高 | 2（F1、F2） |
| 中 | 3（F3–F5） |
| 低 | 3（F6–F8） |
| 已洁净（勿误伤） | 8 项 |

### 先决策（REQUIRES-APPROVAL）

- **F2**：是否把比较表抬进首屏（会缩短散文）。
- **F6**：是否减弱 ambient 色晕（会动 `globals.css`）。

其余可直接排期。产品下一程仍以 **2B 比較页 + /ops 页型拆分**为先。

---

## Findings（按严重度）

### F1 · 高 · 文案 / 目录

| | |
| --- | --- |
| 位置 | `src/data/rice/overlay.ts`（约 76 处夸张词命中） |
| Tell | 「最高峰 / 圧倒的 / 究極 / 王道」等 AI 目录文案；违反 [08](../../08-ui-design.md) §8 禁止语与 `japanese-copy` |
| Fix | 按铭柄重写 `short_` / `description` / `lifestyle_scenes` / `semantic_tags`；删禁词，改成可核验的感官描述（甘み・粒・冷めた後）。先清推荐 Top 与比较页会露出的铭柄 |
| 标志 | 可直接做 |

### F2 · 高 · 信息架构 / 转化

| | |
| --- | --- |
| 位置 | `PairView.tsx` · `ComparisonTable.tsx` · `/pair/[dish]` |
| Tell | 首屏 ≈ eyebrow + H1 + dek + inset 图 + 散文；「今夜の候補」与お店で探す需下滚 |
| Fix | 首屏保留 H1 + 一句 dek + 图；散文缩短或移到表后；比较表上移到 fold 内；表下购买按钮用具体动作文案。**不改首页** |
| 标志 | 审批 · 产品取舍 |

### F3 · 中 · 组件

| | |
| --- | --- |
| 位置 | `ConsultForm.tsx`（约 105–116 行） |
| Tell | `rounded-full` + `linear-gradient(accent→deep)` + Sparkle = 常见 AI/SaaS 主按钮 |
| Fix | 实色 `--km-accent`；圆角与外枠对齐（约 12–14px）；图标更克制或去掉装饰图标 |
| 标志 | 动 DS |

### F4 · 中 · 组件

| | |
| --- | --- |
| 位置 | `DiscoverDailyHint.tsx`（约 50 行） |
| Tell | `rounded-xl` + `backdrop-blur` + 软阴影 = glass card；叠在地图上抢注意力 |
| Fix | 不透明 `--km-surface`；去掉 blur；以 1px border 为主；文案压到一句 + 链到 `/discover` |
| 标志 | 可直接做 |

### F5 · 中 · 排版

| | |
| --- | --- |
| 位置 | `PairView.tsx`（「料理で選ぶ」小字） |
| Tell | muted eyebrow 压在 H1 上（Layer 1 eyebrow 变体） |
| Fix | 删掉页内 eyebrow；面包屑 + H1 已够导航 |
| 标志 | 可直接做 |

### F6 · 低 · 表面

| | |
| --- | --- |
| 位置 | `globals.css` `body::before` |
| Tell | 三层 radial-gradient 暖色椭圆，接近 soft blob 背景 |
| Fix | 可保留（品牌氛围）。若要进一步 unslop：减弱到单层或仅首页，长文页用纯 `--km-bg` |
| 标志 | 审批 · 动 DS |

### F7 · 低 · 布局

| | |
| --- | --- |
| 位置 | `DiscoverPairTeaser.tsx` |
| Tell | 等大缩略网格接近 feature soup；有真图，不算空图标卡 |
| Fix | 第一张加大；或改成与 `/pair` 索引一致的列表+封面 |
| 标志 | 审批 |

### F8 · 低 · 密度

| | |
| --- | --- |
| 位置 | `/library` · `LibraryBrowser` |
| Tell | 行高与留白偏杂志，一屏可见铭柄少（扫描效率，不是典型 slop） |
| Fix | 桌面略压行距；移动端保持触控高度。不做卡片墙 |
| 标志 | 可直接做 |

---

## 执行计划（建议顺序）

设计系统改动先于实例。01 与 02 可并行。**05 来自成长计划，权重大于装饰性 unslop。**

| 序 | 计划 | 依赖 | 触达文件 | 完成样子 |
| --- | --- | --- | --- | --- |
| 01 | 清 overlay 禁词与空洞 lifestyle | 无 | `src/data/rice/overlay.ts`（分批） | 推荐栏、事典、比较露出的短文可念给店头听；与 08 §8 一致 |
| 02 | 料理页：表上移 + 具体购买动作 | 可与 01 并行；结构取舍需点头 | `PairView.tsx` · `ComparisonTable` · `ShopLinksStrip` 调用处 | 首屏能看见今夜の候補；店按钮是动作不是装饰 |
| 03 | 咨询主按钮去渐变胶囊 | 动按钮造型（DS） | `ConsultForm.tsx` · 可选 shared 按钮类 | 主 CTA 与和纸外枠同一套半径/实色 |
| 04 | 发现提示卡去玻璃 | 无 | `DiscoverDailyHint.tsx` | 提示不抢地图；表面与 surface token 一致 |
| 05 | 銘柄比較页 8–12 对（产品优先） | 成长计划 2B | 新路由 + editorial 数据 + ops `page_type` | 搜「AとBの違い」有着陆；观测可按页型拆 |

### Plan 步骤摘要

1. **01**：列禁词命中铭柄 → 优先 Top 曝光与 `/pair` 引用铭柄 → `short_` 一句感官 → 删 `semantic_tags` 里的最高峰类 → 跑相关 validate。
2. **02**：压缩 dek 与导语 → `ComparisonTable` 紧跟图 → 表行内/表下 CTA 改具体动作 → 有直链用直链 → 桌面+390 验收 fold。
3. **03**：实色 accent → 半径对齐面板 → 弱化或移除 Sparkle → 空态描边按钮保持。
4. **04**：去 `backdrop-blur` → 不透明 surface → border 为主 → 一句文案 + `/discover`。
5. **05**：按 docs/20 §4.0：人手 8–12 对、表结构沿用料理页、「要小心什么」列、联盟标记、sitemap、e2e。

---

## 已洁净（不要误伤）

- 无 Inter / Geist；日文系统ゴシック + 明朝
- 无 indigo / 紫渐变 / VibeCode purple
- 米色纸底是 docs/08 品牌正本，不是误用的 cream SaaS
- 首页不是落地 hero（无双 CTA、无统计条、无 pill eyebrow 主标题）
- 编辑页以插画/摄影 + 列表行为主，非 icon-card 功能汤
- 动效绑交互（地图粒、推荐交叉淡入），无全页 fade-up
- Phosphor 图标库，无模型生成 SVG
- 法务 footer 精简，非四列 Product/Company 肥脚

## 明确不做（本轮）

- 改首页地图壳 / 解锁 `HomeReadingStrip`
- 换字体、再画县图、新特集架子
- 登录收藏 / App / 多轮咨询 / 桃和牛酒站
- 为观测再开 Sentry·GA4·GSC 工单
- 把米色系统改成冷白（违反品牌正本）
- 用 Layer2 Editorial Bold 样例覆盖日文和纸方向

## 验收清单（执行某 plan 时用）

- overlay 抽样 20 铭柄：禁词零命中；`short_` 可朗读
- `/pair/curry` 1280 与 390：首屏可见比较表至少两行 + 一个具体店按钮
- 咨询按钮：无渐变、非 full-pill；`prefers-reduced-motion` 下无异常
- `DiscoverDailyHint`：无 `backdrop-blur`；不挡推荐栏与咨询
- 回归：`npm run test:unit`；相关 e2e pair / library；用户可感知变更按 semver 升 patch

## 方法说明

本仓未安装 0design unslop MCP（无 pinned canon / detector）。审查用公开 unslop-ui skill（Layer1 anti-tells）+ 仓内设计正本做 judgement。米色纸底按「尊重已文档化决策」不计为 cream slop。

证据：代码 recon + `komesomme.jp` 桌面/手机实机。审查当时只读，未改产品源码。

交互版摘要曾落在 Cursor Canvas「KomeSomme Unslop 页面设计审查」（会话产物；**正本以本文为准**）。
