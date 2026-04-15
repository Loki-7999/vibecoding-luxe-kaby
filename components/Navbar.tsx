"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import LanguageSwitcher from "./LanguageSwitcher";
import { useTranslation } from "@/components/providers/I18nProvider";
import { useAuth } from "@/components/providers/AuthProvider";

export default function Navbar() {
  const { t } = useTranslation();
  const router = useRouter();
  const { user, signOut } = useAuth();
  const [isSigningOut, setIsSigningOut] = useState(false);
  const [isProfileMenuOpen, setIsProfileMenuOpen] = useState(false);
  const profileMenuRef = useRef<HTMLDivElement | null>(null);
  const identityData = user?.identities?.[0]?.identity_data as
    | {
        avatar_url?: string;
        picture?: string;
        name?: string;
        full_name?: string;
        user_name?: string;
        preferred_username?: string;
        login?: string;
      }
    | undefined;
  const githubHandle =
    identityData?.user_name ||
    identityData?.preferred_username ||
    identityData?.login ||
    (user?.user_metadata?.user_name as string | undefined) ||
    (user?.user_metadata?.preferred_username as string | undefined) ||
    (user?.user_metadata?.login as string | undefined) ||
    null;
  const avatarUrl =
    user?.user_metadata?.avatar_url ||
    user?.user_metadata?.picture ||
    user?.user_metadata?.avatar ||
    identityData?.avatar_url ||
    identityData?.picture ||
    (githubHandle ? `https://avatars.githubusercontent.com/${githubHandle}` : null);
  const avatarAlt =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    identityData?.full_name ||
    identityData?.name ||
    "Profile";
  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    identityData?.full_name ||
    identityData?.name ||
    githubHandle ||
    user?.email ||
    t("nav.account");

  useEffect(() => {
    if (!isProfileMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!profileMenuRef.current?.contains(event.target as Node)) {
        setIsProfileMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsProfileMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isProfileMenuOpen]);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      setIsProfileMenuOpen(false);
      await signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("[navbar] signOut error:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-nordic-dark/10 dark:border-white/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-20">
          <Link href="/" className="flex-shrink-0 flex items-center gap-2 cursor-pointer">
            <div className="w-8 h-8 rounded-lg bg-nordic-dark flex items-center justify-center">
              <span className="material-icons text-white text-lg">apartment</span>
            </div>
            <span className="text-xl font-semibold tracking-tight text-nordic-dark dark:text-white">
              LuxeEstate
            </span>
          </Link>
          <div className="hidden md:flex items-center space-x-8">
            <Link
              href="#"
              className="text-mosque font-medium text-sm border-b-2 border-mosque px-1 py-1"
            >
              {t('nav.buy')}
            </Link>
            <Link
              href="#"
              className="text-nordic-dark/70 hover:text-nordic-dark dark:text-gray-300 dark:hover:text-white font-medium text-sm hover:border-b-2 hover:border-nordic-dark/20 px-1 py-1 transition-all"
            >
              {t('nav.rent')}
            </Link>
            <Link
              href="#"
              className="text-nordic-dark/70 hover:text-nordic-dark dark:text-gray-300 dark:hover:text-white font-medium text-sm hover:border-b-2 hover:border-nordic-dark/20 px-1 py-1 transition-all"
            >
              {t('nav.sell')}
            </Link>
            <Link
              href="#"
              className="text-nordic-dark/70 hover:text-nordic-dark dark:text-gray-300 dark:hover:text-white font-medium text-sm hover:border-b-2 hover:border-nordic-dark/20 px-1 py-1 transition-all"
            >
              {t('nav.saved')}
            </Link>
          </div>
          <div className="flex items-center space-x-6">
            <LanguageSwitcher />
            <button className="text-nordic-dark hover:text-mosque dark:text-gray-400 dark:hover:text-white transition-colors">
              <span className="material-icons">search</span>
            </button>
            <button className="text-nordic-dark hover:text-mosque dark:text-gray-400 dark:hover:text-white transition-colors relative">
              <span className="material-icons">notifications_none</span>
              <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full border-2 border-background-light dark:border-background-dark"></span>
            </button>
            <div
              className="flex items-center gap-2 pl-2 border-l border-nordic-dark/10 dark:border-white/10 ml-2 relative"
              ref={profileMenuRef}
            >
              <div className="relative">
                <button
                  aria-expanded={isProfileMenuOpen}
                  aria-haspopup="menu"
                  className="flex items-center gap-3 rounded-2xl border border-nordic-dark/10 bg-white/80 dark:bg-white/5 px-2.5 py-1.5 hover:border-mosque/40 hover:bg-white dark:hover:bg-white/10 transition-all"
                  onClick={() => setIsProfileMenuOpen((current) => !current)}
                  type="button"
                >
                  <div className="w-9 h-9 rounded-full bg-gray-200 overflow-hidden ring-2 ring-transparent hover:ring-mosque transition-all flex items-center justify-center">
                    {user && avatarUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img alt={avatarAlt} className="w-full h-full object-cover" src={avatarUrl} />
                    ) : (
                      <span className="material-icons text-nordic-dark/70">person</span>
                    )}
                  </div>
                  <div className="hidden sm:flex flex-col items-start leading-tight max-w-36">
                    <span className="text-xs text-nordic-dark/50 dark:text-gray-400">
                      {t("nav.account")}
                    </span>
                    <span className="text-sm font-semibold text-nordic-dark dark:text-white truncate w-full">
                      {user ? displayName : t("nav.login")}
                    </span>
                  </div>
                  <span
                    className={`material-icons text-nordic-dark/60 dark:text-gray-300 text-[20px] transition-transform ${
                      isProfileMenuOpen ? "rotate-180" : ""
                    }`}
                  >
                    expand_more
                  </span>
                </button>

                {isProfileMenuOpen ? (
                  <div
                    className="absolute right-0 top-[calc(100%+0.75rem)] w-72 rounded-3xl border border-nordic-dark/10 bg-white/95 dark:bg-[#102723]/95 backdrop-blur-xl shadow-[0_24px_60px_rgba(17,24,39,0.16)] p-3"
                    role="menu"
                  >
                    <div className="flex items-center gap-3 rounded-2xl bg-sand-light/50 dark:bg-white/5 px-3 py-3">
                      <div className="w-11 h-11 rounded-full bg-gray-200 overflow-hidden flex items-center justify-center shrink-0">
                        {user && avatarUrl ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img alt={avatarAlt} className="w-full h-full object-cover" src={avatarUrl} />
                        ) : (
                          <span className="material-icons text-nordic-dark/70">person</span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-nordic-dark dark:text-white truncate">
                          {user ? displayName : t("nav.account")}
                        </p>
                        <p className="text-xs text-nordic-dark/55 dark:text-gray-400 truncate">
                          {user?.email ?? t("nav.login")}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3">
                      {user ? (
                        <button
                          className="w-full flex items-center justify-between rounded-2xl px-3 py-3 text-sm font-semibold text-nordic-dark dark:text-white hover:bg-red-50 dark:hover:bg-red-500/10 hover:text-red-600 dark:hover:text-red-300 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                          disabled={isSigningOut}
                          onClick={handleSignOut}
                          role="menuitem"
                          type="button"
                        >
                          <span>{isSigningOut ? t("nav.loggingOut") : t("nav.logout")}</span>
                          <span className="material-icons text-[18px]">logout</span>
                        </button>
                      ) : (
                        <Link
                          className="w-full flex items-center justify-between rounded-2xl px-3 py-3 text-sm font-semibold text-nordic-dark dark:text-white hover:bg-mosque/10 hover:text-mosque transition-colors"
                          href="/login"
                          onClick={() => setIsProfileMenuOpen(false)}
                          role="menuitem"
                        >
                          <span>{t("nav.login")}</span>
                          <span className="material-icons text-[18px]">login</span>
                        </Link>
                      )}
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
      <div className="md:hidden border-t border-nordic-dark/5 bg-background-light dark:bg-background-dark overflow-hidden h-0 transition-all duration-300">
        <div className="px-4 py-2 space-y-1">
          <Link
            href="#"
            className="block px-3 py-2 rounded-md text-base font-medium text-mosque bg-mosque/10"
          >
            {t('nav.buy')}
          </Link>
          <Link
            href="#"
            className="block px-3 py-2 rounded-md text-base font-medium text-nordic-dark hover:bg-black/5"
          >
            {t('nav.rent')}
          </Link>
          <Link
            href="#"
            className="block px-3 py-2 rounded-md text-base font-medium text-nordic-dark hover:bg-black/5"
          >
            {t('nav.sell')}
          </Link>
          <Link
            href="#"
            className="block px-3 py-2 rounded-md text-base font-medium text-nordic-dark hover:bg-black/5"
          >
            {t('nav.saved')}
          </Link>
        </div>
      </div>
    </nav>
  );
}
