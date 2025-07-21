-- Add IP address and anonymous tracking to posts table
ALTER TABLE public.posts 
ADD COLUMN ip_address inet,
ADD COLUMN is_anonymous boolean DEFAULT false;

-- Create index for admin queries
CREATE INDEX idx_posts_ip_address ON public.posts(ip_address);
CREATE INDEX idx_posts_is_anonymous ON public.posts(is_anonymous);

-- Update RLS policy to allow admins to see IP addresses
CREATE POLICY "Admins can view post metadata" 
ON public.posts 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role));