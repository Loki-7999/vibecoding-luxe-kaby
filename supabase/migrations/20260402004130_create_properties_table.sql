
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  slug text UNIQUE NOT NULL,
  title text NOT NULL,
  location text NOT NULL,
  price numeric NOT NULL,
  price_type text NOT NULL CHECK (price_type IN ('sale', 'rent')),
  bedrooms integer NOT NULL,
  bathrooms numeric NOT NULL,
  area numeric NOT NULL,
  image_url text NOT NULL,
  image_alt text NOT NULL,
  badge text,
  featured boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;

-- Allow public read access
CREATE POLICY "Public read access"
  ON public.properties
  FOR SELECT
  USING (true);
;
