import {
  featuredProperties as staticFeaturedProperties,
  newProperties as staticNewProperties,
  type Property as StaticProperty,
} from "./data";
import { hasSupabaseEnv, warnMissingSupabaseEnv } from "./supabase-config";
import { getSupabaseClient } from "./supabase";

export interface Property {
  id: string;
  slug: string;
  title: string;
  location: string;
  latitude?: number | null;
  longitude?: number | null;
  description?: string | null;
  price: number;
  price_type: 'sale' | 'rent';
  bedrooms: number;
  bathrooms: number;
  area: number;
  year_built?: number | null;
  parking?: number | null;
  image_url: string;
  image_alt: string;
  gallery_urls?: string[];
  amenities?: string[];
  badge?: string | null;
  featured: boolean;
  is_active?: boolean;
  is_draft?: boolean;
  created_at: string;
  updated_at?: string;
  property_type?: string;
}

export interface PaginatedProperties {
  properties: Property[];
  total: number;
  page: number;
  totalPages: number;
}

const ITEMS_PER_PAGE = 8;

function slugifyValue(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function inferPropertyType(property: StaticProperty) {
  const normalizedTitle = property.title.toLowerCase();

  if (normalizedTitle.includes("penthouse")) {
    return "Penthouse";
  }

  if (
    normalizedTitle.includes("apartment") ||
    normalizedTitle.includes("studio") ||
    normalizedTitle.includes("condo") ||
    normalizedTitle.includes("loft")
  ) {
    return "Apartment";
  }

  if (
    normalizedTitle.includes("villa") ||
    normalizedTitle.includes("bungalow") ||
    normalizedTitle.includes("pavilion")
  ) {
    return "Villa";
  }

  return "House";
}

function toCatalogProperty(property: StaticProperty, index: number): Property {
  const createdAt = new Date(Date.UTC(2025, 0, index + 1)).toISOString();

  return {
    id: property.id,
    slug: slugifyValue(property.title),
    title: property.title,
    location: property.location,
    description: null,
    price: property.price,
    price_type: property.priceType,
    bedrooms: property.bedrooms,
    bathrooms: property.bathrooms,
    area: property.area,
    image_url: property.imageUrl,
    image_alt: property.imageAlt,
    gallery_urls: [property.imageUrl],
    amenities: [],
    badge: property.badge ?? null,
    featured: Boolean(property.featured),
    is_active: true,
    is_draft: false,
    created_at: createdAt,
    updated_at: createdAt,
    property_type: inferPropertyType(property),
    latitude: null,
    longitude: null,
    parking: null,
    year_built: null,
  };
}

const staticCatalogProperties = [...staticFeaturedProperties, ...staticNewProperties].map(
  toCatalogProperty
);

function getFallbackFeaturedProperties() {
  return staticCatalogProperties.filter((property) => property.featured).slice(0, 2);
}

function getFallbackPaginatedProperties(
  page: number,
  searchQuery?: string,
  type?: string
): PaginatedProperties {
  const primaryTerm = searchQuery
    ? searchQuery.split(",")[0].trim().replace(/[^a-zA-Z0-9 ]/g, "").toLowerCase()
    : "";

  const filtered = staticCatalogProperties.filter((property) => {
    if (!searchQuery && property.featured) {
      return false;
    }

    if (
      primaryTerm &&
      !property.title.toLowerCase().includes(primaryTerm) &&
      !property.location.toLowerCase().includes(primaryTerm)
    ) {
      return false;
    }

    if (type && type !== "All" && property.property_type !== type) {
      return false;
    }

    return true;
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE;

  return {
    properties: filtered.slice(from, to),
    total,
    page,
    totalPages,
  };
}

function getFallbackPropertyBySlug(slug: string) {
  return staticCatalogProperties.find((property) => property.slug === slug) ?? null;
}

function getQuerySupabaseClient() {
  if (!hasSupabaseEnv()) {
    warnMissingSupabaseEnv("queries");
    return null;
  }

  return getSupabaseClient();
}

function filterVisibleProperties(properties: Property[]) {
  return properties.filter(
    (property) => property.is_active !== false && property.is_draft !== true
  );
}

export async function getFeaturedProperties(): Promise<Property[]> {
  const supabase = getQuerySupabaseClient();
  if (!supabase) {
    return getFallbackFeaturedProperties();
  }

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('featured', true)
    .order('created_at', { ascending: true })
    .limit(2);

  if (error) {
    console.error('Error fetching featured properties:', error);
    return getFallbackFeaturedProperties();
  }
  return filterVisibleProperties((data as Property[]) ?? []);
}

export async function getPaginatedProperties(page: number = 1, searchQuery?: string, type?: string): Promise<PaginatedProperties> {
  const supabase = getQuerySupabaseClient();
  if (!supabase) {
    return getFallbackPaginatedProperties(page, searchQuery, type);
  }

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching properties:', error);
    return getFallbackPaginatedProperties(page, searchQuery, type);
  }

  const primaryTerm = searchQuery
    ? searchQuery.split(',')[0].trim().replace(/[^a-zA-Z0-9 ]/g, '').toLowerCase()
    : '';

  const filtered = filterVisibleProperties((data as Property[]) ?? []).filter((property) => {
    if (!searchQuery && property.featured) {
      return false;
    }

    if (
      primaryTerm &&
      !property.title.toLowerCase().includes(primaryTerm) &&
      !property.location.toLowerCase().includes(primaryTerm)
    ) {
      return false;
    }

    if (type && type !== 'All' && property.property_type !== type) {
      return false;
    }

    return true;
  });

  const total = filtered.length;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE;

  return {
    properties: filtered.slice(from, to),
    total,
    page,
    totalPages,
  };
}

export async function getPropertyBySlug(slug: string): Promise<Property | null> {
  const supabase = getQuerySupabaseClient();
  if (!supabase) {
    return getFallbackPropertyBySlug(slug);
  }

  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching property by slug:', error);
      return getFallbackPropertyBySlug(slug);
    }
    return null;
  }
  const property = data as Property;
  return filterVisibleProperties([property])[0] ?? null;
}
