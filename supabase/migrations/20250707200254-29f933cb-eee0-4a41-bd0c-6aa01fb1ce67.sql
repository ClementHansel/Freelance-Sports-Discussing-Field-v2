-- Create a table to track peak online users
CREATE TABLE IF NOT EXISTS public.peak_users_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  peak_count INTEGER NOT NULL DEFAULT 0,
  peak_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.peak_users_tracking ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Peak users are viewable by everyone" 
ON public.peak_users_tracking 
FOR SELECT 
USING (true);

CREATE POLICY "Only system can manage peak users tracking" 
ON public.peak_users_tracking 
FOR ALL 
USING (false)
WITH CHECK (false);

-- Insert initial record if none exists
INSERT INTO public.peak_users_tracking (peak_count, peak_date)
SELECT 1, now()
WHERE NOT EXISTS (SELECT 1 FROM public.peak_users_tracking);

-- Create function to update peak users
CREATE OR REPLACE FUNCTION public.update_peak_users(current_count INTEGER)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.peak_users_tracking 
  SET 
    peak_count = current_count,
    peak_date = now(),
    updated_at = now()
  WHERE peak_count < current_count;
END;
$$;

-- Create function to get peak users
CREATE OR REPLACE FUNCTION public.get_peak_users()
RETURNS TABLE(peak_count INTEGER, peak_date TIMESTAMP WITH TIME ZONE)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT pt.peak_count, pt.peak_date
  FROM public.peak_users_tracking pt
  ORDER BY pt.created_at DESC
  LIMIT 1;
END;
$$;