"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";

export default function AuthCallbackPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    const finalizeSession = async () => {
      const supabase = getSupabaseClient();
      const code = searchParams.get("code");

      try {
        if (code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeError) {
            throw exchangeError;
          }
        }

        const { data, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          throw sessionError;
        }

        const session = data.session;
        if (!session) {
          throw new Error("No active session was created after authentication.");
        }

        await fetch("/api/auth/session", {
          method: "POST",
          credentials: "include",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            accessToken: session.access_token,
            refreshToken: session.refresh_token,
          }),
        });

        router.replace("/");
        router.refresh();
      } catch (callbackError) {
        if (!isMounted) return;

        setError(
          callbackError instanceof Error
            ? callbackError.message
            : "Authentication callback failed."
        );
      }
    };

    void finalizeSession();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams]);

  return (
    <main className="flex min-h-screen items-center justify-center bg-background-light px-4 text-nordic-dark dark:bg-background-dark dark:text-white">
      <div className="w-full max-w-md rounded-3xl border border-nordic-dark/10 bg-white/90 p-8 text-center shadow-soft dark:border-white/10 dark:bg-white/5">
        <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-white">
          <span className="material-icons">login</span>
        </div>
        <h1 className="text-2xl font-semibold">Completing sign in</h1>
        <p className="mt-3 text-sm text-nordic-dark/60 dark:text-gray-400">
          We are finishing your authentication and preparing your account.
        </p>
        {error ? (
          <p className="mt-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-300">
            {error}
          </p>
        ) : (
          <div className="mt-6 flex items-center justify-center gap-2 text-sm text-primary">
            <span className="material-icons animate-spin text-base">progress_activity</span>
            Redirecting...
          </div>
        )}
      </div>
    </main>
  );
}
