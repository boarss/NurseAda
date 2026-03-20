export function formatRecommendations(recommendations?: string[] | null): string[] {
  if (!Array.isArray(recommendations)) return [];
  const out: string[] = [];
  const seen = new Set<string>();
  for (const rec of recommendations) {
    if (typeof rec !== "string") continue;
    const cleaned = rec.trim();
    if (!cleaned) continue;
    const key = cleaned.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(cleaned);
  }
  return out;
}
