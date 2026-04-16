"use client";

import { useAuth } from "@/components/providers/AuthProvider";
import type { AppRole } from "@/lib/admin";
import type { Property } from "@/lib/queries";

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
