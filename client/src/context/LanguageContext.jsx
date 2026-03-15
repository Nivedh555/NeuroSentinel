import { createContext, useContext, useMemo, useState } from "react";
import { LANGUAGES, translations, phraseTranslations } from "../i18n/languages";

const DEFAULT_LANGUAGE = "en";
const STORAGE_KEY = "appLanguage";

const LanguageContext = createContext(null);

const interpolate = (text, values = {}) => {
  return Object.entries(values).reduce((acc, [key, value]) => {
    return acc.replace(new RegExp(`\\{${key}\\}`, "g"), String(value));
  }, text);
};

export const LanguageProvider = ({ children }) => {
  const initial = localStorage.getItem(STORAGE_KEY) || DEFAULT_LANGUAGE;
  const [language, setLanguage] = useState(LANGUAGES[initial] ? initial : DEFAULT_LANGUAGE);
  const [hasLanguageSelection, setHasLanguageSelection] = useState(!!localStorage.getItem(STORAGE_KEY));

  const changeLanguage = (nextLang) => {
    if (!LANGUAGES[nextLang]) return;
    setLanguage(nextLang);
    localStorage.setItem(STORAGE_KEY, nextLang);
    setHasLanguageSelection(true);
  };

  const t = (key, values = {}) => {
    const langTable = translations[language] || translations[DEFAULT_LANGUAGE];
    const fallbackTable = translations[DEFAULT_LANGUAGE];
    const raw = langTable[key] || fallbackTable[key] || key;
    return interpolate(raw, values);
  };

  const translatePhrase = (text) => {
    if (!text) return text;
    const table = phraseTranslations[language] || {};
    return table[text] || text;
  };

  const value = useMemo(
    () => ({
      language,
      changeLanguage,
      t,
      languages: LANGUAGES,
      speechLocale: LANGUAGES[language]?.speechLocale || LANGUAGES[DEFAULT_LANGUAGE].speechLocale,
      hasLanguageSelection,
      translatePhrase,
    }),
    [language, hasLanguageSelection]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error("useLanguage must be used inside LanguageProvider");
  }
  return context;
};
