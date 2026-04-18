const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";

export const SUPABASE_CONFIG_ERROR =
  "Missing or invalid Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.";

let hasWarnedMissingConfig = false;

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function hasSupabaseEnv() {
  return isValidHttpUrl(SUPABASE_URL) && SUPABASE_ANON_KEY.length > 0;
}

export function getSupabaseEnv() {
  if (!hasSupabaseEnv()) {
    throw new Error(SUPABASE_CONFIG_ERROR);
  }

  return {
    supabaseAnonKey: SUPABASE_ANON_KEY,
    supabaseUrl: SUPABASE_URL,
  };
}

export function warnMissingSupabaseEnv(context: string) {
  if (hasWarnedMissingConfig || hasSupabaseEnv()) {
    return;
  }

  hasWarnedMissingConfig = true;
  console.warn(`[supabase] ${context}: ${SUPABASE_CONFIG_ERROR}`);
}
