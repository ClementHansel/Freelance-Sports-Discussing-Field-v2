-- Add guest_number column to temporary_users table for admin tracking
ALTER TABLE public.temporary_users 
ADD COLUMN guest_number INTEGER;

-- Create sequence for guest numbers
CREATE SEQUENCE IF NOT EXISTS guest_number_seq START 1;

-- Update existing temporary users with guest numbers
UPDATE public.temporary_users 
SET guest_number = nextval('guest_number_seq')
WHERE guest_number IS NULL;

-- Make guest_number not null and add default
ALTER TABLE public.temporary_users 
ALTER COLUMN guest_number SET NOT NULL,
ALTER COLUMN guest_number SET DEFAULT nextval('guest_number_seq');

-- Create unique index on guest_number
CREATE UNIQUE INDEX IF NOT EXISTS idx_temporary_users_guest_number 
ON public.temporary_users(guest_number);

-- Update the generate_temp_display_name function to always return "Guest"
CREATE OR REPLACE FUNCTION public.generate_temp_display_name()
RETURNS text
LANGUAGE plpgsql
AS $function$
BEGIN
  -- Always return "Guest" for public display
  RETURN 'Guest';
END;
$function$;

-- Create function to get admin display name with guest number
CREATE OR REPLACE FUNCTION public.get_admin_display_name(temp_user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  guest_num INTEGER;
BEGIN
  SELECT guest_number INTO guest_num
  FROM public.temporary_users
  WHERE id = temp_user_id;
  
  IF guest_num IS NOT NULL THEN
    RETURN 'Guest #' || guest_num;
  ELSE
    RETURN 'Guest';
  END IF;
END;
$function$;

-- Update the get_or_create_temp_user function to ensure guest_number is set
CREATE OR REPLACE FUNCTION public.get_or_create_temp_user(p_session_id text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $function$
DECLARE
  temp_user_id UUID;
  display_name TEXT;
BEGIN
  -- First, try to get existing non-expired temp user
  SELECT id INTO temp_user_id
  FROM temporary_users
  WHERE session_id = p_session_id 
    AND expires_at > now();
  
  -- If found and not expired, return it
  IF temp_user_id IS NOT NULL THEN
    RETURN temp_user_id;
  END IF;
  
  -- If not found or expired, create new one
  display_name := generate_temp_display_name();
  
  INSERT INTO temporary_users (session_id, display_name, guest_number)
  VALUES (p_session_id, display_name, nextval('guest_number_seq'))
  RETURNING id INTO temp_user_id;
  
  RETURN temp_user_id;
END;
$function$;