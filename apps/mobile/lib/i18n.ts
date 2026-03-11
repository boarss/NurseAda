import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import * as Localization from "expo-localization";
import AsyncStorage from "@react-native-async-storage/async-storage";

import en from "../../../packages/locales/en.json";
import pcm from "../../../packages/locales/pcm.json";
import ha from "../../../packages/locales/ha.json";
import yo from "../../../packages/locales/yo.json";
import ig from "../../../packages/locales/ig.json";

const STORAGE_KEY = "nurseada-locale";
const SUPPORTED = ["en", "pcm", "ha", "yo", "ig"] as const;
type SupportedLang = (typeof SUPPORTED)[number];

function isSupported(v: string): v is SupportedLang {
  return SUPPORTED.includes(v as SupportedLang);
}

function detectDeviceLocale(): SupportedLang {
  for (const loc of Localization.getLocales()) {
    const tag = loc.languageCode?.toLowerCase() ?? "";
    if (isSupported(tag)) return tag;
  }
  return "en";
}

const languageDetector = {
  type: "languageDetector" as const,
  async: true,
  detect: async (callback: (lng: string) => void) => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored && isSupported(stored)) {
        callback(stored);
        return;
      }
    } catch {}
    callback(detectDeviceLocale());
  },
  init: () => {},
  cacheUserLanguage: async (lng: string) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, lng);
    } catch {}
  },
};

i18n
  .use(languageDetector)
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: en },
      pcm: { translation: pcm },
      ha: { translation: ha },
      yo: { translation: yo },
      ig: { translation: ig },
    },
    fallbackLng: "en",
    interpolation: { escapeValue: false },
    compatibilityJSON: "v4",
  });

export default i18n;
export { STORAGE_KEY, SUPPORTED };
export type { SupportedLang };
