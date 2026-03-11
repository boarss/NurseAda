"use client";

import { useTranslations } from "next-intl";
import { useLocale } from "@/lib/IntlProvider";
import type { SupportedLanguage } from "@/lib/locale";

const LANGUAGES: { code: SupportedLanguage; flag: string }[] = [
  { code: "en", flag: "🇬🇧" },
  { code: "pcm", flag: "🇳🇬" },
  { code: "ha", flag: "🇳🇬" },
  { code: "yo", flag: "🇳🇬" },
  { code: "ig", flag: "🇳🇬" },
];

export function LanguagePicker({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();
  const t = useTranslations("language");

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as SupportedLanguage)}
      aria-label={t("select")}
      className={
        className ??
        "rounded-card border border-border bg-surface text-fg px-2 py-1.5 text-xs font-body focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
      }
    >
      {LANGUAGES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.flag} {t(l.code)}
        </option>
      ))}
    </select>
  );
}
