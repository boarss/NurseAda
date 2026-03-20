export type ExtractedSymptom = {
  term: string;
  present: boolean;
  negated: boolean;
  duration?: string | null;
  severity?: string | null;
};

export function isExtractedSymptom(value: unknown): value is ExtractedSymptom {
  if (!value || typeof value !== "object") return false;
  const v = value as Record<string, unknown>;
  return (
    typeof v.term === "string" &&
    typeof v.present === "boolean" &&
    typeof v.negated === "boolean"
  );
}

export function normalizeExtractedSymptoms(value: unknown): ExtractedSymptom[] {
  if (!Array.isArray(value)) return [];
  return value.filter(isExtractedSymptom).map((item) => ({
    term: item.term.trim().toLowerCase(),
    present: item.present,
    negated: item.negated,
    duration: item.duration ?? null,
    severity: item.severity ?? null,
  }));
}
