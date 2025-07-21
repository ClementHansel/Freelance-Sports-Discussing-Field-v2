-- Create function to update updated_at column
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create category_requests table to store category requests from users
CREATE TABLE public.category_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  description text NOT NULL,
  justification text NOT NULL,
  parent_category_id uuid REFERENCES categories(id),
  requested_by_user_id uuid REFERENCES profiles(id),
  requester_display_name text,
  status text NOT NULL DEFAULT 'pending', -- pending, approved, rejected
  admin_notes text,
  reviewed_by uuid REFERENCES profiles(id),
  reviewed_at timestamp with time zone,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.category_requests ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Anyone can create category requests" 
ON public.category_requests 
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view their own requests" 
ON public.category_requests 
FOR SELECT 
USING (auth.uid() = requested_by_user_id OR requested_by_user_id IS NULL);

CREATE POLICY "Admins can view all requests" 
ON public.category_requests 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::user_role));

CREATE POLICY "Admins can update requests" 
ON public.category_requests 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::user_role));

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_category_requests_updated_at
BEFORE UPDATE ON public.category_requests
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();