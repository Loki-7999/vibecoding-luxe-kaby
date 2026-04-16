
-- Allow anyone to read properties (public listing)
CREATE POLICY "Public can read properties"
  ON public.properties
  FOR SELECT
  TO anon, authenticated
  USING (true);
;
