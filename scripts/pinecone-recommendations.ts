/**
 * Pinecone Recommendation Engine - Runnable script
 *
 * Prerequisites:
 * 1. Create index (run once):
 *    pc index create -n nurseada-recommendations -m cosine -c aws -r us-east-1 --model llama-text-embed-v2 --field_map text=content
 *
 * 2. Add to .env:
 *    PINECONE_API_KEY=your-key
 *    # or VECTOR_DB_API_KEY=your-key
 *
 * Run: npx tsx scripts/pinecone-recommendations.ts
 */

import { config } from "dotenv";
import path from "path";

// Load .env from project root
config({ path: path.resolve(process.cwd(), ".env") });

import {
  getRecommendations,
  getRecommendationsByQuery,
  upsertRecommendationRecords,
  type RecommendationRecord,
} from "../apps/web/lib/pinecone";

// Sample items (herbal remedies style - relevant to NurseAda)
const SAMPLE_RECORDS: RecommendationRecord[] = [
  {
    _id: "ginger",
    content:
      "Ginger (Zingiber officinale): May help with nausea and vomiting. Steep fresh ginger in hot water as tea. Generally safe; avoid in large amounts if on blood thinners.",
    category: "digestive",
  },
  {
    _id: "bitter-leaf",
    content:
      "Bitter leaf (Vernonia amygdalina): Traditionally used for malaria prophylaxis and digestive support in West Africa. Evidence is limited; do not replace antimalarial medication.",
    category: "malaria",
  },
  {
    _id: "honey",
    content:
      "Honey with warm water or lemon: May soothe cough and sore throat. Do NOT give honey to infants under 1 year (botulism risk).",
    category: "respiratory",
  },
  {
    _id: "peppermint",
    content:
      "Peppermint tea may help with mild headache and digestive discomfort. Avoid if you have GERD or gallstones.",
    category: "digestive",
  },
  {
    _id: "turmeric",
    content:
      "Turmeric (Curcuma longa): Anti-inflammatory properties. May support joint health. Use with black pepper for absorption. Avoid in large doses if on blood thinners.",
    category: "inflammatory",
  },
  {
    _id: "moringa",
    content:
      "Moringa (Moringa oleifera): Nutrient-dense leaves. Traditional use for energy and nutrition. Rich in vitamins and minerals.",
    category: "nutrition",
  },
  {
    _id: "lemongrass",
    content:
      "Lemongrass tea: May help with mild anxiety and digestive issues. Refreshing, citrus flavor. Generally well tolerated.",
    category: "digestive",
  },
  {
    _id: "clove",
    content:
      "Clove (Syzygium aromaticum): Traditional for toothache and oral discomfort. Antimicrobial properties. Use sparingly.",
    category: "dental",
  },
  {
    _id: "garlic",
    content:
      "Garlic: May support immune function and cardiovascular health. Avoid in large amounts if on blood thinners or before surgery.",
    category: "immune",
  },
  {
    _id: "fenugreek",
    content:
      "Fenugreek seeds: Traditional for blood sugar support and lactation. May cause digestive upset. Consult provider if diabetic.",
    category: "metabolic",
  },
];

async function main() {
  console.log("Pinecone Recommendation Engine - NurseAda\n");

  try {
    // 1. Upsert sample data
    console.log("1. Upserting sample records...");
    await upsertRecommendationRecords(SAMPLE_RECORDS);
    console.log(`   Upserted ${SAMPLE_RECORDS.length} records.\n`);

    // 2. Wait for indexing (Pinecone eventual consistency)
    console.log("2. Waiting 12 seconds for indexing...");
    await new Promise((r) => setTimeout(r, 12000));
    console.log("   Done.\n");

    // 3. Get recommendations by item ID
    console.log("3. Recommendations similar to 'ginger':");
    const similarToGinger = await getRecommendations("ginger", { topK: 3 });
    for (const hit of similarToGinger) {
      const fields = hit.fields as Record<string, unknown>;
      const content = String(fields?.content ?? "").slice(0, 80);
      console.log(`   - ${hit._id} (score: ${hit._score.toFixed(3)}): ${content}...`);
    }

    // 4. Get recommendations by free-text query
    console.log("\n4. Recommendations for query 'remedies for stomach upset':");
    const byQuery = await getRecommendationsByQuery("remedies for stomach upset", {
      topK: 3,
    });
    for (const hit of byQuery) {
      const fields = hit.fields as Record<string, unknown>;
      const content = String(fields?.content ?? "").slice(0, 80);
      console.log(`   - ${hit._id} (score: ${hit._score.toFixed(3)}): ${content}...`);
    }

    console.log("\n✓ Recommendation engine working.");
  } catch (err) {
    console.error("Error:", err);
    process.exit(1);
  }
}

main();
