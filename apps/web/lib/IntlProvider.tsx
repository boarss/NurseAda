"use client";

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react";
import { NextIntlClientProvider } from "next-intl";
import { getLocale, setLocale as persistLocale, type SupportedLanguage } from "./locale";

import en from "../../../packages/locales/en.json";
import pcm from "../../../packages/locales/pcm.json";
import ha from "../../../packages/locales/ha.json";
import yo from "../../../packages/locales/yo.json";
import ig from "../../../packages/locales/ig.json";

const ALL_MESSAGES: Record<SupportedLanguage, typeof en> = { en, pcm, ha, yo, ig };

type LocaleContextValue = {
  locale: SupportedLanguage;
  setLocale: (l: SupportedLanguage) => void;
};

const LocaleContext = createContext<LocaleContextValue>({
  locale: "en",
  setLocale: () => {},
});

export function useLocale() {
  return useContext(LocaleContext);
}

export function IntlProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<SupportedLanguage>("en");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(getLocale());
    setMounted(true);
  }, []);

  const handleSetLocale = useCallback((l: SupportedLanguage) => {
    persistLocale(l);
    setLocaleState(l);
  }, []);

  const messages = ALL_MESSAGES[locale] ?? en;

  if (!mounted) {
    return (
      <NextIntlClientProvider locale="en" messages={en}>
        {children}
      </NextIntlClientProvider>
    );
  }

  return (
    <LocaleContext.Provider value={{ locale, setLocale: handleSetLocale }}>
      <NextIntlClientProvider locale={locale} messages={messages}>
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}
