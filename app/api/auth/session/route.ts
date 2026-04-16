import { NextResponse } from "next/server";
import { clearAuthCookies, setAuthCookies } from "@/lib/auth-cookies";
import { ensureUserRole } from "@/lib/supabase-server";

export async function POST(request: Request) {
  const body = (await request.json()) as {
    accessToken?: string;
    refreshToken?: string | null;
  };

  if (!body.accessToken) {
    return NextResponse.json(
      { error: "Missing access token." },
      { status: 400 }
    );
  }

  const response = NextResponse.json({ ok: true });
  setAuthCookies(response, {
    accessToken: body.accessToken,
    refreshToken: body.refreshToken,
  });
  await ensureUserRole(body.accessToken);

  return response;
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  clearAuthCookies(response);
  return response;
}
