"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/providers/AuthProvider";
import { getRoleLabel } from "@/lib/admin";
import { useAdminIdentity } from "@/components/admin/shared";

const ADMIN_NAV_LINKS = [
  { href: "/admin/properties", icon: "apartment", label: "Properties" },
  { href: "/admin/users", icon: "groups", label: "Users" },
] as const;

export default function AdminProfileMenu() {
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useAuth();
  const { avatarAlt, avatarUrl, displayName, email, role } = useAdminIdentity();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSigningOut, setIsSigningOut] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isMenuOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isMenuOpen]);

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      setIsMenuOpen(false);
      await signOut();
      router.push("/login");
      router.refresh();
    } catch (error) {
      console.error("[admin-profile-menu] signOut error:", error);
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <div className="relative" ref={menuRef}>
      <button
        aria-expanded={isMenuOpen}
        aria-haspopup="menu"
        className="flex items-center gap-3 rounded-2xl border border-primary/10 bg-white/80 px-2.5 py-1.5 transition-all hover:border-primary/30 hover:bg-white dark:border-primary/20 dark:bg-white/5 dark:hover:bg-white/10"
        onClick={() => setIsMenuOpen((current) => !current)}
        type="button"
      >
        <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gray-200 ring-2 ring-transparent transition-all hover:ring-primary/30 dark:bg-primary/10">
          {avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img alt={avatarAlt} className="h-full w-full object-cover" src={avatarUrl} />
          ) : (
            <span className="material-icons text-lg text-nordic-dark/70 dark:text-gray-300">
              person
            </span>
          )}
        </div>
        <div className="hidden min-w-0 flex-col items-start text-left sm:flex">
          <span className="max-w-36 truncate text-sm font-semibold text-nordic-dark dark:text-white">
            {displayName}
          </span>
          <span className="text-xs capitalize text-gray-500 dark:text-gray-400">
            {getRoleLabel(role ?? "viewer")}
          </span>
        </div>
        <span
          className={`material-icons text-[20px] text-nordic-dark/60 transition-transform dark:text-gray-300 ${
            isMenuOpen ? "rotate-180" : ""
          }`}
        >
          expand_more
        </span>
      </button>

      {isMenuOpen ? (
        <div
          className="absolute right-0 top-[calc(100%+0.75rem)] z-50 w-72 rounded-3xl border border-primary/10 bg-white/95 p-3 shadow-[0_24px_60px_rgba(17,24,39,0.16)] backdrop-blur-xl dark:border-primary/20 dark:bg-[#102723]/95"
          role="menu"
        >
          <div className="flex items-center gap-3 rounded-2xl bg-accent/70 px-3 py-3 dark:bg-white/5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-gray-200 dark:bg-primary/10">
              {avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img alt={avatarAlt} className="h-full w-full object-cover" src={avatarUrl} />
              ) : (
                <span className="material-icons text-nordic-dark/70 dark:text-gray-300">person</span>
              )}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-nordic-dark dark:text-white">
                {displayName}
              </p>
              <p className="truncate text-xs text-nordic-dark/55 dark:text-gray-400">{email}</p>
            </div>
          </div>

          <div className="mt-3 space-y-1">
            {ADMIN_NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;

              return (
                <Link
                  className={`flex w-full items-center justify-between rounded-2xl px-3 py-3 text-sm font-semibold transition-colors ${
                    isActive
                      ? "bg-primary text-white"
                      : "text-nordic-dark hover:bg-primary/10 hover:text-primary dark:text-white dark:hover:bg-white/10"
                  }`}
                  href={link.href}
                  key={link.href}
                  onClick={() => setIsMenuOpen(false)}
                  role="menuitem"
                >
                  <span>{link.label}</span>
                  <span className="material-icons text-[18px]">{link.icon}</span>
                </Link>
              );
            })}

            <button
              className="flex w-full items-center justify-between rounded-2xl px-3 py-3 text-sm font-semibold text-nordic-dark transition-colors hover:bg-red-50 hover:text-red-600 disabled:cursor-not-allowed disabled:opacity-60 dark:text-white dark:hover:bg-red-500/10 dark:hover:text-red-300"
              disabled={isSigningOut}
              onClick={handleSignOut}
              role="menuitem"
              type="button"
            >
              <span>{isSigningOut ? "Signing out..." : "Sign out"}</span>
              <span className="material-icons text-[18px]">logout</span>
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
