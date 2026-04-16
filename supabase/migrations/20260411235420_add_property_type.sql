ALTER TABLE properties ADD COLUMN property_type text DEFAULT 'House';
UPDATE properties SET property_type = 'Villa' WHERE title ILIKE '%Villa%' OR location ILIKE '%Beverly%';
UPDATE properties SET property_type = 'Apartment' WHERE title ILIKE '%Loft%' OR title ILIKE '%Apartment%';
UPDATE properties SET property_type = 'Penthouse' WHERE title ILIKE '%Penthouse%';
;
