import { NextResponse } from "next/server";
import { COOKIE_NAME, defaultLocale, type Locale } from "@/lib/i18n";

const supportedLocales = new Set<Locale>(["es", "en", "fr", "it"]);

export async function POST(request: Request) {
  const body = (await request.json()) as { locale?: string };
  const locale = supportedLocales.has(body.locale as Locale)
    ? (body.locale as Locale)
    : defaultLocale;

  const response = NextResponse.json({ ok: true, locale });
  response.cookies.set(COOKIE_NAME, locale, {
    path: "/",
    maxAge: 60 * 60 * 24 * 365,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });

  return response;
}
