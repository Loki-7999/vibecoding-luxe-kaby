"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import type { Property } from "@/lib/queries";
import AdminProfileMenu from "@/components/admin/AdminProfileMenu";
import {
  ADMIN_PRIMARY_ACTION_BUTTON_CLASSNAME,
  formatPropertyPrice,
  getPaginationItems,
  getPropertySecondaryLabel,
  getPropertyStatus,
  paginateItems,
} from "@/components/admin/shared";

export default function AdminPropertiesScreen() {
  const [properties, setProperties] = useState<Property[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isActive = true;

    const loadProperties = async () => {
      setLoading(true);
      setError(null);

      const { data, error: propertiesError } = await supabase
        .from("properties")
        .select("*")
        .order("created_at", { ascending: false });

      if (!isActive) return;

      if (propertiesError) {
        setError(propertiesError.message);
        setLoading(false);
        return;
      }

      setProperties((data as Property[]) ?? []);
      setLoading(false);
    };

    void loadProperties();

    return () => {
      isActive = false;
    };
  }, []);

  const paginatedProperties = useMemo(
    () => paginateItems(properties, currentPage),
    [currentPage, properties]
  );
  const paginationItems = useMemo(
    () => getPaginationItems(paginatedProperties.currentPage, paginatedProperties.totalPages),
    [paginatedProperties.currentPage, paginatedProperties.totalPages]
  );
  const activeCount = useMemo(
    () => properties.filter((property) => getPropertyStatus(property).label === "Active").length,
    [properties]
  );
  const pendingCount = useMemo(
    () => properties.filter((property) => getPropertyStatus(property).label === "Pending").length,
    [properties]
  );

  return (
    <div className="min-h-screen bg-background-light text-nordic-dark dark:bg-background-dark dark:text-gray-100">
      <nav className="sticky top-0 z-50 border-b border-primary/10 bg-white/90 backdrop-blur-md dark:border-primary/20 dark:bg-[#152e2a]/95">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between">
            <div className="flex">
              <div className="flex flex-shrink-0 items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded bg-primary text-lg font-bold text-white">
                  L
                </div>
                <span className="text-xl font-bold tracking-tight text-nordic-dark dark:text-white">
                  LuxeEstate
                </span>
              </div>
              <div className="hidden md:ml-10 md:flex md:space-x-8">
                <Link
                  className="inline-flex items-center border-b-2 border-primary px-1 pt-1 text-sm font-medium text-nordic-dark dark:text-white"
                  href="/admin/properties"
                >
                  Dashboard
                </Link>
                <Link
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 transition-colors hover:border-primary/30 hover:text-primary dark:text-gray-400"
                  href="/admin/properties"
                >
                  Listings
                </Link>
                <Link
                  className="inline-flex items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 transition-colors hover:border-primary/30 hover:text-primary dark:text-gray-400"
                  href="/admin/users"
                >
                  Users
                </Link>
                <span className="inline-flex cursor-default items-center border-b-2 border-transparent px-1 pt-1 text-sm font-medium text-gray-500 dark:text-gray-400">
                  Finance
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                className="rounded-full p-2 text-gray-400 transition-colors hover:bg-primary/5 hover:text-primary"
                type="button"
              >
                <span className="material-icons text-xl">notifications_none</span>
              </button>
              <div className="border-l border-gray-200 pl-4 dark:border-gray-700">
                <AdminProfileMenu />
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto flex w-full max-w-7xl flex-grow flex-col px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-nordic-dark dark:text-white">
              My Properties
            </h1>
            <p className="mt-1 text-gray-500 dark:text-gray-400">
              Manage your portfolio and track performance.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              className="inline-flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-nordic-dark shadow-sm transition-colors hover:bg-gray-50 dark:border-primary/30 dark:bg-[#152e2a] dark:text-gray-300 dark:hover:bg-primary/10"
              type="button"
            >
              <span className="material-icons text-base">filter_list</span>
              Filter
            </button>
            <Link className={ADMIN_PRIMARY_ACTION_BUTTON_CLASSNAME} href="/admin/properties/new">
              <span className="material-icons text-base">add</span>
              Add New Property
            </Link>
          </div>
        </div>

        <div className="mb-8 grid grid-cols-1 gap-6 sm:grid-cols-3">
          <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-white p-5 shadow-sm dark:bg-[#152e2a]">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Listings</p>
              <p className="mt-1 text-2xl font-bold text-nordic-dark dark:text-white">
                {properties.length}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
              <span className="material-icons">apartment</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-white p-5 shadow-sm dark:bg-[#152e2a]">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                Active Properties
              </p>
              <p className="mt-1 text-2xl font-bold text-nordic-dark dark:text-white">{activeCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-primary">
              <span className="material-icons">check_circle</span>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl border border-primary/10 bg-white p-5 shadow-sm dark:bg-[#152e2a]">
            <div>
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Pending Sale</p>
              <p className="mt-1 text-2xl font-bold text-nordic-dark dark:text-white">{pendingCount}</p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
              <span className="material-icons">pending</span>
            </div>
          </div>
        </div>

        {error ? (
          <div className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700 dark:border-red-500/20 dark:bg-red-500/10 dark:text-red-200">
            {error}
          </div>
        ) : null}

        <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-primary/20 dark:bg-[#152e2a]">
          <div className="hidden grid-cols-12 gap-4 border-b border-gray-100 bg-gray-50/50 px-6 py-4 text-xs font-semibold uppercase tracking-wider text-gray-500 dark:border-primary/10 dark:bg-primary/5 dark:text-gray-400 md:grid">
            <div className="col-span-6">Property Details</div>
            <div className="col-span-2">Price</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>

          {loading ? (
            <div className="px-6 py-10 text-sm text-gray-500 dark:text-gray-400">
              Loading properties...
            </div>
          ) : paginatedProperties.pageItems.length === 0 ? (
            <div className="px-6 py-10 text-sm text-gray-500 dark:text-gray-400">
              No properties available yet.
            </div>
          ) : (
            paginatedProperties.pageItems.map((property, index) => {
              const status = getPropertyStatus(property);

              return (
                <div
                  className={`group grid grid-cols-1 items-center gap-4 px-6 py-5 transition-colors hover:bg-background-light dark:hover:bg-primary/5 md:grid-cols-12 ${
                    index < paginatedProperties.pageItems.length - 1
                      ? "border-b border-gray-100 dark:border-primary/10"
                      : ""
                  }`}
                  key={property.id}
                >
                  <div className="col-span-12 flex items-center gap-4 md:col-span-6">
                    <div className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg bg-gray-200">
                      {property.image_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          alt={property.image_alt}
                          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                          src={property.image_url}
                        />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-nordic-dark/40">
                          <span className="material-icons">apartment</span>
                        </div>
                      )}
                    </div>
                    <div>
                      <Link
                        className="cursor-pointer text-lg font-bold text-nordic-dark transition-colors group-hover:text-primary dark:text-white"
                        href={`/properties/${property.slug}`}
                      >
                        {property.title}
                      </Link>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{property.location}</p>
                      <div className="mt-1.5 flex flex-wrap items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                        <span className="flex items-center gap-1">
                          <span className="material-icons text-[14px]">bed</span>
                          {property.bedrooms} Beds
                        </span>
                        <span className="h-1 w-1 rounded-full bg-gray-300" />
                        <span className="flex items-center gap-1">
                          <span className="material-icons text-[14px]">bathtub</span>
                          {property.bathrooms} Baths
                        </span>
                        <span className="h-1 w-1 rounded-full bg-gray-300" />
                        <span>{property.area.toLocaleString("en-US")} sqft</span>
                      </div>
                    </div>
                  </div>

                  <div className="col-span-6 md:col-span-2">
                    <div className="text-base font-semibold text-nordic-dark dark:text-gray-200">
                      {formatPropertyPrice(property.price)}
                    </div>
                    <div className="text-xs text-gray-400">{getPropertySecondaryLabel(property)}</div>
                  </div>

                  <div className="col-span-6 md:col-span-2">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${status.pillClassName}`}
                    >
                      <span className={`mr-1.5 h-1.5 w-1.5 rounded-full ${status.dotClassName}`} />
                      {status.label}
                    </span>
                  </div>

                  <div className="col-span-12 flex items-center justify-end gap-2 md:col-span-2">
                    <Link
                      className="rounded-lg p-2 text-gray-400 transition-all hover:bg-accent/30 hover:text-primary"
                      href={`/admin/properties/${property.id}/edit`}
                      title="Edit Property"
                    >
                      <span className="material-icons text-xl">edit</span>
                    </Link>
                    <button
                      className="rounded-lg p-2 text-gray-400 transition-all hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                      title="Delete Property"
                      type="button"
                    >
                      <span className="material-icons text-xl">delete_outline</span>
                    </button>
                  </div>
                </div>
              );
            })
          )}

          <div className="flex items-center justify-between border-t border-gray-100 bg-gray-50/50 px-6 py-4 dark:border-primary/20 dark:bg-primary/5">
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Showing{" "}
              <span className="font-medium text-nordic-dark dark:text-white">
                {paginatedProperties.totalItems === 0 ? 0 : paginatedProperties.startIndex + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-nordic-dark dark:text-white">
                {paginatedProperties.endIndex}
              </span>{" "}
              of{" "}
              <span className="font-medium text-nordic-dark dark:text-white">{properties.length}</span>{" "}
              results
            </div>
            <div className="flex gap-2">
              <button
                className="rounded-md border border-gray-200 px-3 py-1 text-sm text-gray-600 transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-primary/30 dark:text-gray-300"
                disabled={paginatedProperties.currentPage === 1}
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                type="button"
              >
                Previous
              </button>
              {paginationItems.map((item, index) =>
                item === "..." ? (
                  <span
                    className="flex items-center px-1 text-sm text-gray-400 dark:text-gray-500"
                    key={`ellipsis-${index}`}
                  >
                    ...
                  </span>
                ) : (
                  <button
                    aria-current={item === paginatedProperties.currentPage ? "page" : undefined}
                    className={`rounded-md px-3 py-1 text-sm font-medium transition-colors ${
                      item === paginatedProperties.currentPage
                        ? "bg-primary text-white shadow-sm"
                        : "border border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary dark:border-primary/30 dark:text-gray-300"
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
                className="rounded-md border border-gray-200 px-3 py-1 text-sm text-gray-600 transition-colors hover:border-primary/40 hover:text-primary disabled:cursor-not-allowed disabled:opacity-50 dark:border-primary/30 dark:text-gray-300"
                disabled={paginatedProperties.currentPage === paginatedProperties.totalPages}
                onClick={() =>
                  setCurrentPage((page) => Math.min(page + 1, paginatedProperties.totalPages))
                }
                type="button"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </main>

      <footer className="mt-auto border-t border-gray-200 bg-white dark:border-primary/20 dark:bg-[#152e2a]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <p className="text-center text-sm text-gray-400 dark:text-gray-500">
            © 2026 LuxeEstate Property Management. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
