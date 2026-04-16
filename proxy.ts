import { NextResponse, type NextRequest } from "next/server";
import { ACCESS_TOKEN_COOKIE, REFRESH_TOKEN_COOKIE, clearAuthCookies, setAuthCookies } from "@/lib/auth-cookies";
import { getUserRole, getValidatedUser, refreshAccessToken } from "@/lib/supabase-server";

function redirectToLogin(request: NextRequest) {
  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

function redirectToForbidden(request: NextRequest) {
  return NextResponse.redirect(new URL("/forbidden", request.url));
}

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get(ACCESS_TOKEN_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_TOKEN_COOKIE)?.value;

  let currentAccessToken = accessToken ?? null;
  let user = currentAccessToken ? await getValidatedUser(currentAccessToken) : null;
  let refreshedSession = null;

  if (!user && refreshToken) {
    refreshedSession = await refreshAccessToken(refreshToken);
    if (refreshedSession?.access_token) {
      currentAccessToken = refreshedSession.access_token;
      user = await getValidatedUser(refreshedSession.access_token);
    }
  }

  if (!user || !currentAccessToken) {
    const response = redirectToLogin(request);
    clearAuthCookies(response);
    return response;
  }

  const role = await getUserRole(currentAccessToken, user.id);

  if (role !== "admin") {
    return redirectToForbidden(request);
  }

  const response = NextResponse.next();

  if (refreshedSession?.access_token) {
    setAuthCookies(response, {
      accessToken: refreshedSession.access_token,
      refreshToken: refreshedSession.refresh_token,
    });
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
