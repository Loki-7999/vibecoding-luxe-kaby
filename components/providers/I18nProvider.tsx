"use client";

import { createContext, useContext, ReactNode } from "react";
import type { Locale } from "@/lib/i18n";

type Dictionary = Record<string, any>;

interface I18nContextProps {
  locale: Locale;
  dictionary: Dictionary;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextProps | undefined>(undefined);

export function I18nProvider({
  children,
  locale,
  dictionary,
}: {
  children: ReactNode;
  locale: Locale;
  dictionary: Dictionary;
}) {
  const t = (key: string) => {
    const keys = key.split(".");
    let current = dictionary;
    for (const k of keys) {
      if (current[k] === undefined) {
        console.warn(`Translation key not found: ${key}`);
        return key;
      }
      current = current[k];
    }
    return current as unknown as string;
  };

  return (
    <I18nContext.Provider value={{ locale, dictionary, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  const context = useContext(I18nContext);
  if (context === undefined) {
    throw new Error("useTranslation must be used within an I18nProvider");
  }
  return context;
}
