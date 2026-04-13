
-- Add parent_id to categories for subcategory support
ALTER TABLE public.categories
ADD COLUMN parent_id uuid REFERENCES public.categories(id) ON DELETE SET NULL DEFAULT NULL;

-- Index for faster lookups
CREATE INDEX idx_categories_parent_id ON public.categories(parent_id);
