import { createClient } from "@supabase/supabase-js";

export function createServerSupabaseClient(accessToken?: string) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error("Missing Supabase environment variables.");
  }

  return createClient(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    global: accessToken
      ? {
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      : undefined,
  });
}

export async function getValidatedUser(accessToken: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.getUser(accessToken);

  if (error) {
    return null;
  }

  return data.user ?? null;
}

export async function refreshAccessToken(refreshToken: string) {
  const supabase = createServerSupabaseClient();
  const { data, error } = await supabase.auth.refreshSession({
    refresh_token: refreshToken,
  });

  if (error) {
    return null;
  }

  return data.session ?? null;
}

export async function getUserRole(accessToken: string, userId: string) {
  const supabase = createServerSupabaseClient(accessToken);
  const { data, error } = await supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    return null;
  }

  return (data?.role as string | null) ?? null;
}

export async function ensureUserRole(accessToken: string) {
  const supabase = createServerSupabaseClient(accessToken);
  const { error } = await supabase.rpc("ensure_user_role");

  if (error) {
    return false;
  }

  return true;
}
