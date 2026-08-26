# KomeSomme (コメソム / AI 侍米师)

> 结合 AI 推荐算法与结构化数据的日本品牌米智能选购导航与ペアリング（Pairing）平台。

## 项目定位
解决消费者面对上百种日本大米时的“选择困难症”。通过 2D 风味矩阵交互与 AI 献立（菜单）推荐，拦截高意图消费流量，实现电商及“故乡纳税（ふるさと納税）”的高效转化。

## 技术栈
- **Frontend:** Next.js (App Router) + TypeScript + Tailwind CSS
- **Deployment:** Vercel
- **Database & RAG:** Supabase (PostgreSQL + pgvector)
- **AI Engine:** OpenAI API (gpt-4o-mini & text-embedding-3-small)

## 本地开发
```bash
npm install
cp .env.example .env.local   # 填入 Supabase / OpenAI 密钥
npm run dev
```

シード（`rice_brands` への投入）:
```bash
npm run seed
```

## 详细设计文档
- [商业企划书](./docs/business_plan.md)
- [数据库设计书](./docs/database_schema.md)
- [系统要件定义书](./docs/requirements.md)
- [AI 提示词与 RAG 设计](./docs/rag_prompt_design.md)
- [综合系统设计书](./docs/master_design_spec.md)
- [开发阶段规划](./docs/development_phases.md)
