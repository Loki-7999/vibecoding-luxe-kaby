"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { APP_ROLES, getRoleLabel, type AdminUserRecord, type AppRole } from "@/lib/admin";
import { SUPABASE_CONFIG_ERROR, hasSupabaseEnv } from "@/lib/supabase-config";
import { getSupabaseClient } from "@/lib/supabase";
import AdminProfileMenu from "@/components/admin/AdminProfileMenu";
import {
  ADMIN_PRIMARY_ACTION_BUTTON_CLASSNAME,
  formatAdminDate,
  getPaginationItems,
  getRoleChipClass,
  getShortUserCode,
  getUserPresence,
  paginateItems,
  useAdminIdentity,
} from "@/components/admin/shared";

type UserFilter = "all" | "agent" | "broker" | "admin";

const FILTER_TABS: Array<{ label: string; value: UserFilter }> = [
  { label: "All Users", value: "all" },
  { label: "Agents", value: "agent" },
  { label: "Brokers", value: "broker" },
  { label: "Admins", value: "admin" },
];

const ROLE_ICONS: Record<AppRole, string> = {
  admin: "shield",
  agent: "support_agent",
  broker: "business_center",
  viewer: "visibility",
};

export default function AdminUsersScreen() {
  const { displayName, email, user } = useAdminIdentity();
  const [users, setUsers] = useState<AdminUserRecord[]>([]);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<UserFilter>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [savingUserId, setSavingUserId] = useState<string | null>(null);
  const [openMenuUserId, setOpenMenuUserId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadUsers = async () => {
      setLoading(true);
      setError(null);

      if (!hasSupabaseEnv()) {
        setError(SUPABASE_CONFIG_ERROR);
        setLoading(false);
        return;
      }

      const supabase = getSupabaseClient();
      const { data, error: usersError } = await supabase.rpc("get_admin_users");

      if (!isActive) return;

      if (usersError) {
        setError(usersError.message);
        setLoading(false);
        return;
      }

      setUsers((data as AdminUserRecord[]) ?? []);
      setLoading(false);
    };

    void loadUsers();

    return () => {
      isActive = false;
    };
  }, []);

  useEffect(() => {
    if (!openMenuUserId) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpenMenuUserId(null);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpenMenuUserId(null);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [openMenuUserId]);

  const filteredUsers = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return users.filter((entry) => {
      const matchesFilter = filter === "all" ? true : entry.role === filter;
      if (!matchesFilter) return false;
      if (!normalizedSearch) return true;

      return [entry.full_name, entry.email, getRoleLabel(entry.role)]
        .filter(Boolean)
        .some((value) => value!.toLowerCase().includes(normalizedSearch));
    });
  }, [filter, search, users]);
  const paginatedUsers = useMemo(
    () => paginateItems(filteredUsers, currentPage),
    [currentPage, filteredUsers]
  );
  const paginationItems = useMemo(
    () => getPaginationItems(paginatedUsers.currentPage, paginatedUsers.totalPages),
    [paginatedUsers.currentPage, paginatedUsers.totalPages]
  );

  const handleRoleChange = async (targetUserId: string, nextRole: AppRole) => {
    if (!hasSupabaseEnv()) {
      setError(SUPABASE_CONFIG_ERROR);
      return;
    }

    const supabase = getSupabaseClient();
    setSavingUserId(targetUserId);
    setError(null);

    const { error: updateError } = await supabase.rpc("set_user_role", {
      new_role: nextRole,
      target_user_id: targetUserId,
    });

    if (updateError) {
      setError(updateError.message);
      setSavingUserId(null);
      return;
    }

    setUsers((current) =>
      current.map((entry) =>
        entry.user_id === targetUserId ? { ...entry, role: nextRole } : entry
      )
    );
    setOpenMenuUserId(null);
    setSavingUserId(null);
  };

  const featuredUserId = paginatedUsers.pageItems[0]?.user_id ?? null;

  return (
    <div className="flex min-h-screen flex-col bg-background-light font-display text-nordic dark:bg-background-dark dark:text-gray-100 antialiased">
      <nav className="border-b border-nordic/5 bg-white px-4 sm:px-6 lg:px-8">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between">
          <div className="flex items-center gap-12">
            <div className="flex flex-shrink-0 items-center gap-2">
              <span className="material-symbols-outlined text-2xl text-primary">apartment</span>
              <span className="text-lg font-bold tracking-tight text-nordic-dark">LuxeEstate</span>
            </div>
            <div className="hidden space-x-8 md:flex">
              <Link
                className="px-1 py-2 text-sm font-medium text-nordic/60 transition-colors hover:text-primary"
                href="/admin/properties"
              >
                Dashboard
              </Link>
              <Link
                className="px-1 py-2 text-sm font-medium text-nordic/60 transition-colors hover:text-primary"
                href="/admin/properties"
              >
                Listings
              </Link>
              <Link
                className="border-b-2 border-primary px-1 py-2 text-sm font-medium text-primary"
                href="/admin/users"
              >
                Users
              </Link>
              <span className="cursor-default px-1 py-2 text-sm font-medium text-nordic/60">
                Inquiries
              </span>
            </div>
          </div>

          <div className="flex items-center gap-5">
            <button
              className="text-nordic/60 transition-colors hover:text-primary"
              type="button"
            >
              <span className="material-symbols-outlined text-xl">search</span>
            </button>
            <button
              className="relative text-nordic/60 transition-colors hover:text-primary"
              type="button"
            >
              <span className="material-symbols-outlined text-xl">notifications</span>
              <span className="absolute right-0 top-0 block h-2 w-2 rounded-full bg-red-500 ring-2 ring-white" />
            </button>
            <AdminProfileMenu />
          </div>
        </div>
      </nav>

      <header className="mx-auto w-full max-w-7xl px-4 pb-6 pt-8 sm:px-6 lg:px-8">
        <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-nordic dark:text-white">
              User Directory
            </h1>
            <p className="mt-1 text-sm text-nordic/60 dark:text-gray-400">
              Manage user access and roles for your properties.
            </p>
          </div>

          <div className="flex w-full flex-col gap-3 sm:flex-row md:w-auto">
            <div className="group relative w-full md:w-80">
              <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                <span className="material-icons text-xl text-nordic/40 group-focus-within:text-primary">
                  search
                </span>
              </div>
              <input
                className="block w-full rounded-lg border-none bg-white py-2.5 pl-10 pr-3 text-sm text-nordic shadow-soft placeholder-nordic/30 transition-all focus:bg-white focus:ring-2 focus:ring-primary dark:bg-gray-800 dark:text-white"
                onChange={(event) => {
                  setSearch(event.target.value);
                  setCurrentPage(1);
                  setOpenMenuUserId(null);
                }}
                placeholder="Search by name, email..."
                type="text"
                value={search}
              />
            </div>
            <button
              className={ADMIN_PRIMARY_ACTION_BUTTON_CLASSNAME}
              type="button"
            >
              <span className="material-icons text-lg">add</span>
              Add User
            </button>
          </div>
        </div>

        <div className="mt-8 flex gap-6 overflow-x-auto border-b border-nordic/10">
          {FILTER_TABS.map((tab) => (
            <button
              className={
                filter === tab.value
                  ? "border-b-2 border-primary pb-3 text-sm font-semibold text-primary"
                  : "pb-3 text-sm font-medium text-nordic/60 transition-colors hover:text-nordic"
              }
              key={tab.value}
              onClick={() => {
                setFilter(tab.value);
                setCurrentPage(1);
                setOpenMenuUserId(null);
              }}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </div>

        {error ? (
          <div className="mt-6 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        ) : null}
      </header>

      <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col space-y-4 px-4 pb-12 sm:px-6 lg:px-8">
        <div className="mb-2 hidden grid-cols-12 gap-4 px-6 text-xs font-semibold uppercase tracking-wider text-nordic/50 md:grid">
          <div className="col-span-4">User Details</div>
          <div className="col-span-3">Role &amp; Status</div>
          <div className="col-span-3">Performance</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {loading ? (
          <div className="rounded-xl border border-gray-100 bg-white px-6 py-8 text-sm text-nordic/60 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            Loading users...
          </div>
        ) : filteredUsers.length === 0 ? (
          <div className="rounded-xl border border-gray-100 bg-white px-6 py-8 text-sm text-nordic/60 shadow-sm dark:border-gray-700 dark:bg-gray-800 dark:text-gray-300">
            No users matched this search.
          </div>
        ) : (
          paginatedUsers.pageItems.map((entry) => {
            const presence = getUserPresence(entry.last_sign_in_at);
            const isCurrentUser = entry.user_id === user?.id;
            const isOpen = openMenuUserId === entry.user_id;
            const isFeatured = entry.user_id === featuredUserId && !isOpen;

            return (
              <div
                className={`relative z-10 flex flex-col items-center gap-4 rounded-xl border p-5 shadow-sm md:grid md:grid-cols-12 ${
                  isOpen || isFeatured
                    ? "border-transparent bg-accent dark:bg-primary/20 hover:shadow-soft"
                    : "border-gray-100 bg-white hover:bg-accent dark:border-gray-700 dark:bg-gray-800 dark:hover:bg-primary/20"
                }`}
                key={entry.user_id}
              >
                <div className="col-span-12 flex w-full items-center md:col-span-4">
                  <div className="relative flex-shrink-0">
                    <div className="h-12 w-12 overflow-hidden rounded-full border-2 border-white bg-gray-200 dark:border-primary">
                      {entry.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt={entry.full_name ?? entry.email ?? "User"}
                          className="h-full w-full object-cover"
                          src={entry.avatar_url}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-nordic/50">
                          <span className="material-icons text-lg">person</span>
                        </div>
                      )}
                    </div>
                    <span
                      className={`absolute bottom-0 right-0 block h-3 w-3 rounded-full ${presence.dotClassName} ring-2 ring-white`}
                    />
                  </div>

                  <div className="ml-4 min-w-0 overflow-hidden">
                    <div className="truncate text-sm font-bold text-nordic dark:text-white">
                      {entry.full_name ?? displayName}
                    </div>
                    <div className="truncate text-xs text-nordic/60 dark:text-gray-400">
                      {entry.email ?? email}
                    </div>
                    <div className="mt-1 inline-block rounded bg-white/50 px-2 py-0.5 text-[10px] text-nordic/60 dark:bg-white/10 dark:text-gray-400">
                      ID: {getShortUserCode(entry.user_id)}
                    </div>
                  </div>
                </div>

                <div className="col-span-12 flex w-full items-center justify-between gap-4 md:col-span-3 md:justify-start">
                  <span
                    className={`inline-flex items-center rounded-md px-2.5 py-1 text-xs font-medium ${getRoleChipClass(entry.role)}`}
                  >
                    {getRoleLabel(entry.role)}
                  </span>
                  <div className={`flex items-center text-xs ${presence.textClassName}`}>
                    <span className="material-icons mr-1 text-[14px]">{presence.icon}</span>
                    {presence.label}
                  </div>
                </div>

                <div className="col-span-12 grid w-full grid-cols-2 gap-4 md:col-span-3">
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-nordic/40">Created</div>
                    <div className="text-sm font-semibold text-nordic dark:text-white">
                      {formatAdminDate(entry.created_at, "No date")}
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] uppercase tracking-wider text-nordic/40">
                      Last Login
                    </div>
                    <div className="text-sm font-semibold text-nordic dark:text-white">
                      {formatAdminDate(entry.last_sign_in_at, "Never")}
                    </div>
                  </div>
                </div>

                <div
                  className="col-span-12 relative flex w-full justify-end md:col-span-2"
                  ref={isOpen ? menuRef : null}
                >
                  <button
                    className={`inline-flex w-full items-center justify-center rounded-lg px-4 py-2 text-xs font-medium transition-colors md:w-auto ${
                      isOpen
                        ? "bg-primary text-white shadow-md hover:bg-primary-dark"
                        : "border border-gray-200 bg-transparent text-nordic/70 hover:border-nordic hover:text-nordic group-hover:bg-white group-hover:shadow-sm dark:border-gray-600 dark:text-gray-300 dark:hover:border-gray-400 dark:hover:text-white"
                    } ${isCurrentUser ? "cursor-not-allowed opacity-70" : ""}`}
                    disabled={isCurrentUser || savingUserId === entry.user_id}
                    onClick={() => setOpenMenuUserId((current) => (current === entry.user_id ? null : entry.user_id))}
                    type="button"
                  >
                    {savingUserId === entry.user_id ? "Saving..." : "Change Role"}
                    <span className="material-icons ml-2 text-[16px]">
                      {isOpen ? "expand_less" : "expand_more"}
                    </span>
                  </button>

                  {isOpen ? (
                    <div className="absolute right-0 top-full z-50 mt-2 w-48 origin-top-right overflow-hidden rounded-lg bg-primary shadow-[0_10px_25px_-5px_rgba(0,0,0,0.1),0_8px_10px_-6px_rgba(0,0,0,0.1)] ring-1 ring-black/5">
                      <div className="py-1">
                        {APP_ROLES.map((availableRole) => {
                          const isActiveRole = availableRole === entry.role;

                          return (
                            <button
                              className={`group flex w-full items-center px-4 py-3 text-left text-xs transition-colors ${
                                isActiveRole
                                  ? "bg-white/10 font-medium text-white hover:bg-white/20"
                                  : "text-white/70 hover:bg-white/10 hover:text-white"
                              }`}
                              key={availableRole}
                              onClick={() => void handleRoleChange(entry.user_id, availableRole)}
                              type="button"
                            >
                              <span
                                className={`material-icons mr-3 text-sm ${
                                  isActiveRole ? "text-white" : "text-white/50 group-hover:text-white"
                                }`}
                              >
                                {ROLE_ICONS[availableRole]}
                              </span>
                              {getRoleLabel(availableRole)}
                            </button>
                          );
                        })}
                        <div className="my-1 border-t border-white/10" />
                        <button
                          className="group flex w-full items-center px-4 py-3 text-left text-xs text-red-200 transition-colors hover:bg-red-500/20 hover:text-red-100"
                          type="button"
                        >
                          <span className="material-icons mr-3 text-sm text-red-300 group-hover:text-red-100">
                            block
                          </span>
                          Suspend User
                        </button>
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            );
          })
        )}
      </main>

      <footer className="mt-auto border-t border-nordic/5 bg-background-light px-4 py-6 dark:bg-background-dark sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="hidden items-center justify-between sm:flex">
            <div>
              <p className="text-sm text-nordic/60 dark:text-gray-400">
                Showing{" "}
                <span className="font-medium text-nordic dark:text-white">
                  {paginatedUsers.totalItems === 0 ? 0 : paginatedUsers.startIndex + 1}
                </span>{" "}
                to{" "}
                <span className="font-medium text-nordic dark:text-white">
                  {paginatedUsers.endIndex}
                </span>{" "}
                of{" "}
                <span className="font-medium text-nordic dark:text-white">{users.length}</span> users
              </p>
            </div>
            <div>
              <nav
                aria-label="Pagination"
                className="relative z-0 inline-flex -space-x-px rounded-md shadow-none"
              >
                <button
                  className="relative inline-flex items-center rounded-l-md px-2 py-2 text-sm font-medium text-nordic/50 transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={paginatedUsers.currentPage === 1}
                  onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                  type="button"
                >
                  <span className="sr-only">Previous</span>
                  <span className="material-icons text-xl">chevron_left</span>
                </button>
                {paginationItems.map((item, index) =>
                  typeof item !== "number" ? (
                    <span
                      className="relative mx-1 inline-flex items-center px-1 text-sm font-medium text-nordic/40"
                      key={`ellipsis-${index}`}
                    >
                      ...
                    </span>
                  ) : (
                    <button
                      aria-current={item === paginatedUsers.currentPage ? "page" : undefined}
                      className={`relative mx-1 inline-flex items-center rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                        item === paginatedUsers.currentPage
                          ? "z-10 bg-primary text-white shadow-sm"
                          : "text-nordic/70 hover:bg-white hover:text-primary dark:hover:bg-gray-700"
                      }`}
                      key={item}
                      onClick={() => setCurrentPage(item)}
                      type="button"
                    >
                      {item}
                    </button>
                  )
                )}
                <button
                  className="relative inline-flex items-center rounded-r-md px-2 py-2 text-sm font-medium text-nordic/50 transition-colors hover:text-primary disabled:cursor-not-allowed disabled:opacity-50"
                  disabled={paginatedUsers.currentPage === paginatedUsers.totalPages}
                  onClick={() =>
                    setCurrentPage((page) => Math.min(page + 1, paginatedUsers.totalPages))
                  }
                  type="button"
                >
                  <span className="sr-only">Next</span>
                  <span className="material-icons text-xl">chevron_right</span>
                </button>
              </nav>
            </div>
          </div>

          <div className="flex w-full items-center justify-between sm:hidden">
            <button
              className="relative inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-nordic hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={paginatedUsers.currentPage === 1}
              onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
              type="button"
            >
              Previous
            </button>
            <button
              className="relative ml-3 inline-flex items-center rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-nordic hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50"
              disabled={paginatedUsers.currentPage === paginatedUsers.totalPages}
              onClick={() =>
                setCurrentPage((page) => Math.min(page + 1, paginatedUsers.totalPages))
              }
              type="button"
            >
              Next
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
