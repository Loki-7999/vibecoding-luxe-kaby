"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { type ChangeEvent, type ReactNode, useEffect, useRef, useState } from "react";
import {
  PROPERTY_AMENITY_OPTIONS,
  PROPERTY_IMAGES_BUCKET,
  PROPERTY_TYPE_OPTIONS,
  type PropertyFormValues,
  type PropertyStatusValue,
  getDefaultPropertyFormValues,
  getDraftStatusBadge,
  getStoragePathFromPublicUrl,
  propertyToFormValues,
  slugifyPropertyTitle,
} from "@/lib/admin-properties";
import { getRoleLabel } from "@/lib/admin";
import type { Property } from "@/lib/queries";
import { supabase } from "@/lib/supabase";
import { useAdminIdentity } from "@/components/admin/shared";

type AdminPropertyFormScreenProps = {
  propertyId?: string;
};

type GalleryItem = {
  id: string;
  kind: "existing" | "new";
  storagePath: string | null;
  url: string;
  file?: File;
};

const MAX_IMAGE_SIZE_MB = 5;
const MAX_DESCRIPTION_LENGTH = 2000;

function createGalleryItemsFromProperty(property: Property) {
  const urls = Array.from(
    new Set([property.image_url, ...(property.gallery_urls ?? [])].filter(Boolean))
  );

  return urls.map((url) => ({
    id: crypto.randomUUID(),
    kind: "existing" as const,
    storagePath: getStoragePathFromPublicUrl(url),
    url,
  }));
}

function getStatusCopy(status: PropertyStatusValue) {
  switch (status) {
    case "rent":
      return "For Rent";
    case "pending":
      return "Pending";
    case "sold":
      return "Sold";
    case "sale":
    default:
      return "For Sale";
  }
}

function getFileExtension(file: File) {
  const extensionFromName = file.name.split(".").pop()?.toLowerCase();

  if (extensionFromName) return extensionFromName;
  if (file.type === "image/png") return "png";
  if (file.type === "image/webp") return "webp";

  return "jpg";
}

function SectionHeader({
  icon,
  title,
  rightContent,
}: {
  icon: string;
  title: string;
  rightContent?: ReactNode;
}) {
  return (
    <div className="bg-gradient-to-r from-accent/40 to-transparent px-8 py-6">
      <div className="flex items-center justify-between gap-3 border-b border-accent/40 pb-0">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-nordic-dark">
            <span className="material-icons text-lg">{icon}</span>
          </div>
          <h2 className="text-xl font-bold text-nordic-dark">{title}</h2>
        </div>
        {rightContent}
      </div>
    </div>
  );
}

function modeLabel(status: PropertyStatusValue, isDraft: boolean) {
  if (isDraft) {
    return "Draft";
  }

  return getStatusCopy(status);
}

export default function AdminPropertyFormScreen({
  propertyId,
}: AdminPropertyFormScreenProps) {
  const isEditMode = Boolean(propertyId);
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { avatarAlt, avatarUrl, displayName, role } = useAdminIdentity();

  const [formValues, setFormValues] = useState<PropertyFormValues>(getDefaultPropertyFormValues);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [removedStoragePaths, setRemovedStoragePaths] = useState<string[]>([]);
  const [loadedProperty, setLoadedProperty] = useState<Property | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(propertyId));
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!propertyId) {
      return;
    }

    let isActive = true;

    const loadProperty = async () => {
      setIsLoading(true);
      setError(null);

      const { data, error: propertyError } = await supabase
        .from("properties")
        .select("*")
        .eq("id", propertyId)
        .single();

      if (!isActive) return;

      if (propertyError) {
        setError(propertyError.message);
        setIsLoading(false);
        return;
      }

      const property = data as Property;
      setLoadedProperty(property);
      setFormValues(propertyToFormValues(property));
      setGalleryItems(createGalleryItemsFromProperty(property));
      setRemovedStoragePaths([]);
      setIsLoading(false);
    };

    void loadProperty();

    return () => {
      isActive = false;
    };
  }, [propertyId]);

  useEffect(() => {
    return () => {
      galleryItems.forEach((item) => {
        if (item.kind === "new") {
          URL.revokeObjectURL(item.url);
        }
      });
    };
  }, [galleryItems]);

  const characterCount = formValues.description.length;
  const pageTitle = isEditMode ? "Edit Property" : "Add New Property";
  const pageDescription = isEditMode
    ? "Update the listing details below and keep the property information current."
    : "Fill in the details below to create a new listing. Fields marked with * are mandatory.";

  const setFieldValue = <K extends keyof PropertyFormValues>(
    key: K,
    value: PropertyFormValues[K]
  ) => {
    setFormValues((current) => ({ ...current, [key]: value }));
  };

  const adjustCounter = (field: "bedrooms" | "bathrooms" | "parking", delta: number) => {
    setFormValues((current) => ({
      ...current,
      [field]: Math.max(0, current[field] + delta),
    }));
  };

  const toggleAmenity = (amenity: string) => {
    setFormValues((current) => ({
      ...current,
      amenities: current.amenities.includes(amenity)
        ? current.amenities.filter((item) => item !== amenity)
        : [...current.amenities, amenity],
    }));
  };

  const openFilePicker = () => {
    fileInputRef.current?.click();
  };

  const handleFilesSelected = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? []);

    if (files.length === 0) {
      return;
    }

    const nextItems: GalleryItem[] = [];
    const invalidMessages: string[] = [];

    files.forEach((file) => {
      if (!file.type.startsWith("image/")) {
        invalidMessages.push(`${file.name}: unsupported file type.`);
        return;
      }

      if (file.size > MAX_IMAGE_SIZE_MB * 1024 * 1024) {
        invalidMessages.push(`${file.name}: exceeds ${MAX_IMAGE_SIZE_MB}MB.`);
        return;
      }

      nextItems.push({
        id: crypto.randomUUID(),
        kind: "new",
        file,
        storagePath: null,
        url: URL.createObjectURL(file),
      });
    });

    if (invalidMessages.length > 0) {
      setError(invalidMessages.join(" "));
    } else {
      setError(null);
    }

    if (nextItems.length > 0) {
      setGalleryItems((current) => [...current, ...nextItems]);
    }

    event.target.value = "";
  };

  const handleRemoveImage = (itemId: string) => {
    setSuccessMessage(null);
    setGalleryItems((current) => {
      const target = current.find((item) => item.id === itemId);

      if (!target) {
        return current;
      }

      if (target.kind === "new") {
        URL.revokeObjectURL(target.url);
      } else if (target.storagePath) {
        setRemovedStoragePaths((paths) =>
          paths.includes(target.storagePath as string)
            ? paths
            : [...paths, target.storagePath as string]
        );
      }

      return current.filter((item) => item.id !== itemId);
    });
  };

  const handleSetMainImage = (itemId: string) => {
    setGalleryItems((current) => {
      const target = current.find((item) => item.id === itemId);

      if (!target) {
        return current;
      }

      return [target, ...current.filter((item) => item.id !== itemId)];
    });
  };

  const getResolvedSlug = async () => {
    const baseSlug =
      slugifyPropertyTitle(formValues.title) || `property-${Date.now().toString().slice(-6)}`;

    if (
      loadedProperty &&
      loadedProperty.title.trim() === formValues.title.trim() &&
      loadedProperty.slug
    ) {
      return loadedProperty.slug;
    }

    const query = supabase.from("properties").select("id").eq("slug", baseSlug);
    const response = propertyId
      ? await query.neq("id", propertyId).maybeSingle()
      : await query.maybeSingle();

    if (!response.data?.id) {
      return baseSlug;
    }

    return `${baseSlug}-${crypto.randomUUID().slice(0, 6)}`;
  };

  const handleSubmit = async (mode: "draft" | "publish") => {
    setIsSaving(true);
    setError(null);
    setSuccessMessage(null);

    const uploadedPaths: string[] = [];

    try {
      if (!formValues.title.trim()) {
        throw new Error("Property title is required.");
      }

      if (!formValues.location.trim()) {
        throw new Error("Property address is required.");
      }

      if (!formValues.price || Number(formValues.price) <= 0) {
        throw new Error("Please enter a valid property price.");
      }

      if (!formValues.area || Number(formValues.area) <= 0) {
        throw new Error("Please enter a valid property area.");
      }

      if (galleryItems.length === 0) {
        throw new Error("Add at least one property image before saving.");
      }

      const slug = await getResolvedSlug();
      const uploadedUrlsByItemId = new Map<string, string>();

      for (const item of galleryItems) {
        if (item.kind !== "new" || !item.file) {
          continue;
        }

        const extension = getFileExtension(item.file);
        const path = `${slug}/${crypto.randomUUID()}.${extension}`;
        const { error: uploadError } = await supabase.storage
          .from(PROPERTY_IMAGES_BUCKET)
          .upload(path, item.file, {
            cacheControl: "3600",
            upsert: false,
          });

        if (uploadError) {
          if (uploadError.message.toLowerCase().includes("bucket")) {
            throw new Error(
              `Bucket "${PROPERTY_IMAGES_BUCKET}" not found. Run the migration 20260416000000_add_admin_property_management.sql in Supabase first.`
            );
          }

          throw new Error(uploadError.message);
        }

        uploadedPaths.push(path);
        const { data } = supabase.storage.from(PROPERTY_IMAGES_BUCKET).getPublicUrl(path);
        uploadedUrlsByItemId.set(item.id, data.publicUrl);
      }

      const galleryUrls = galleryItems
        .map((item) => uploadedUrlsByItemId.get(item.id) ?? item.url)
        .filter(Boolean);

      const isDraft = mode === "draft";
      const payload = {
        amenities: PROPERTY_AMENITY_OPTIONS.filter((amenity) =>
          formValues.amenities.includes(amenity)
        ),
        area: Number(formValues.area),
        bathrooms: formValues.bathrooms,
        badge: getDraftStatusBadge(formValues.status, isDraft),
        bedrooms: formValues.bedrooms,
        description: formValues.description.trim() || null,
        featured: formValues.featured,
        gallery_urls: galleryUrls,
        image_alt: formValues.title.trim(),
        image_url: galleryUrls[0],
        is_draft: isDraft,
        latitude: formValues.latitude ? Number(formValues.latitude) : null,
        location: formValues.location.trim(),
        longitude: formValues.longitude ? Number(formValues.longitude) : null,
        parking: formValues.parking,
        price: Number(formValues.price),
        price_type: formValues.status === "rent" ? "rent" : "sale",
        property_type: formValues.propertyType,
        slug,
        title: formValues.title.trim(),
        year_built: formValues.yearBuilt ? Number(formValues.yearBuilt) : null,
      };

      const query = propertyId
        ? supabase
            .from("properties")
            .update(payload)
            .eq("id", propertyId)
            .select("*")
            .single()
        : supabase.from("properties").insert(payload).select("*").single();

      const { data, error: saveError } = await query;

      if (saveError) {
        throw new Error(saveError.message);
      }

      const savedProperty = data as Property;
      setLoadedProperty(savedProperty);
      setFormValues(propertyToFormValues(savedProperty));
      setGalleryItems(createGalleryItemsFromProperty(savedProperty));
      setRemovedStoragePaths([]);
      setSuccessMessage(
        isDraft
          ? "Draft saved successfully."
          : isEditMode
            ? "Property updated successfully."
            : "Property created successfully."
      );

      if (removedStoragePaths.length > 0) {
        const { error: removeError } = await supabase.storage
          .from(PROPERTY_IMAGES_BUCKET)
          .remove(removedStoragePaths);

        if (removeError) {
          console.error("[admin-property-form] remove old images error:", removeError.message);
        }
      }

      if (!isEditMode && savedProperty.id) {
        router.replace(`/admin/properties/${savedProperty.id}/edit`);
      } else {
        router.refresh();
      }
    } catch (submitError) {
      if (uploadedPaths.length > 0) {
        const { error: cleanupError } = await supabase.storage
          .from(PROPERTY_IMAGES_BUCKET)
          .remove(uploadedPaths);

        if (cleanupError) {
          console.error("[admin-property-form] cleanup upload error:", cleanupError.message);
        }
      }

      setError(submitError instanceof Error ? submitError.message : "Unable to save the property.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-background-light text-nordic-dark selection:bg-accent selection:text-nordic-dark"
      style={{ fontFamily: '"Newsreader", serif' }}
    >
      <nav className="sticky top-0 z-50 border-b border-gray-100 bg-white/90 backdrop-blur-md">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <div className="flex items-center gap-12">
              <Link className="group flex items-center gap-2" href="/admin/properties">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-nordic-dark text-white shadow-sm transition-colors group-hover:bg-mosque">
                  <span className="material-icons text-xl">villa</span>
                </div>
                <span className="font-sf-pro text-2xl font-bold tracking-tight text-nordic-dark">
                  Estates.
                </span>
              </Link>
              <div className="font-sf-pro hidden items-center gap-8 text-[15px] font-medium text-gray-500 md:flex">
                <Link className="transition-colors hover:text-mosque" href="/admin/properties">
                  Dashboard
                </Link>
                <Link
                  className="border-b-2 border-mosque pb-1 text-nordic-dark"
                  href="/admin/properties"
                >
                  Listings
                </Link>
                <Link className="transition-colors hover:text-mosque" href="/admin/users">
                  Users
                </Link>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                className="relative p-2 text-gray-400 transition-colors hover:text-nordic-dark"
                type="button"
              >
                <span className="material-icons">notifications_none</span>
                <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-mosque" />
              </button>
              <div className="flex items-center gap-3 border-l border-gray-200 pl-4">
                <div className="hidden text-right sm:block">
                  <p className="font-sf-pro text-sm font-bold leading-tight text-nordic-dark">
                    {displayName}
                  </p>
                  <p className="font-sf-pro text-xs text-gray-500">
                    {getRoleLabel(role ?? "viewer")}
                  </p>
                </div>
                <div className="h-10 w-10 overflow-hidden rounded-full border-2 border-white bg-gray-200 shadow-sm">
                  {avatarUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img alt={avatarAlt} className="h-full w-full object-cover" src={avatarUrl} />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center text-nordic-dark/60">
                      <span className="material-icons">person</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <header className="mb-10 flex flex-col justify-between gap-6 border-b border-gray-200 pb-8 md:flex-row md:items-end">
          <div className="space-y-4">
            <nav aria-label="Breadcrumb" className="flex">
              <ol className="font-sf-pro flex items-center space-x-2 text-sm font-medium text-gray-500">
                <li>
                  <Link className="transition-colors hover:text-mosque" href="/admin/properties">
                    Properties
                  </Link>
                </li>
                <li>
                  <span className="material-icons text-xs text-gray-400">chevron_right</span>
                </li>
                <li aria-current="page" className="text-nordic-dark">
                  {isEditMode ? "Edit" : "Add New"}
                </li>
              </ol>
            </nav>
            <div>
              <h1 className="mb-2 text-3xl font-bold tracking-tight text-nordic-dark md:text-4xl">
                {pageTitle}
              </h1>
              <p className="font-sf-pro max-w-2xl text-base font-normal text-gray-500">
                {pageDescription}
              </p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              className="font-sf-pro rounded-lg border border-gray-300 bg-white px-5 py-2.5 text-sm font-medium text-nordic-dark transition-colors hover:bg-gray-50"
              disabled={isLoading || isSaving}
              onClick={() => void handleSubmit("draft")}
              type="button"
            >
              Save Draft
            </button>
            <button
              className="font-sf-pro flex items-center gap-2 rounded-lg bg-mosque px-5 py-2.5 text-sm font-medium text-white shadow-md transition-all duration-200 hover:bg-nordic-dark hover:shadow-lg disabled:cursor-not-allowed disabled:opacity-60"
              disabled={isLoading || isSaving}
              onClick={() => void handleSubmit("publish")}
              type="button"
            >
              <span className="material-icons text-sm">save</span>
              {isSaving ? "Saving..." : isEditMode ? "Update Property" : "Save Property"}
            </button>
          </div>
        </header>

        {error ? (
          <div className="font-sf-pro mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div className="font-sf-pro mb-6 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </div>
        ) : null}

        {isLoading ? (
          <div className="font-sf-pro rounded-xl border border-gray-100 bg-white px-6 py-10 text-sm text-gray-500 shadow-sm">
            Loading property details...
          </div>
        ) : (
          <form
            className="grid grid-cols-1 items-start gap-8 xl:grid-cols-12"
            onSubmit={(event) => {
              event.preventDefault();
              void handleSubmit("publish");
            }}
          >
            <div className="space-y-8 xl:col-span-8">
              <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <SectionHeader icon="info" title="Basic Information" />

                <div className="space-y-6 p-8">
                  <div>
                    <label
                      className="font-sf-pro mb-1.5 block text-sm font-medium text-nordic-dark"
                      htmlFor="title"
                    >
                      Property Title <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="font-sf-pro w-full rounded-md border-gray-200 bg-white px-4 py-2.5 text-base text-nordic-dark placeholder-gray-400 transition-all focus:border-mosque focus:ring-1 focus:ring-mosque"
                      id="title"
                      onChange={(event) => setFieldValue("title", event.target.value)}
                      placeholder="e.g. Modern Penthouse with Ocean View"
                      type="text"
                      value={formValues.title}
                    />
                  </div>

                  <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <div>
                      <label
                        className="font-sf-pro mb-1.5 block text-sm font-medium text-nordic-dark"
                        htmlFor="price"
                      >
                        Price <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <span className="font-sf-pro absolute left-3 top-1/2 -translate-y-1/2 text-sm text-gray-400">
                          $
                        </span>
                        <input
                          className="font-sf-pro w-full rounded-md border-gray-200 bg-white py-2.5 pl-7 pr-4 text-base font-medium text-nordic-dark placeholder-gray-400 transition-all focus:border-mosque focus:ring-1 focus:ring-mosque"
                          id="price"
                          onChange={(event) => setFieldValue("price", event.target.value)}
                          placeholder="0.00"
                          type="number"
                          value={formValues.price}
                        />
                      </div>
                    </div>

                    <div>
                      <label
                        className="font-sf-pro mb-1.5 block text-sm font-medium text-nordic-dark"
                        htmlFor="status"
                      >
                        Status
                      </label>
                      <select
                        className="font-sf-pro w-full cursor-pointer rounded-md border-gray-200 bg-white px-4 py-2.5 text-base text-nordic-dark transition-all focus:border-mosque focus:ring-1 focus:ring-mosque"
                        id="status"
                        onChange={(event) =>
                          setFieldValue("status", event.target.value as PropertyStatusValue)
                        }
                        value={formValues.status}
                      >
                        <option value="sale">For Sale</option>
                        <option value="rent">For Rent</option>
                        <option value="pending">Pending</option>
                        <option value="sold">Sold</option>
                      </select>
                    </div>

                    <div>
                      <label
                        className="font-sf-pro mb-1.5 block text-sm font-medium text-nordic-dark"
                        htmlFor="type"
                      >
                        Property Type
                      </label>
                      <select
                        className="font-sf-pro w-full cursor-pointer rounded-md border-gray-200 bg-white px-4 py-2.5 text-base text-nordic-dark transition-all focus:border-mosque focus:ring-1 focus:ring-mosque"
                        id="type"
                        onChange={(event) => setFieldValue("propertyType", event.target.value)}
                        value={formValues.propertyType}
                      >
                        {PROPERTY_TYPE_OPTIONS.map((option) => (
                          <option key={option} value={option}>
                            {option}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <SectionHeader icon="description" title="Description" />

                <div className="p-8">
                  <div className="mb-3 flex gap-2 border-b border-gray-100 pb-2">
                    <button
                      className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-nordic-dark"
                      type="button"
                    >
                      <span className="material-icons text-lg">format_bold</span>
                    </button>
                    <button
                      className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-nordic-dark"
                      type="button"
                    >
                      <span className="material-icons text-lg">format_italic</span>
                    </button>
                    <button
                      className="rounded p-1.5 text-gray-400 transition-colors hover:bg-gray-50 hover:text-nordic-dark"
                      type="button"
                    >
                      <span className="material-icons text-lg">format_list_bulleted</span>
                    </button>
                  </div>
                  <textarea
                    className="font-sf-pro min-h-[200px] w-full resize-y rounded-md border-gray-200 bg-white px-4 py-3 text-base leading-relaxed text-nordic-dark placeholder-gray-400 transition-all focus:border-mosque focus:ring-1 focus:ring-mosque"
                    id="description"
                    maxLength={MAX_DESCRIPTION_LENGTH}
                    onChange={(event) => setFieldValue("description", event.target.value)}
                    placeholder="Describe the property features, neighborhood, and unique selling points..."
                    value={formValues.description}
                  />
                  <div className="font-sf-pro mt-2 text-right text-xs text-gray-400">
                    {characterCount} / {MAX_DESCRIPTION_LENGTH} characters
                  </div>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <SectionHeader
                  icon="image"
                  rightContent={
                    <span className="font-sf-pro rounded bg-gray-100 px-2 py-1 text-xs font-medium text-gray-500">
                      JPG, PNG, WEBP
                    </span>
                  }
                  title="Gallery"
                />

                <div className="p-8">
                  <div
                    className="group relative cursor-pointer rounded-xl border-2 border-dashed border-gray-300 bg-gray-50/50 p-10 text-center transition-colors hover:border-mosque/40 hover:bg-accent/20"
                    onClick={openFilePicker}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        openFilePicker();
                      }
                    }}
                    role="button"
                    tabIndex={0}
                  >
                    <input
                      accept="image/png,image/jpeg,image/webp"
                      className="absolute inset-0 z-10 h-full w-full cursor-pointer opacity-0"
                      multiple
                      onChange={handleFilesSelected}
                      ref={fileInputRef}
                      type="file"
                    />
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white text-mosque shadow-sm transition-transform duration-300 group-hover:scale-110">
                        <span className="material-icons text-2xl">cloud_upload</span>
                      </div>
                      <div className="space-y-1">
                        <p className="font-sf-pro text-base font-medium text-nordic-dark">
                          Click or drag images here
                        </p>
                        <p className="font-sf-pro text-xs text-gray-400">
                          Max file size {MAX_IMAGE_SIZE_MB}MB per image
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-4">
                    {galleryItems.map((item, index) => (
                      <div
                        className="group relative aspect-square overflow-hidden rounded-lg shadow-sm"
                        key={item.id}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          alt={`${formValues.title || "Property"} image ${index + 1}`}
                          className="h-full w-full object-cover"
                          src={item.url}
                        />
                        <div className="absolute inset-0 flex items-center justify-center gap-2 bg-nordic-dark/60 opacity-0 backdrop-blur-[2px] transition-opacity group-hover:opacity-100">
                          <button
                            className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-red-500 transition-colors hover:bg-red-50"
                            onClick={() => handleRemoveImage(item.id)}
                            type="button"
                          >
                            <span className="material-icons text-sm">delete</span>
                          </button>
                          {index !== 0 ? (
                            <button
                              className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-nordic-dark transition-colors hover:bg-gray-50"
                              onClick={() => handleSetMainImage(item.id)}
                              type="button"
                            >
                              <span className="material-icons text-sm">star</span>
                            </button>
                          ) : null}
                        </div>
                        {index === 0 ? (
                          <span className="font-sf-pro absolute left-2 top-2 rounded bg-mosque px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                            Main
                          </span>
                        ) : null}
                      </div>
                    ))}

                    <button
                      className="group flex aspect-square flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 text-gray-400 transition-all hover:border-mosque hover:bg-accent/20 hover:text-mosque"
                      onClick={openFilePicker}
                      type="button"
                    >
                      <span className="material-icons transition-transform group-hover:scale-110">
                        add
                      </span>
                      <span className="font-sf-pro mt-1 text-xs font-medium">Add More</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-8 xl:col-span-4">
              <div className="overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-accent/40 to-transparent px-6 py-4">
                  <div className="flex items-center gap-3 border-b border-accent/40 pb-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-nordic-dark">
                      <span className="material-icons text-lg">place</span>
                    </div>
                    <h2 className="text-lg font-bold text-nordic-dark">Location</h2>
                  </div>
                </div>

                <div className="space-y-4 p-6">
                  <div>
                    <label
                      className="font-sf-pro mb-1.5 block text-sm font-medium text-nordic-dark"
                      htmlFor="location"
                    >
                      Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      className="font-sf-pro w-full rounded-md border-gray-200 bg-white px-4 py-2.5 text-sm text-nordic-dark placeholder-gray-400 transition-all focus:border-mosque focus:ring-1 focus:ring-mosque"
                      id="location"
                      onChange={(event) => setFieldValue("location", event.target.value)}
                      placeholder="Street Address, City, Zip"
                      type="text"
                      value={formValues.location}
                    />
                  </div>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div>
                      <label
                        className="font-sf-pro mb-1.5 block text-sm font-medium text-nordic-dark"
                        htmlFor="latitude"
                      >
                        Latitude
                      </label>
                      <input
                        className="font-sf-pro w-full rounded-md border-gray-200 bg-white px-4 py-2.5 text-sm text-nordic-dark placeholder-gray-400 transition-all focus:border-mosque focus:ring-1 focus:ring-mosque"
                        id="latitude"
                        onChange={(event) => setFieldValue("latitude", event.target.value)}
                        placeholder="e.g. 19.432608"
                        step="any"
                        type="number"
                        value={formValues.latitude}
                      />
                    </div>
                    <div>
                      <label
                        className="font-sf-pro mb-1.5 block text-sm font-medium text-nordic-dark"
                        htmlFor="longitude"
                      >
                        Longitude
                      </label>
                      <input
                        className="font-sf-pro w-full rounded-md border-gray-200 bg-white px-4 py-2.5 text-sm text-nordic-dark placeholder-gray-400 transition-all focus:border-mosque focus:ring-1 focus:ring-mosque"
                        id="longitude"
                        onChange={(event) => setFieldValue("longitude", event.target.value)}
                        placeholder="e.g. -99.133209"
                        step="any"
                        type="number"
                        value={formValues.longitude}
                      />
                    </div>
                  </div>
                  <div className="group relative h-48 w-full overflow-hidden rounded-lg border border-gray-200 bg-gray-100">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      alt="Map view of city streets"
                      className="h-full w-full object-cover opacity-80 transition-all duration-500 group-hover:opacity-100"
                      src="https://lh3.googleusercontent.com/aida-public/AB6AXuAS55FY7gfArnlTpNsdabJk9nBO5uQJgOwIsl8beO34JRZ9dMmjLoIkTuTUO72Y9L5tUmQqTReQWebUWadAWwLusGmRQiIict5sqY--yRaOxuYpTzfR4vv4RKh1ex6oxY64e0kbSeMudNO6pv-gG0WzVWs-pDfvQm5IoTQ1mT-tAV49LDkXAHZl317M1-D7eZw3N8o2ExKWTgg6oMAXOFVnkApIqnb7TZHekwSw8pWQxpJV2EKI8EQKQbQXJaSbjN8gB1n8b-ueWj8"
                    />
                    <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                      <span className="font-sf-pro flex items-center gap-1 rounded bg-white/90 px-3 py-1.5 text-xs font-bold text-nordic-dark shadow-sm backdrop-blur-sm">
                        <span className="material-icons text-sm text-mosque">map</span>
                        Preview
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="sticky top-24 overflow-hidden rounded-xl border border-gray-100 bg-white shadow-sm">
                <div className="bg-gradient-to-r from-accent/40 to-transparent px-6 py-4">
                  <div className="flex items-center gap-3 border-b border-accent/40 pb-0">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-nordic-dark">
                      <span className="material-icons text-lg">straighten</span>
                    </div>
                    <h2 className="text-lg font-bold text-nordic-dark">Details</h2>
                  </div>
                </div>

                <div className="space-y-6 p-6">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label
                        className="font-sf-pro mb-1 block text-xs font-medium text-gray-500"
                        htmlFor="area"
                      >
                        Area (m²) <span className="text-red-500">*</span>
                      </label>
                      <input
                        className="font-sf-pro w-full rounded border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm text-nordic-dark transition-all focus:bg-white focus:border-mosque focus:ring-1 focus:ring-mosque"
                        id="area"
                        onChange={(event) => setFieldValue("area", event.target.value)}
                        placeholder="0"
                        type="number"
                        value={formValues.area}
                      />
                    </div>
                    <div>
                      <label
                        className="font-sf-pro mb-1 block text-xs font-medium text-gray-500"
                        htmlFor="year"
                      >
                        Year Built
                      </label>
                      <input
                        className="font-sf-pro w-full rounded border-gray-200 bg-gray-50 px-3 py-2 text-left text-sm text-nordic-dark transition-all focus:bg-white focus:border-mosque focus:ring-1 focus:ring-mosque"
                        id="year"
                        onChange={(event) => setFieldValue("yearBuilt", event.target.value)}
                        placeholder="YYYY"
                        type="number"
                        value={formValues.yearBuilt}
                      />
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  <div className="space-y-4">
                    {[
                      { field: "bedrooms" as const, icon: "bed", label: "Bedrooms" },
                      { field: "bathrooms" as const, icon: "shower", label: "Bathrooms" },
                      { field: "parking" as const, icon: "directions_car", label: "Parking" },
                    ].map((item) => (
                      <div className="flex items-center justify-between" key={item.field}>
                        <label className="font-sf-pro flex items-center gap-2 text-sm font-medium text-nordic-dark">
                          <span className="material-icons text-sm text-gray-400">{item.icon}</span>
                          {item.label}
                        </label>
                        <div className="flex items-center overflow-hidden rounded-md border border-gray-200 bg-white shadow-sm">
                          <button
                            className="flex h-8 w-8 items-center justify-center border-r border-gray-100 text-gray-600 transition-colors hover:bg-gray-50"
                            onClick={() => adjustCounter(item.field, -1)}
                            type="button"
                          >
                            -
                          </button>
                          <input
                            className="font-sf-pro w-10 border-none bg-transparent p-0 text-center text-sm font-medium text-nordic-dark focus:ring-0"
                            readOnly
                            type="text"
                            value={formValues[item.field]}
                          />
                          <button
                            className="flex h-8 w-8 items-center justify-center border-l border-gray-100 text-gray-600 transition-colors hover:bg-gray-50"
                            onClick={() => adjustCounter(item.field, 1)}
                            type="button"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <hr className="border-gray-100" />

                  <div>
                    <h3 className="font-sf-pro mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">
                      Amenities
                    </h3>
                    <div className="space-y-2">
                      {PROPERTY_AMENITY_OPTIONS.map((amenity) => (
                        <label
                          className="group flex cursor-pointer items-center gap-2.5"
                          key={amenity}
                        >
                          <input
                            checked={formValues.amenities.includes(amenity)}
                            className="h-4 w-4 rounded border-gray-300 text-mosque focus:ring-mosque"
                            onChange={() => toggleAmenity(amenity)}
                            type="checkbox"
                          />
                          <span className="font-sf-pro text-sm text-gray-700 transition-colors group-hover:text-nordic-dark">
                            {amenity}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  <hr className="border-gray-100" />

                  <label className="flex items-center justify-between gap-4 rounded-lg border border-gray-100 bg-gray-50/60 px-4 py-3">
                    <div>
                      <p className="font-sf-pro text-sm font-semibold text-nordic-dark">
                        Featured listing
                      </p>
                      <p className="font-sf-pro text-xs text-gray-500">
                        Highlight this property in the public catalog.
                      </p>
                    </div>
                    <input
                      checked={formValues.featured}
                      className="h-4 w-4 rounded border-gray-300 text-mosque focus:ring-mosque"
                      onChange={(event) => setFieldValue("featured", event.target.checked)}
                      type="checkbox"
                    />
                  </label>

                  <div className="rounded-lg border border-accent bg-accent/30 px-4 py-3">
                    <p className="font-sf-pro text-xs uppercase tracking-[0.2em] text-gray-500">
                      Listing status
                    </p>
                    <p className="font-sf-pro mt-1 text-sm font-semibold text-nordic-dark">
                      {modeLabel(formValues.status, loadedProperty?.is_draft ?? false)}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            <div className="fixed bottom-0 left-0 right-0 z-40 flex gap-3 border-t border-gray-200 bg-white p-4 shadow-xl md:hidden">
              <button
                className="font-sf-pro flex-1 rounded-lg border border-gray-300 bg-white py-3 font-medium text-nordic-dark"
                onClick={() => router.push("/admin/properties")}
                type="button"
              >
                Cancel
              </button>
              <button
                className="font-sf-pro flex flex-1 items-center justify-center gap-2 rounded-lg bg-mosque py-3 font-medium text-white"
                disabled={isSaving}
                onClick={() => void handleSubmit("publish")}
                type="button"
              >
                Save
              </button>
            </div>
          </form>
        )}
      </main>

      <footer className="mb-16 mt-12 border-t border-gray-100 bg-white py-8 md:mb-0">
        <div className="font-sf-pro mx-auto max-w-7xl px-4 text-center text-xs text-gray-400">
          © 2026 Estates Real Estate Inc. All rights reserved. <br />
          <span className="mt-2 block text-gray-300">Designed for modern agencies.</span>
        </div>
      </footer>
    </div>
  );
}
