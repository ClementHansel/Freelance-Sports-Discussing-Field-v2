-- Create peak daily visitors tracking table
CREATE TABLE IF NOT EXISTS public.peak_daily_visitors_tracking (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  peak_count INTEGER NOT NULL DEFAULT 0,
  peak_date DATE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.peak_daily_visitors_tracking ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Peak daily visitors are viewable by everyone" 
ON public.peak_daily_visitors_tracking 
FOR SELECT 
USING (true);

CREATE POLICY "Only system can manage peak daily visitors tracking" 
ON public.peak_daily_visitors_tracking 
FOR ALL 
USING (false)
WITH CHECK (false);

-- Create function to get peak daily visitors
CREATE OR REPLACE FUNCTION public.get_peak_daily_visitors()
RETURNS TABLE(peak_count integer, peak_date date)
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
BEGIN
  RETURN QUERY
  SELECT pv.peak_count, pv.peak_date
  FROM public.peak_daily_visitors_tracking pv
  ORDER BY pv.created_at DESC
  LIMIT 1;
END;
$function$;

-- Create function to update peak daily visitors
CREATE OR REPLACE FUNCTION public.update_peak_daily_visitors(current_count integer, current_date date)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  existing_peak INTEGER;
BEGIN
  -- Get current peak count
  SELECT peak_count INTO existing_peak
  FROM public.peak_daily_visitors_tracking
  ORDER BY created_at DESC
  LIMIT 1;
  
  -- If no record exists or current count is higher, insert/update
  IF existing_peak IS NULL OR current_count > existing_peak THEN
    INSERT INTO public.peak_daily_visitors_tracking (peak_count, peak_date)
    VALUES (current_count, current_date);
  END IF;
END;
$function$;

-- Initialize with the current highest daily count from existing data
INSERT INTO public.peak_daily_visitors_tracking (peak_count, peak_date)
SELECT 
  COUNT(DISTINCT ip_address) as daily_visitors,
  DATE(created_at) as visit_date
FROM public.ip_visit_tracking
GROUP BY DATE(created_at)
ORDER BY daily_visitors DESC
LIMIT 1;