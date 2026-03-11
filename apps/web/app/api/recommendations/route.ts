/**
 * GET /api/recommendations
 * Query params: itemId (get similar to item) OR q (free-text query), topK?, category?
 *
 * Examples:
 *   /api/recommendations?itemId=ginger&topK=5
 *   /api/recommendations?q=remedies+for+nausea&topK=5
 */

import { NextRequest, NextResponse } from "next/server";
import {
  getRecommendations,
  getRecommendationsByQuery,
} from "@/lib/pinecone";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const itemId = searchParams.get("itemId");
  const q = searchParams.get("q");
  const topK = Math.min(20, Math.max(1, parseInt(searchParams.get("topK") ?? "5", 10) || 5));
  const category = searchParams.get("category") ?? undefined;

  if (!itemId && !q) {
    return NextResponse.json(
      { error: "Provide itemId (similar to item) or q (free-text query)" },
      { status: 400 }
    );
  }

  try {
    let hits;
    if (itemId) {
      hits = await getRecommendations(itemId, { topK, categoryFilter: category });
    } else {
      hits = await getRecommendationsByQuery(q!, { topK, categoryFilter: category });
    }

    const items = hits.map((h) => {
      const fields = h.fields as Record<string, unknown>;
      return {
        id: h._id,
        score: h._score,
        content: String(fields?.content ?? ""),
        category: String(fields?.category ?? ""),
      };
    });

    return NextResponse.json({ items });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Recommendation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
