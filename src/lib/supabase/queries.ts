import { createServerClient } from "./server";

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

  const limit = filters?.limit ?? 10;
  const { data, error } = await query.limit(limit);

  if (error) {
    console.error("Failed to fetch rice brands:", error);
    return [];
  }

  return data ?? [];
}

export async function searchRiceBrandsByEmbedding(
  embedding: number[],
  limit: number = 5
) {
  const client = createServerClient();

  const { data, error } = await client.rpc("match_rice_brands", {
    query_embedding: embedding,
    match_count: limit,
  });

  if (error) {
    console.error("Failed to search rice brands by embedding:", error);
    return [];
  }

  return data ?? [];
}
