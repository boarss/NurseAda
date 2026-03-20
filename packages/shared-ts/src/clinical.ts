export interface ExtractedSymptom {
  term: string;
  present: boolean;
  negated: boolean;
  duration?: string | null;
  severity?: string | null;
}

export interface ClinicalCode {
  system: string;
  code: string;
  display: string;
}

export interface RedFlagHit {
  id: string;
  label: string;
  tier: "emergency" | "urgent" | string;
}

export interface ShapContribution {
  feature: string;
  value: number;
  shap: number;
}

/** SHAP-style contributions for the CDSS multinomial logistic triage head (metadata only). */
export interface ClinicalTriageShap {
  explains_model: "cdss_logistic_triage" | string;
  predicted_class: string;
  base_value?: number;
  top_contributions: ShapContribution[];
}

export interface ClinicalDiagnosis {
  severity: "low" | "medium" | "high" | "emergency" | string;
  reasoning?: string;
  inferred_codes: ClinicalCode[];
  confidence?: number;
  red_flags?: RedFlagHit[];
  shap?: ClinicalTriageShap | null;
}

export interface ClinicalTrace {
  extracted_symptoms: ExtractedSymptom[];
  diagnosis: ClinicalDiagnosis;
  recommendations: string[];
  red_flags?: RedFlagHit[];
}
