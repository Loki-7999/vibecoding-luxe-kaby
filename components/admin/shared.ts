"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import type { AppRole } from "@/lib/admin";
import type { Property } from "@/lib/queries";

export const ADMIN_PAGE_SIZE = 5;

export const ADMIN_PRIMARY_ACTION_BUTTON_CLASSNAME =
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-white shadow-md shadow-primary/20 transition-all hover:-translate-y-0.5 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60";

type IdentityData = {
  avatar_url?: string;
  picture?: string;
  name?: string;
  full_name?: string;
  user_name?: string;
  preferred_username?: string;
  login?: string;
};

export function useAdminIdentity() {
  const { user, role } = useAuth();
  const identityData = user?.identities?.[0]?.identity_data as IdentityData | undefined;
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

  const displayName =
    user?.user_metadata?.full_name ||
    user?.user_metadata?.name ||
    identityData?.full_name ||
    identityData?.name ||
    githubHandle ||
    user?.email ||
    "Guest";

  return {
    avatarAlt: displayName,
    avatarUrl,
    displayName,
    email: user?.email ?? "No email",
    role,
    user,
  };
}

export function formatAdminDate(
  value: string | null,
  fallback: string,
  locale = "en-US",
  options?: Intl.DateTimeFormatOptions
) {
  if (!value) return fallback;

  return new Intl.DateTimeFormat(locale, {
    day: "2-digit",
    month: "short",
    year: "numeric",
    ...options,
  }).format(new Date(value));
}

export function formatPropertyPrice(value: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function getPropertyStatus(property: Property) {
  if (property.is_draft) {
    return {
      dotClassName: "bg-slate-400",
      label: "Draft",
      pillClassName:
        "bg-slate-100 text-slate-700 border border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700",
    };
  }

  const badge = (property.badge ?? "").toLowerCase();

  if (badge.includes("sold")) {
    return {
      dotClassName: "bg-gray-500",
      label: "Sold",
      pillClassName:
        "bg-gray-100 text-gray-600 border border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700",
    };
  }

  if (badge.includes("pending")) {
    return {
      dotClassName: "bg-orange-500",
      label: "Pending",
      pillClassName:
        "bg-orange-100 text-orange-700 border border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800",
    };
  }

  return {
    dotClassName: "bg-primary",
    label: "Active",
    pillClassName: "bg-accent text-primary border border-primary/10",
  };
}

export function getPropertySecondaryLabel(property: Property) {
  if (property.price_type === "rent") {
    return `Monthly: ${formatPropertyPrice(property.price)}`;
  }

  return property.featured ? "Featured listing" : "For sale";
}

export function getRoleChipClass(role: AppRole) {
  switch (role) {
    case "admin":
      return "bg-nordic-dark text-white";
    case "broker":
      return "bg-primary/10 text-primary";
    case "agent":
      return "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300";
    case "viewer":
      return "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400";
    default:
      return "bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400";
  }
}

export function getUserPresence(lastSignInAt: string | null) {
  if (!lastSignInAt) {
    return {
      dotClassName: "bg-gray-400",
      icon: "remove_circle_outline",
      label: "Inactive",
      textClassName: "text-nordic/40 dark:text-gray-500",
    };
  }

  const diffMs = Date.now() - new Date(lastSignInAt).getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays > 14) {
    return {
      dotClassName: "bg-yellow-400",
      icon: "schedule",
      label: "Away",
      textClassName: "text-nordic/60 dark:text-gray-400",
    };
  }

  return {
    dotClassName: "bg-green-400",
    icon: "check_circle",
    label: "Active",
    textClassName: "text-nordic/60 dark:text-gray-400",
  };
}

export function getShortUserCode(userId: string) {
  return `#${userId.replace(/-/g, "").slice(0, 8).toUpperCase()}`;
}

export function clampPage(page: number, totalPages: number) {
  return Math.min(Math.max(page, 1), Math.max(totalPages, 1));
}

export function paginateItems<T>(items: T[], page: number, pageSize = ADMIN_PAGE_SIZE) {
  const totalItems = items.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const currentPage = clampPage(page, totalPages);
  const startIndex = totalItems === 0 ? 0 : (currentPage - 1) * pageSize;
  const endIndex = Math.min(startIndex + pageSize, totalItems);

  return {
    currentPage,
    endIndex,
    pageItems: items.slice(startIndex, endIndex),
    startIndex,
    totalItems,
    totalPages,
  };
}

export function getPaginationItems(currentPage: number, totalPages: number) {
  if (totalPages <= 5) {
    return Array.from({ length: totalPages }, (_, index) => index + 1);
  }

  if (currentPage <= 3) {
    return [1, 2, 3, 4, "...", totalPages];
  }

  if (currentPage >= totalPages - 2) {
    return [1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
  }

  return [1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages];
}
