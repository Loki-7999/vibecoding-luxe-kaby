import type { NextResponse } from "next/server";

export const ACCESS_TOKEN_COOKIE = "luxe-access-token";
export const REFRESH_TOKEN_COOKIE = "luxe-refresh-token";

const baseCookieOptions = {
  httpOnly: true,
  path: "/",
  sameSite: "lax" as const,
  secure: process.env.NODE_ENV === "production",
};

export function setAuthCookies(
  response: NextResponse,
  session: {
    accessToken: string;
    refreshToken?: string | null;
  }
) {
  response.cookies.set(ACCESS_TOKEN_COOKIE, session.accessToken, baseCookieOptions);

  if (session.refreshToken) {
    response.cookies.set(REFRESH_TOKEN_COOKIE, session.refreshToken, baseCookieOptions);
  }
}

export function clearAuthCookies(response: NextResponse) {
  response.cookies.delete(ACCESS_TOKEN_COOKIE);
  response.cookies.delete(REFRESH_TOKEN_COOKIE);
}
