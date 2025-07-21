
-- First, let's modify the categories table to support hierarchical structure
ALTER TABLE public.categories 
ADD COLUMN parent_category_id UUID REFERENCES public.categories(id) ON DELETE CASCADE,
ADD COLUMN level INTEGER NOT NULL DEFAULT 1,
ADD COLUMN region TEXT,
ADD COLUMN birth_year INTEGER,
ADD COLUMN play_level TEXT;

-- Add indexes for better performance with hierarchical queries
CREATE INDEX idx_categories_parent ON public.categories(parent_category_id);
CREATE INDEX idx_categories_level ON public.categories(level);
CREATE INDEX idx_categories_region ON public.categories(region);
CREATE INDEX idx_categories_birth_year_level ON public.categories(birth_year, play_level);

-- Clear existing mock categories
DELETE FROM public.categories;

-- Insert Level 1 categories (Top-level forums)
INSERT INTO public.categories (id, name, description, slug, color, sort_order, level, is_active) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Youth Hockey Canada Talk', 'Canadian youth hockey discussions and community', 'canada-talk', '#FF0000', 1, 1, true),
  ('22222222-2222-2222-2222-222222222222', 'Youth Hockey USA Talk', 'American youth hockey discussions and community', 'usa-talk', '#0000FF', 2, 1, true),
  ('33333333-3333-3333-3333-333333333333', 'General Youth Hockey Talk', 'General youth hockey discussions (not region-specific)', 'general-talk', '#00AA00', 3, 1, true),
  ('44444444-4444-4444-4444-444444444444', 'Youth Hockey Tournaments', 'Tournament information and discussions', 'tournaments', '#FF8800', 4, 1, true);

-- Insert Level 2 categories - Canadian Provinces
INSERT INTO public.categories (name, description, slug, color, sort_order, level, parent_category_id, region, is_active) VALUES
  ('Ontario Youth Hockey Forum', 'Ontario youth hockey discussions', 'ontario', '#FF0000', 1, 2, '11111111-1111-1111-1111-111111111111', 'Ontario', true),
  ('Quebec Youth Hockey Forum', 'Quebec youth hockey discussions', 'quebec', '#FF0000', 2, 2, '11111111-1111-1111-1111-111111111111', 'Quebec', true),
  ('Alberta Youth Hockey Forum', 'Alberta youth hockey discussions', 'alberta', '#FF0000', 3, 2, '11111111-1111-1111-1111-111111111111', 'Alberta', true),
  ('British Columbia Youth Hockey Forum', 'BC youth hockey discussions', 'bc', '#FF0000', 4, 2, '11111111-1111-1111-1111-111111111111', 'British Columbia', true),
  ('Manitoba Youth Hockey Forum', 'Manitoba youth hockey discussions', 'manitoba', '#FF0000', 5, 2, '11111111-1111-1111-1111-111111111111', 'Manitoba', true),
  ('Saskatchewan Youth Hockey Forum', 'Saskatchewan youth hockey discussions', 'saskatchewan', '#FF0000', 6, 2, '11111111-1111-1111-1111-111111111111', 'Saskatchewan', true);

-- Insert Level 2 categories - US States
INSERT INTO public.categories (name, description, slug, color, sort_order, level, parent_category_id, region, is_active) VALUES
  ('Minnesota Youth Hockey Forum', 'Minnesota youth hockey discussions', 'minnesota', '#0000FF', 1, 2, '22222222-2222-2222-2222-222222222222', 'Minnesota', true),
  ('Michigan Youth Hockey Forum', 'Michigan youth hockey discussions', 'michigan', '#0000FF', 2, 2, '22222222-2222-2222-2222-222222222222', 'Michigan', true),
  ('Massachusetts Youth Hockey Forum', 'Massachusetts youth hockey discussions', 'massachusetts', '#0000FF', 3, 2, '22222222-2222-2222-2222-222222222222', 'Massachusetts', true),
  ('New York Youth Hockey Forum', 'New York youth hockey discussions', 'new-york', '#0000FF', 4, 2, '22222222-2222-2222-2222-222222222222', 'New York', true),
  ('California Youth Hockey Forum', 'California youth hockey discussions', 'california', '#0000FF', 5, 2, '22222222-2222-2222-2222-222222222222', 'California', true),
  ('Illinois Youth Hockey Forum', 'Illinois youth hockey discussions', 'illinois', '#0000FF', 6, 2, '22222222-2222-2222-2222-222222222222', 'Illinois', true),
  ('Pennsylvania Youth Hockey Forum', 'Pennsylvania youth hockey discussions', 'pennsylvania', '#0000FF', 7, 2, '22222222-2222-2222-2222-222222222222', 'Pennsylvania', true),
  ('Colorado Youth Hockey Forum', 'Colorado youth hockey discussions', 'colorado', '#0000FF', 8, 2, '22222222-2222-2222-2222-222222222222', 'Colorado', true);

-- Insert Level 2 categories - Tournament Types
INSERT INTO public.categories (name, description, slug, color, sort_order, level, parent_category_id, region, is_active) VALUES
  ('Youth Hockey Tournaments Canada', 'Canadian tournament discussions', 'tournaments-canada', '#FF8800', 1, 2, '44444444-4444-4444-4444-444444444444', 'Canada', true),
  ('Youth Hockey Tournaments USA', 'American tournament discussions', 'tournaments-usa', '#FF8800', 2, 2, '44444444-4444-4444-4444-444444444444', 'USA', true),
  ('Youth Hockey Tournaments Europe', 'European tournament discussions', 'tournaments-europe', '#FF8800', 3, 2, '44444444-4444-4444-4444-444444444444', 'Europe', true),
  ('Youth Spring / Summer Hockey Tournaments Canada', 'Canadian spring/summer tournaments', 'spring-summer-canada', '#FF8800', 4, 2, '44444444-4444-4444-4444-444444444444', 'Canada-Summer', true),
  ('Youth Spring / Summer Hockey Tournaments USA', 'American spring/summer tournaments', 'spring-summer-usa', '#FF8800', 5, 2, '44444444-4444-4444-4444-444444444444', 'USA-Summer', true);

-- Now let's create a function to generate Level 3 categories (birth year + play level)
-- This will create categories for all combinations of years 2008-2018 and levels AAA, AA, A

-- For each Canadian province
DO $$
DECLARE
    province_record RECORD;
    year_val INTEGER;
    level_val TEXT;
    sort_counter INTEGER := 0;
BEGIN
    -- Loop through Canadian provinces (Level 2 categories under Canada)
    FOR province_record IN 
        SELECT id, region FROM public.categories 
        WHERE parent_category_id = '11111111-1111-1111-1111-111111111111' AND level = 2
    LOOP
        sort_counter := 0;
        -- Loop through years 2008-2018
        FOR year_val IN 2008..2018 LOOP
            -- Loop through play levels
            FOREACH level_val IN ARRAY ARRAY['AAA', 'AA', 'A'] LOOP
                sort_counter := sort_counter + 1;
                INSERT INTO public.categories (
                    name, 
                    description, 
                    slug, 
                    color, 
                    sort_order, 
                    level, 
                    parent_category_id, 
                    region, 
                    birth_year, 
                    play_level, 
                    is_active
                ) VALUES (
                    province_record.region || ' - ' || year_val || ' Born ' || level_val,
                    province_record.region || ' youth hockey for ' || year_val || ' born players at ' || level_val || ' level',
                    LOWER(REPLACE(province_record.region, ' ', '-')) || '-' || year_val || '-' || LOWER(level_val),
                    '#FF0000',
                    sort_counter,
                    3,
                    province_record.id,
                    province_record.region,
                    year_val,
                    level_val,
                    true
                );
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- For each US state
DO $$
DECLARE
    state_record RECORD;
    year_val INTEGER;
    level_val TEXT;
    sort_counter INTEGER := 0;
BEGIN
    -- Loop through US states (Level 2 categories under USA)
    FOR state_record IN 
        SELECT id, region FROM public.categories 
        WHERE parent_category_id = '22222222-2222-2222-2222-222222222222' AND level = 2
    LOOP
        sort_counter := 0;
        -- Loop through years 2008-2018
        FOR year_val IN 2008..2018 LOOP
            -- Loop through play levels
            FOREACH level_val IN ARRAY ARRAY['AAA', 'AA', 'A'] LOOP
                sort_counter := sort_counter + 1;
                INSERT INTO public.categories (
                    name, 
                    description, 
                    slug, 
                    color, 
                    sort_order, 
                    level, 
                    parent_category_id, 
                    region, 
                    birth_year, 
                    play_level, 
                    is_active
                ) VALUES (
                    state_record.region || ' - ' || year_val || ' Born ' || level_val,
                    state_record.region || ' youth hockey for ' || year_val || ' born players at ' || level_val || ' level',
                    LOWER(REPLACE(state_record.region, ' ', '-')) || '-' || year_val || '-' || LOWER(level_val),
                    '#0000FF',
                    sort_counter,
                    3,
                    state_record.id,
                    state_record.region,
                    year_val,
                    level_val,
                    true
                );
            END LOOP;
        END LOOP;
    END LOOP;
END $$;

-- For General Youth Hockey Talk (no region, just birth year + level)
DO $$
DECLARE
    year_val INTEGER;
    level_val TEXT;
    sort_counter INTEGER := 0;
BEGIN
    -- Loop through years 2008-2018
    FOR year_val IN 2008..2018 LOOP
        -- Loop through play levels
        FOREACH level_val IN ARRAY ARRAY['AAA', 'AA', 'A'] LOOP
            sort_counter := sort_counter + 1;
            INSERT INTO public.categories (
                name, 
                description, 
                slug, 
                color, 
                sort_order, 
                level, 
                parent_category_id, 
                birth_year, 
                play_level, 
                is_active
            ) VALUES (
                year_val || ' Born ' || level_val,
                'General youth hockey discussions for ' || year_val || ' born players at ' || level_val || ' level',
                'general-' || year_val || '-' || LOWER(level_val),
                '#00AA00',
                sort_counter,
                3,
                '33333333-3333-3333-3333-333333333333',
                year_val,
                level_val,
                true
            );
        END LOOP;
    END LOOP;
END $$;
