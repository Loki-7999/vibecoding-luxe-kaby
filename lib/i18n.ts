import "server-only";
import { cookies } from "next/headers";

const dictionaries = {
  es: () => import("./dictionaries/es.json").then((module) => module.default),
  en: () => import("./dictionaries/en.json").then((module) => module.default),
  fr: () => import("./dictionaries/fr.json").then((module) => module.default),
  it: () => import("./dictionaries/it.json").then((module) => module.default),
};

export type Locale = keyof typeof dictionaries;
export const defaultLocale: Locale = "es";
export const COOKIE_NAME = "luxe_locale";

export async function getDictionary(locale: string) {
  if (locale in dictionaries) {
    return dictionaries[locale as Locale]();
  }
  return dictionaries[defaultLocale]();
}

export async function getLocale() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get(COOKIE_NAME);
  const locale = localeCookie?.value || defaultLocale;
  return locale as Locale;
}
