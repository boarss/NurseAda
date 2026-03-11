# Pinecone Recommendation Engine (TypeScript)

Semantic recommendation engine using Pinecone's integrated embeddings. Suggests similar items (e.g. herbal remedies) based on content similarity.

## Setup

### 1. Create a Pinecone index

**Option A: Pinecone CLI** (recommended)

```bash
# Install CLI: https://github.com/pinecone-io/cli/releases (Windows: download .exe)

# Authenticate (use API key from https://app.pinecone.io)
pc auth configure --api-key YOUR_API_KEY

# Create index with integrated embeddings
pc index create -n nurseada-recommendations -m cosine -c aws -r us-east-1 --model llama-text-embed-v2 --field_map text=content
```

**Option B: Pinecone Console**

1. Go to [app.pinecone.io](https://app.pinecone.io)
2. Create index: name `nurseada-recommendations`, metric `cosine`, cloud `aws`, region `us-east-1`
3. Enable **Inference** → model `llama-text-embed-v2`, field map `text=content`

### 2. Configure environment

Add to `.env`:

```
PINECONE_API_KEY=your-api-key
# or use existing:
# VECTOR_DB_API_KEY=your-api-key
```

Optional:

```
PINECONE_INDEX=nurseada-recommendations
```

## Run the script

Seeds sample data and runs a quick test:

```bash
npm run pinecone:recommendations
```

## API

**GET /api/recommendations**

| Param     | Description                          |
|-----------|--------------------------------------|
| `itemId`  | Get items similar to this ID        |
| `q`       | Free-text query (e.g. "remedies for nausea") |
| `topK`    | Number of results (default 5, max 20) |
| `category`| Filter by category                   |

Examples:

```
/api/recommendations?itemId=ginger&topK=5
/api/recommendations?q=remedies+for+stomach+upset&topK=5
```

## Usage in code

```typescript
import {
  getRecommendations,
  getRecommendationsByQuery,
  upsertRecommendationRecords,
} from "@/lib/pinecone";

// Similar to item by ID
const hits = await getRecommendations("ginger", { topK: 5 });

// Similar by free-text query
const hits = await getRecommendationsByQuery("remedies for nausea", { topK: 5 });

// Upsert items (wait 10+ seconds before searching)
await upsertRecommendationRecords([
  { _id: "my-item", content: "Description...", category: "digestive" },
]);
```

## Record format

- `_id`: Unique ID
- `content`: Text to embed (required for similarity)
- `category`: Optional filter
- Flat metadata only (no nested objects)
