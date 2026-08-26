# KomeSomme 综合系统设计书 (Master Design Spec v3.0)

## 1. 系统架构与技术栈
- **核心框架:** Next.js (App Router, React Server Components)
- **UI & 样式:** Tailwind CSS, shadcn/ui (基础组件), Recharts (2D 矩阵图表), Lucide React (图标)
- **数据库 & Auth:** Supabase (PostgreSQL + pgvector + RLS)
- **AI 引擎:** OpenAI API (gpt-4o-mini 用于 RAG 推理, text-embedding-3-small 用于向量生成)
- **部署与性能:** Vercel (Edge Functions 优化流式输出)

## 2. 核心路由与目录规范
```text
src/
├── app/
│   ├── page.tsx                 # 主交互界面（左矩阵 + 右AI）
│   ├── layout.tsx
│   ├── globals.css
│   ├── api/
│   │   └── recommend/route.ts   # AI RAG 推荐接口 (Streaming 返回)
│   └── [brand]/page.tsx         # 品牌米详情 SSR 页面 (SEO 用)
├── components/
│   ├── matrix/
│   │   └── FlavorMatrix.tsx     # 2D 互动风味矩阵 (Recharts)
│   ├── chat/
│   │   └── SommeChat.tsx        # AI 侍米师对话框
│   └── ui/                      # shadcn/ui 通用组件
├── lib/
│   ├── supabase/                # client / server / admin / queries
│   ├── rakuten/                 # 乐天 Affiliate API 封装
│   └── data/
│       └── seed-rice.json       # ブランド米シードデータ
└── types/
    └── database.ts              # 数据库强类型定义 (包含向量 RPC 返回值)

scripts/
└── seed.ts                      # OpenAI embedding + Supabase seed
```
