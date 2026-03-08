/**
 * Shared types for NurseAda (web, mobile, gateway contracts).
 */

export type ChatRole = "user" | "assistant" | "system";

export interface ChatMessage {
  role: ChatRole;
  content: string;
}

export interface TriageResult {
  severity: "low" | "medium" | "high" | "emergency";
  suggestions: string[];
  confidence?: number;
}

export interface DrugInteractionWarning {
  drug_a: string;
  drug_b: string;
  severity: string;
  description: string;
}

export const SUPPORTED_LANGUAGES = [
  "en",
  "pcm", // Pidgin
  "ha",  // Hausa
  "yo",  // Yoruba
  "ig",  // Igbo
] as const;

export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];
