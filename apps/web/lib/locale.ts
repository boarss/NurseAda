import type { SupportedLanguage } from "@nurseada/shared-ts";

const STORAGE_KEY = "nurseada-locale";
const DEFAULT_LOCALE: SupportedLanguage = "en";
const SUPPORTED: SupportedLanguage[] = ["en", "pcm", "ha", "yo", "ig"];

function isSupportedLocale(v: unknown): v is SupportedLanguage {
  return typeof v === "string" && SUPPORTED.includes(v as SupportedLanguage);
}

function detectBrowserLocale(): SupportedLanguage {
  if (typeof navigator === "undefined") return DEFAULT_LOCALE;
  for (const lang of navigator.languages ?? [navigator.language]) {
    const tag = lang.toLowerCase().split("-")[0];
    if (isSupportedLocale(tag)) return tag;
    if (tag === "ha" || tag === "hau") return "ha";
    if (tag === "yo" || tag === "yor") return "yo";
    if (tag === "ig" || tag === "ibo") return "ig";
  }
  return DEFAULT_LOCALE;
}

export function getLocale(): SupportedLanguage {
  if (typeof window === "undefined") return DEFAULT_LOCALE;
  const stored = localStorage.getItem(STORAGE_KEY);
  if (isSupportedLocale(stored)) return stored;
  const detected = detectBrowserLocale();
  localStorage.setItem(STORAGE_KEY, detected);
  return detected;
}

export function setLocale(locale: SupportedLanguage): void {
  if (!isSupportedLocale(locale)) return;
  localStorage.setItem(STORAGE_KEY, locale);
}

export { SUPPORTED as SUPPORTED_LOCALES, DEFAULT_LOCALE };
export type { SupportedLanguage };
