# 技术栈与交付模式（SC 素材）

面向咨询侧 Solutions Consultant 的**事实清单**，不是客户册子。写内部方法论时从这里摘层，不要在 overview / checklist 再抄一版版本号。产品正本能力以 [`VERSION`](../VERSION) 与 [00-overview.md](./00-overview.md) 为准。

语言：中文（对内）。日语 UI / 日语产品文档仍以 `08` `11` 等为准。

---

## 1. 分层栈（地面真相）

| 层 | 选型 | 备注 |
| --- | --- | --- |
| **应用框架** | Next.js 15 App Router · React 19 · TypeScript 5 | 单仓；SSR + Route Handler |
| **样式 / 动效** | Tailwind CSS 4 · Motion · Phosphor Icons | 无 chart 库；地图与轮廓用 HTML/CSS/SVG |
| **托管** | Vercel Production | 旗舰域 `komesomme.jp`；`.com` / `sommeatlas.com` → 301 |
| **数据** | Supabase PostgreSQL + pgvector + RLS | VIEW `rice_catalog`；migration 0003–0005 |
| **检索 / AI** | Embedding：Gemini `gemini-embedding-001`（或 OpenAI `text-embedding-3-small`，1536 维）；短回复：Gemini Flash 链（失败 → OpenAI / Flavor Bridge） | **坐标推荐纯客户端**；咨询才打 API |
| **联盟** | 搜索 CTA + 标签 wrap；UI：`ShopLinksStrip`（通販 \| ふるさと） | 楽天 Item Search 隔离见 [13](./13-affiliate-compliance.md)；VC SID 本番未齐 |
| **披露** | 文案正本 `src/lib/affiliate.ts`；表面表 [15](./15-disclosure-surfaces.md) | CTA `※PR`；Amazon 定型在页脚 |
| **观测** | 自建 `access_events` + `track()`；GTM 埋点（ID 可选） | GA4 / Sentry 未接或未配 |
| **试验** | Vitest · Playwright（Desktop/Mobile Chromium）· `validate:rice` · `assert:client-bundle` | CI 全绿门禁见 workflow |
| **CI / 协作** | GitHub Actions · Issue/PR 模板 · Cursor rules（SemVer / 工作流 / 披露） | branch protection 仍要手动开 |

---

## 2. 关键架构决策（可写进方法论的「原则」）

1. **双轨推荐**  
   地图/滑条 = 本地距离；「米ソムリエに相談」才 embedding + RPC。体感快、账单可控、故障时地图仍可用。

2. **打分在 Git，检索在 DB**  
   `sources/` → `validate:rice` → `seed:rice`。禁止在 Table Editor 手拧味道分。

3. **RAG 止于检索 + 极轻生成**  
   Corpus 是日语 `search_text`；Generator 只写短回复且不得编造未入选的铭柄名。

4. **匿名面尽量小**  
   anon 不读 embedding；`access_events` 仅 service role 写；浏览器不进 service_role。

5. **联盟隔离**  
   楽天 API 商品字段不得混入他店 DOM（见 13）。披露表面一张表（见 15），禁止各页各写一套。

6. **版本与可感知变更同 commit**  
   正本只有 `VERSION` + `package.json`；changelog 写到日（`YYYY-MM-DD`）。

7. **共享 chrome**  
   `SiteHeader` + `SITE_COLUMN`；副题固定「米ソムリエ」；`scrollbar-gutter: stable` 消除有无滚动条时的顶栏横移。

---

## 3. 交付物地图（对客户 / 对内）

| 受众 | 打开什么 |
| --- | --- |
| 客户看能力 | 线上 `komesomme.jp` + [00](./00-overview.md) |
| 工程实现 | [03](./03-system-design.md) + 本文件 |
| 上线门禁 | [11](./11-launch-checklist.md) + [smoke-test](./smoke-test.md) |
| 试验式样 | [test-specification](./test-specification.md) |
| 联盟合规 | [13](./13-affiliate-compliance.md) · [14](./14-affiliate-programs.md) · [15](./15-disclosure-surfaces.md) |
| 复盘叙事 | [12](./12-product-journey.md) / [12.ja](./12-product-journey.ja.md) · [02](./02-tech-retrospective.md) |
| 咨询 WBS/甘特 | **不在本仓** → 兄弟仓 `pmo-kit` |

---

## 4. 建议的内部方法论章节骨架（给 SC 后续写）

下面只列标题，正文请按项目另写，避免与产品文档抢正本：

1. **问题定义**：品类选择过载 × 需要可解释的「今日的一膳」  
2. **体验原则**：Sommelier-first，购买 Progressive Disclosure  
3. **双轨推荐模式**：何时本地算、何时上向量（可复用到别的「地图 + 咨询」产品）  
4. **数据治理**：Git 为打分正本、validate 门禁、禁词与轴不变  
5. **合规装配**：披露表面表 + ASP 隔离 + 特商法/隐私最小集  
6. **上线门禁**：P0/P1 清单文化（证据优先于「功能感觉做完了」）  
7. **人机协作**：Cursor rules 把「绝对不改」写成可执行约束  
8. **观测最小集**：先自建事件表，再挂 GTM/GA4  

---

## 5. Issue ボード（2026-08-31 整理後）

### Open

| # | 标题 | 说明 |
| --- | --- | --- |
| [#18](https://github.com/Toygaolingxiao/komesomme/issues/18) | `[P0-3b] branch protection` | main 强制 CI |
| [#20](https://github.com/Toygaolingxiao/komesomme/issues/20) | `[P0-6a] Vercel env 突合` | 域名已上；Dashboard 再确认 |
| [#28](https://github.com/Toygaolingxiao/komesomme/issues/28) | `[P0-5] スモーク A–E 留档` | Desktop+Mobile（#19 已并入） |
| [#27](https://github.com/Toygaolingxiao/komesomme/issues/27) | `[P1-1] VC SID + アフィ突合` | 収益门禁 |
| [#29](https://github.com/Toygaolingxiao/komesomme/issues/29) | `[P1-2] GTM/GA4` | 观测 |
| [#30](https://github.com/Toygaolingxiao/komesomme/issues/30) | `[P1-3] Sentry` | 咨询 5xx |
| [#31](https://github.com/Toygaolingxiao/komesomme/issues/31) | `[P1-4] GSC /library 索引` | スニペット更新 |

### 本轮已关

| # | 说明 |
| --- | --- |
| [#26](https://github.com/Toygaolingxiao/komesomme/issues/26) | 披露 / library リード / SITE_COLUMN（0.5.6） |
| [#19](https://github.com/Toygaolingxiao/komesomme/issues/19) | スモーク → #28 に集約 |
| [#32](https://github.com/Toygaolingxiao/komesomme/issues/32) | お店CTA タグ化（0.6.0） |
| [#33](https://github.com/Toygaolingxiao/komesomme/issues/33) | SiteHeader + scrollbar-gutter（0.6.1） |

### 不要当 1.0 挡门重开

Auth · 收藏 · 商品 API · 多轮咨询 · PWA（仍属 P2）。

---

## 6. 相关正本

- 系统图：[03-system-design.md](./03-system-design.md)  
- 技术回顾表：[02-tech-retrospective.md](./02-tech-retrospective.md)  
- 生产 env：[vercel-production.md](./vercel-production.md)  
- SemVer：[01-versioning.md](./01-versioning.md)
