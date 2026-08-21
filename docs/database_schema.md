# 数据库设计书 (Supabase / PostgreSQL)

## 核心表结构：`rice_brands`

| カラム名 | データ型 | 制約 | 説明 |
| :--- | :--- | :--- | :--- |
| `id` | `uuid` | Primary Key | 自动生成 UUID |
| `name` | `text` | NOT NULL | 品牌米名称（例：青天の霹靂） |
| `prefecture` | `text` | NOT NULL | 产地（例：青森県） |
| `sweetness` | `integer` | 1〜5 | 甘みスコア |
| `hardness` | `integer` | 1〜5 | 硬さスコア |
| `stickiness` | `integer` | 1〜5 | 粘りスコア |
| `best_match_dishes` | `text[]` | | 相性料理数组 |
| `description` | `text` | NOT NULL | 特征、历史与口感详细解说 |
| `embedding` | `vector(1536)` | | 用于 RAG 的向量字段 (`text-embedding-3-small`) |
| `affiliate_amazon` | `text` | | Amazon 购买链接 |
| `affiliate_furusato` | `text` | | 故乡纳税购买链接 |

## 扩展与安全配置
- 启用 `pgvector` 扩展。
- 配置 RLS (Row Level Security)，仅允许匿名用户进行 `SELECT` 读取，禁止客户端直接写入。
