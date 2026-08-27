# 接下来要做的事

0003 SQL 已经跑过的话，按这个顺序即可。不必再跑 0001 / 0002。

## 1. 确认环境变量

`.env.local` 需要：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`（seed 和语义检索）
- `EMBEDDING_PROVIDER=gemini`（默认）或 `openai`
- `GEMINI_API_KEY` 或 `OPENAI_API_KEY`

换过 embedding 模型必须重新 seed，不同模型的向量不能混比。

## 2. 校验目录

```bash
npm run validate:rice
```

通过标准：80 条以上、ID / 名称不重复、鱼沼・佐渡・仁多・龙之瞳四条 GI / 品牌行存在。禁止词只是 warning。

## 3. 写入 Supabase

```bash
npm run seed:rice
```

约 107 个铭柄，每个打一次 embedding，大约 **2〜3 分钟**。写入的是三张表：

- `rice_regions` 地域 + 地图色
- `rice_brands` 名称 / 产地 / 购买关键词
- `rice_profile_details` 口味、解说、向量

读侧走 VIEW `rice_catalog`。

## 4. 本地验收

```bash
npm run dev
```

打开 http://localhost:3000 ，确认：

- 点的颜色按地域分开，图例与点一致
- 地图是正方形；右栏推荐 + 咨询，桌面没有右栏内部滚动
- 「米ソムリエのおすすめ」「米ソムリエに相談」文案（不再用造语「侍米師」）
- 鱼沼 / 佐渡 / 仁多 是三个独立点，没有「特选」「ゴールド」重复点
- 拖探针或滑块，No.1 始终是最近的点
- 咨询框提交「ハイボールと唐揚げに合う米」，返回 Top 4
- 点开铭柄详情，再进 `/[brand]` 页，乐天 / Amazon / ふるさと納税链接可开

## 5. 之后（不急）

- 生产部署、域名、分析
- Rakuten Affiliate、登录、收藏
- 单测 / E2E / 结构化日志

原典 `docs/kome-somme-rice-v2-implementation.md` 不要改。活文档以本仓库 README 和上表为准。
