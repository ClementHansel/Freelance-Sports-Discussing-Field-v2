-- Add SEO metadata columns to categories table
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS canonical_url TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS meta_keywords TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS og_title TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS og_description TEXT;
ALTER TABLE public.categories ADD COLUMN IF NOT EXISTS og_image TEXT;

-- Add SEO metadata columns to topics table  
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS meta_title TEXT;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS meta_description TEXT;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS canonical_url TEXT;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS meta_keywords TEXT;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS og_title TEXT;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS og_description TEXT;
ALTER TABLE public.topics ADD COLUMN IF NOT EXISTS og_image TEXT;