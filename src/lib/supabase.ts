/**
 * Supabase 客户端配置
 * 分离浏览器端（客户端组件）和服务端（服务器组件/API）的初始化逻辑
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types"; // 通过 supabase gen types 生成（后期补充）

// ============================================================================
// 环境变量校验
// ============================================================================
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // 仅服务端

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing Supabase environment variables: NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY"
  );
}

// ============================================================================
// 浏览器端客户端 (客户端组件使用)
// ============================================================================
/**
 * 为客户端组件创建 Supabase 客户端实例
 * 使用公开的 Anon Key，适用于浏览器环境
 */
export const createBrowserClient = () => {
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true, // 持久化会话
      autoRefreshToken: true, // 自动刷新令牌
    },
  });
};

// ============================================================================
// 服务端客户端 (服务器组件/API 路由使用)
// ============================================================================
/**
 * 为服务器组件/API 路由创建 Supabase 客户端实例
 * 使用 Service Role Key（如果有的话），具有更高权限
 * 注意：Service Role Key 必须仅在服务端使用，不得泄露给客户端
 */
export const createServerClient = () => {
  // 默认使用 Anon Key，如果需要提升权限再用 Service Role Key
  const key = supabaseServiceKey || supabaseAnonKey;
  return createClient<Database>(supabaseUrl, key, {
    auth: {
      persistSession: false, // 服务端不需要持久化会话
      autoRefreshToken: false,
    },
  });
};

// ============================================================================
// 便捷函数：获取米品牌列表
// ============================================================================
/**
 * 根据 2D 风味矩阵筛选条件获取米品牌
 * @param filters 筛选条件
 * @returns 匹配的米品牌列表
 */
export async function getRiceBrands(filters?: {
  hardnessMin?: number;
  hardnessMax?: number;
  stickinessMin?: number;
  stickinessMax?: number;
  sweetnessMin?: number;
  sweetnessMax?: number;
  limit?: number;
}) {
  const client = createServerClient();
  let query = client.from("rice_brands").select("*");

  if (filters?.hardnessMin !== undefined) {
    query = query.gte("hardness", filters.hardnessMin);
  }
  if (filters?.hardnessMax !== undefined) {
    query = query.lte("hardness", filters.hardnessMax);
  }
  if (filters?.stickinessMin !== undefined) {
    query = query.gte("stickiness", filters.stickinessMin);
  }
  if (filters?.stickinessMax !== undefined) {
    query = query.lte("stickiness", filters.stickinessMax);
  }
  if (filters?.sweetnessMin !== undefined) {
    query = query.gte("sweetness", filters.sweetnessMin);
  }
  if (filters?.sweetnessMax !== undefined) {
    query = query.lte("sweetness", filters.sweetnessMax);
  }

  const limit = filters?.limit || 10;
  const { data, error } = await query.limit(limit);

  if (error) {
    console.error("Failed to fetch rice brands:", error);
    return [];
  }

  return data || [];
}

// ============================================================================
// 便捷函数：基于 RAG 向量搜索
// ============================================================================
/**
 * 使用向量相似度搜索推荐米品牌
 * @param embedding 查询向量（由 OpenAI 生成）
 * @param limit 返回结果数量
 * @returns 最相似的米品牌列表
 */
export async function searchRiceBrandsByEmbedding(
  embedding: number[],
  limit: number = 5
) {
  const client = createServerClient();

  // 使用 pgvector 的相似度搜索（Supabase 原生支持）
  const { data, error } = await client
    .rpc("match_rice_brands", {
      query_embedding: embedding,
      match_count: limit,
    })
    .select("*");

  if (error) {
    console.error("Failed to search rice brands by embedding:", error);
    return [];
  }

  return data || [];
}

// ============================================================================
// 导出客户端实例（用于需要全局访问的场景）
// ============================================================================
export const supabaseClient = createBrowserClient();
