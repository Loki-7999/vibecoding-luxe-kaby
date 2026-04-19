"use client";

import type { Session, User } from "@supabase/supabase-js";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import type { AppRole } from "@/lib/admin";
import {
  SUPABASE_CONFIG_ERROR,
  hasSupabaseEnv,
  warnMissingSupabaseEnv,
} from "@/lib/supabase-config";
import { getSupabaseClient } from "@/lib/supabase";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  role: AppRole | null;
  loading: boolean;
  signInWithGoogle: (nextPath?: string) => Promise<void>;
  signInWithGithub: (nextPath?: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<AppRole | null>(null);
  const [loading, setLoading] = useState(() => hasSupabaseEnv());

  useEffect(() => {
    if (!hasSupabaseEnv()) {
      warnMissingSupabaseEnv("auth-provider");
      return;
    }

    const supabase = getSupabaseClient();
    let isMounted = true;

    const syncServerSession = async (nextSession: Session | null) => {
      const method = nextSession ? "POST" : "DELETE";
      const body = nextSession
        ? JSON.stringify({
            accessToken: nextSession.access_token,
            refreshToken: nextSession.refresh_token,
          })
        : undefined;

      try {
        await fetch("/api/auth/session", {
          method,
          body,
          credentials: "include",
          headers: nextSession ? { "Content-Type": "application/json" } : undefined,
        });
      } catch (syncError) {
        console.error("[auth] session sync error:", syncError);
      }
    };

    const loadRole = async (nextUser: User | null) => {
      if (!nextUser) {
        setRole(null);
        return;
      }

      const { error: ensureError } = await supabase.rpc("ensure_user_role");
      if (ensureError) {
        console.error("[auth] ensure_user_role error:", ensureError.message);
      }

      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", nextUser.id)
        .maybeSingle();

      if (error) {
        console.error("[auth] role lookup error:", error.message);
        setRole(null);
        return;
      }

      setRole((data?.role as AppRole | null) ?? null);
    };

    const hydrateAuthState = async (nextSession: Session | null) => {
      if (!isMounted) return;

      setSession(nextSession);
      await syncServerSession(nextSession);

      if (!nextSession) {
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      const { data: userData, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error("[auth] getUser error:", userError.message);
      }

      if (!isMounted) return;

      const nextUser = userData.user ?? null;
      setUser(nextUser);
      await loadRole(nextUser);
      if (!isMounted) return;
      setLoading(false);
    };

    supabase.auth.getSession().then(async ({ data, error }) => {
      if (!isMounted) return;
      if (error) {
        console.error("[auth] getSession error:", error.message);
      }
      await hydrateAuthState(data.session ?? null);
    });

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void hydrateAuthState(nextSession);
    });

    return () => {
      isMounted = false;
      authListener.subscription.unsubscribe();
    };
  }, []);

  const signInWithProvider = async (provider: "google" | "github", nextPath?: string) => {
    if (!hasSupabaseEnv()) {
      throw new Error(SUPABASE_CONFIG_ERROR);
    }

    const supabase = getSupabaseClient();
    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback${
            nextPath?.startsWith("/") ? `?next=${encodeURIComponent(nextPath)}` : ""
          }`
        : undefined;
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo,
        skipBrowserRedirect: true,
      },
    });
    if (error) {
      throw error;
    }

    if (!data?.url) {
      throw new Error(`No OAuth URL was returned for ${provider}.`);
    }

    window.location.assign(data.url);
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      session,
      role,
      loading,
      signInWithGoogle: (nextPath?: string) => signInWithProvider("google", nextPath),
      signInWithGithub: (nextPath?: string) => signInWithProvider("github", nextPath),
      signOut: async () => {
        if (!hasSupabaseEnv()) {
          return;
        }

        const supabase = getSupabaseClient();
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
      },
    }),
    [session, user, role, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
