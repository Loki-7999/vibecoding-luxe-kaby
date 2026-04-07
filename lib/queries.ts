import { supabase } from './supabase';

export interface Property {
  id: string;
  slug: string;
  title: string;
  location: string;
  price: number;
  price_type: 'sale' | 'rent';
  bedrooms: number;
  bathrooms: number;
  area: number;
  image_url: string;
  image_alt: string;
  gallery_urls?: string[];
  badge?: string | null;
  featured: boolean;
  created_at: string;
}

export interface PaginatedProperties {
  properties: Property[];
  total: number;
  page: number;
  totalPages: number;
}

const ITEMS_PER_PAGE = 8;

export async function getFeaturedProperties(): Promise<Property[]> {
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .eq('featured', true)
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Error fetching featured properties:', error);
    return [];
  }
  return data as Property[];
}

export async function getPaginatedProperties(page: number = 1, searchQuery?: string): Promise<PaginatedProperties> {
  const from = (page - 1) * ITEMS_PER_PAGE;
  const to = from + ITEMS_PER_PAGE - 1;

  let query = supabase
    .from('properties')
    .select('*', { count: 'exact' })
    .eq('featured', false)
    .order('created_at', { ascending: true })
    .range(from, to);

  if (searchQuery) {
    const safeQuery = searchQuery.replace(/"/g, ''); // Escaping double quotes
    query = query.or(`title.ilike."%${safeQuery}%",location.ilike."%${safeQuery}%"`);
  }

  const { data, error, count } = await query;

  if (error) {
    console.error('Error fetching properties:', error);
    return { properties: [], total: 0, page, totalPages: 0 };
  }

  const total = count ?? 0;
  const totalPages = Math.ceil(total / ITEMS_PER_PAGE);

  return {
    properties: data as Property[],
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
  return data as Property;
}
