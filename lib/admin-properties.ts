import type { Property } from "@/lib/queries";

export const PROPERTY_IMAGES_BUCKET = "property-images";

export const PROPERTY_FORM_SELECT = [
  "id",
  "slug",
  "title",
  "location",
  "latitude",
  "longitude",
  "description",
  "price",
  "price_type",
  "bedrooms",
  "bathrooms",
  "area",
  "year_built",
  "parking",
  "image_url",
  "image_alt",
  "gallery_urls",
  "amenities",
  "badge",
  "featured",
  "is_draft",
  "created_at",
  "updated_at",
  "property_type",
].join(", ");

export const PROPERTY_TYPE_OPTIONS = [
  "Apartment",
  "House",
  "Villa",
  "Commercial",
  "Penthouse",
] as const;

export const PROPERTY_AMENITY_OPTIONS = [
  "Swimming Pool",
  "Garden",
  "Air Conditioning",
  "Smart Home",
] as const;

export type PropertyStatusValue = "sale" | "rent" | "pending" | "sold";

export type PropertyFormValues = {
  title: string;
  location: string;
  latitude: string;
  longitude: string;
  description: string;
  price: string;
  status: PropertyStatusValue;
  propertyType: string;
  area: string;
  yearBuilt: string;
  bedrooms: number;
  bathrooms: number;
  parking: number;
  featured: boolean;
  amenities: string[];
};

export function getDefaultPropertyFormValues(): PropertyFormValues {
  return {
    amenities: [],
    area: "",
    bathrooms: 2,
    bedrooms: 3,
    description: "",
    featured: false,
    latitude: "",
    location: "",
    longitude: "",
    parking: 1,
    price: "",
    propertyType: "House",
    status: "sale",
    title: "",
    yearBuilt: "",
  };
}

export function getStatusFromProperty(property: Property): PropertyStatusValue {
  const badge = (property.badge ?? "").toLowerCase();

  if (badge.includes("sold")) {
    return "sold";
  }

  if (badge.includes("pending")) {
    return "pending";
  }

  return property.price_type === "rent" ? "rent" : "sale";
}

export function getDraftStatusBadge(status: PropertyStatusValue, isDraft: boolean) {
  if (isDraft) {
    return "Draft";
  }

  if (status === "pending") {
    return "Pending";
  }

  if (status === "sold") {
    return "Sold";
  }

  return null;
}

export function propertyToFormValues(property: Property): PropertyFormValues {
  return {
    amenities: property.amenities ?? [],
    area: property.area ? String(property.area) : "",
    bathrooms: Number(property.bathrooms ?? 0),
    bedrooms: Number(property.bedrooms ?? 0),
    description: property.description ?? "",
    featured: Boolean(property.featured),
    latitude: property.latitude != null ? String(property.latitude) : "",
    location: property.location ?? "",
    longitude: property.longitude != null ? String(property.longitude) : "",
    parking: Number(property.parking ?? 0),
    price: property.price ? String(property.price) : "",
    propertyType: property.property_type ?? "House",
    status: getStatusFromProperty(property),
    title: property.title ?? "",
    yearBuilt: property.year_built ? String(property.year_built) : "",
  };
}

export function slugifyPropertyTitle(value: string) {
  return value
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/[-\s]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function isSupabasePropertyImage(url: string) {
  return url.includes(`/storage/v1/object/public/${PROPERTY_IMAGES_BUCKET}/`);
}

export function getStoragePathFromPublicUrl(url: string) {
  const marker = `/storage/v1/object/public/${PROPERTY_IMAGES_BUCKET}/`;
  const markerIndex = url.indexOf(marker);

  if (markerIndex === -1) {
    return null;
  }

  return decodeURIComponent(url.slice(markerIndex + marker.length));
}
