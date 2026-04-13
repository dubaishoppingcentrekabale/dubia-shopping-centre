
-- First delete products that belong to non-electronics categories
DELETE FROM public.products WHERE category_id IN (
  SELECT id FROM public.categories WHERE slug NOT IN ('electronics')
);

-- Now remove non-electronics categories
DELETE FROM public.categories WHERE slug NOT IN ('electronics');

-- Update the electronics category
UPDATE public.categories SET name = 'All Electronics', icon = '🔌' WHERE slug = 'electronics';

-- Add electronics subcategories
INSERT INTO public.categories (name, slug, icon) VALUES
  ('Smartphones', 'smartphones', '📱'),
  ('Laptops', 'laptops', '💻'),
  ('TVs & Displays', 'tvs', '📺'),
  ('Audio', 'audio', '🎧'),
  ('Accessories', 'accessories', '🔋'),
  ('Gaming', 'gaming', '🎮'),
  ('Cameras', 'cameras', '📷');
