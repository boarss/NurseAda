export type ClinicalCode = {
  system: string;
  code: string;
  display: string;
};

export type ClinicalDiagnosis = {
  severity: "low" | "medium" | "high" | "emergency" | string;
  reasoning?: string;
  inferred_codes: ClinicalCode[];
  confidence?: number;
};

export function getDiagnosisSummary(diagnosis?: ClinicalDiagnosis | null): string {
  if (!diagnosis) return "No diagnosis metadata available.";
  const confidence =
    typeof diagnosis.confidence === "number"
      ? ` (${Math.round(diagnosis.confidence * 100)}% confidence)`
      : "";
  return `${diagnosis.severity}${confidence}`;
}
