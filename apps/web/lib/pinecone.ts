/**
 * Pinecone client and recommendation engine for NurseAda.
 * Uses integrated embeddings (llama-text-embed-v2) via index created with:
 *   pc index create -n nurseada-recommendations -m cosine -c aws -r us-east-1 --model llama-text-embed-v2 --field_map text=content
 */

import { Pinecone } from "@pinecone-database/pinecone";

const INDEX_NAME = process.env.PINECONE_INDEX ?? "nurseada-recommendations";
const NAMESPACE = "items";

function getApiKey(): string {
  const key =
    process.env.PINECONE_API_KEY ?? process.env.VECTOR_DB_API_KEY ?? "";
  if (!key?.trim()) {
    throw new Error(
      "PINECONE_API_KEY or VECTOR_DB_API_KEY required. Add to .env"
    );
  }
  return key.trim();
}

let _client: Pinecone | null = null;

export function getPineconeClient(): Pinecone {
  if (!_client) {
    _client = new Pinecone({ apiKey: getApiKey() });
  }
  return _client;
}

export function getRecommendationsIndex() {
  return getPineconeClient().index(INDEX_NAME);
}

/** Record shape for recommendation items (content = text to embed) */
export interface RecommendationRecord {
  _id: string;
  content: string;
  category: string;
  [key: string]: string | number | boolean | undefined;
}

/** Search hit with typed fields */
export interface RecommendationHit {
  _id: string;
  _score: number;
  fields: Record<string, unknown>;
}

/**
 * Get similar items by item ID.
 * Fetches the item's content first, then searches for semantically similar items.
 * Excludes the source item from results.
 */
export async function getRecommendations(
  itemId: string,
  options?: { topK?: number; categoryFilter?: string }
): Promise<RecommendationHit[]> {
  const { topK = 5, categoryFilter } = options ?? {};
  const index = getRecommendationsIndex();
  const ns = index.namespace(NAMESPACE);

  // 1. Fetch the source item to get its content for similarity search
  const fetchResult = await ns.fetch({ ids: [itemId] });
  const record = fetchResult.records?.[itemId];
  if (!record?.metadata) {
    throw new Error(`Item not found: ${itemId}`);
  }
  const metadata = record.metadata as Record<string, unknown>;
  const content = String(metadata?.content ?? "");
  if (!content) {
    throw new Error(`Item ${itemId} has no content`);
  }

  // 2. Search for similar items by content (exclude self via filter if supported, or filter in code)
  const query = {
    topK: topK * 2 + 1, // extra for reranking, +1 to account for self
    inputs: { text: content },
    ...(categoryFilter && { filter: { category: { $eq: categoryFilter } } }),
  };

  const results = await ns.searchRecords({
    query,
    rerank: {
      model: "bge-reranker-v2-m3",
      topN: topK + 1,
      rankFields: ["content"],
    },
  });

  // 3. Exclude the source item from results
  const hits = (results.result?.hits ?? []).filter((h) => h._id !== itemId);
  return hits.slice(0, topK) as RecommendationHit[];
}

/**
 * Get similar items by free-text query (e.g. "remedies for nausea").
 * Use when you don't have an item ID.
 */
export async function getRecommendationsByQuery(
  queryText: string,
  options?: { topK?: number; categoryFilter?: string }
): Promise<RecommendationHit[]> {
  const { topK = 5, categoryFilter } = options ?? {};
  const index = getRecommendationsIndex();
  const ns = index.namespace(NAMESPACE);

  const query = {
    topK: topK * 2,
    inputs: { text: queryText },
    ...(categoryFilter && { filter: { category: { $eq: categoryFilter } } }),
  };

  const results = await ns.searchRecords({
    query,
    rerank: {
      model: "bge-reranker-v2-m3",
      topN: topK,
      rankFields: ["content"],
    },
  });

  return (results.result?.hits ?? []) as RecommendationHit[];
}

/**
 * Upsert items into the recommendations index.
 * Wait 10+ seconds after upserting before searching (Pinecone eventual consistency).
 */
export async function upsertRecommendationRecords(
  records: RecommendationRecord[]
): Promise<void> {
  const index = getRecommendationsIndex();
  const ns = index.namespace(NAMESPACE);
  const BATCH_SIZE = 96;

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    const batch = records.slice(i, i + BATCH_SIZE);
    await ns.upsertRecords({
      records: batch as Parameters<typeof ns.upsertRecords>[0]["records"],
    });
  }
}
