import { supabase } from './supabase';

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

function filterVisibleProperties(properties: Property[]) {
  return properties.filter(
    (property) => property.is_active !== false && property.is_draft !== true
  );
}

export async function getFeaturedProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('featured', true)
    .order('created_at', { ascending: true })
    .limit(2);

  if (error) {
    console.error('Error fetching featured properties:', error);
    return [];
  }
  return filterVisibleProperties((data as Property[]) ?? []);
}

export async function getPaginatedProperties(page: number = 1, searchQuery?: string, type?: string): Promise<PaginatedProperties> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching properties:', error);
    return { properties: [], total: 0, page, totalPages: 0 };
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
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    if (error && error.code !== 'PGRST116') {
      console.error('Error fetching property by slug:', error);
    }
    return null;
  }
  const property = data as Property;
  return filterVisibleProperties([property])[0] ?? null;
}
