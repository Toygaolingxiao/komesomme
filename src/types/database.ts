/**
 * 数据库类型定义
 * 与 Supabase PostgreSQL 中的 rice_brands 表对应
 */

// 米品牌的核心数据结构
export interface RiceBrand {
  id: string; // UUID
  name: string; // 品牌米名称，如 "新潟新之助"
  origin: string; // 产地，如 "新潟県"
  sweetness: number; // 甜度 1-5
  hardness: number; // 硬度 1-5（横轴）
  stickiness: number; // 粘度 1-5（纵轴）
  description: string; // 特征描述文本
  embedding?: number[]; // 用于 RAG 的文本向量（1536维）
  buy_url: string; // 电商或故乡纳税链接
  created_at?: string; // 创建时间
  updated_at?: string; // 更新时间
}

// 用户选择的米品牌（用于购物车或收藏）
export interface UserSelection {
  id: string; // UUID
  user_id: string; // 用户 ID（可选，如果实现用户系统）
  rice_brand_id: string; // 对应的米品牌 ID
  reason: string; // 用户选择的原因或备注
  created_at?: string; // 创建时间
}

// AI 菜谱推荐的结果
export interface RecipeRecommendation {
  recipe_name: string; // 菜谱名称
  rice_recommendations: RiceBrand[]; // 推荐的米品牌列表
  reasons: string; // AI 生成的推荐理由
  confidence: number; // 推荐置信度 0-1
}

// 2D 矩阵过滤的查询参数
export interface MatrixFilterQuery {
  hardness_min?: number; // 硬度最小值
  hardness_max?: number; // 硬度最大值
  stickiness_min?: number; // 粘度最小值
  stickiness_max?: number; // 粘度最大值
  sweetness_min?: number; // 甜度最小值
  sweetness_max?: number; // 甜度最大值
  limit?: number; // 返回结果数量限制
}
