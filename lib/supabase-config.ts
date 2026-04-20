const ENV_SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim() ?? "";
const ENV_SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim() ?? "";
const FALLBACK_SUPABASE_URL = "https://hdywrmdgurjbjzfsvvkr.supabase.co";
const FALLBACK_SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhkeXdybWRndXJqYmp6ZnN2dmtyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzUwODQwNzQsImV4cCI6MjA5MDY2MDA3NH0.oKuoZoEiA4vWWYj6sDGxSoyPkRkUFWbQsMxibzaBGnc";

export const SUPABASE_CONFIG_ERROR =
  "Missing or invalid Supabase configuration. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.";

let hasWarnedMissingConfig = false;
let hasWarnedUsingFallback = false;

function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function hasSupabaseEnv() {
  return Boolean(resolveSupabaseEnv());
}

export function getSupabaseEnv() {
  const resolvedConfig = resolveSupabaseEnv();

  if (!resolvedConfig) {
    throw new Error(SUPABASE_CONFIG_ERROR);
  }

  return resolvedConfig;
}

export function warnMissingSupabaseEnv(context: string) {
  if (hasSupabaseEnv()) {
    return;
  }

  if (!hasWarnedMissingConfig) {
    hasWarnedMissingConfig = true;
    console.warn(`[supabase] ${context}: ${SUPABASE_CONFIG_ERROR}`);
  }
}

function resolveSupabaseEnv() {
  if (isValidHttpUrl(ENV_SUPABASE_URL) && ENV_SUPABASE_ANON_KEY.length > 0) {
    return {
      supabaseAnonKey: ENV_SUPABASE_ANON_KEY,
      supabaseUrl: ENV_SUPABASE_URL,
    };
  }

  if (isValidHttpUrl(FALLBACK_SUPABASE_URL) && FALLBACK_SUPABASE_ANON_KEY.length > 0) {
    if (!hasWarnedUsingFallback) {
      hasWarnedUsingFallback = true;
      console.warn("[supabase] Using embedded public fallback configuration.");
    }

    return {
      supabaseAnonKey: FALLBACK_SUPABASE_ANON_KEY,
      supabaseUrl: FALLBACK_SUPABASE_URL,
    };
  }

  return null;
}
