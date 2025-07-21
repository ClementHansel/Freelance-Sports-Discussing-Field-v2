-- Create polls table
CREATE TABLE public.polls (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  topic_id UUID NOT NULL REFERENCES public.topics(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  description TEXT,
  is_multiple_choice BOOLEAN NOT NULL DEFAULT false,
  allow_anonymous_votes BOOLEAN NOT NULL DEFAULT false,
  expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create poll_options table
CREATE TABLE public.poll_options (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_text TEXT NOT NULL,
  display_order INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create poll_votes table
CREATE TABLE public.poll_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  poll_id UUID NOT NULL REFERENCES public.polls(id) ON DELETE CASCADE,
  option_id UUID NOT NULL REFERENCES public.poll_options(id) ON DELETE CASCADE,
  voter_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  voter_ip INET,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  
  -- Ensure one vote per user per poll (for single choice)
  UNIQUE(poll_id, voter_id)
);

-- Enable RLS on all poll tables
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_votes ENABLE ROW LEVEL SECURITY;

-- RLS policies for polls
CREATE POLICY "Everyone can view polls" ON public.polls
  FOR SELECT USING (true);

CREATE POLICY "Registered users can create polls" ON public.polls
  FOR INSERT WITH CHECK (auth.uid() = created_by);

CREATE POLICY "Poll creators and admins can update polls" ON public.polls
  FOR UPDATE USING (
    auth.uid() = created_by OR 
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'moderator')
  );

CREATE POLICY "Admins can delete polls" ON public.polls
  FOR DELETE USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'moderator')
  );

-- RLS policies for poll_options
CREATE POLICY "Everyone can view poll options" ON public.poll_options
  FOR SELECT USING (true);

CREATE POLICY "Poll creators can manage options" ON public.poll_options
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.polls p 
      WHERE p.id = poll_id AND p.created_by = auth.uid()
    )
  );

CREATE POLICY "Admins can manage all poll options" ON public.poll_options
  FOR ALL USING (
    has_role(auth.uid(), 'admin') OR 
    has_role(auth.uid(), 'moderator')
  );

-- RLS policies for poll_votes
CREATE POLICY "Everyone can view poll votes" ON public.poll_votes
  FOR SELECT USING (true);

CREATE POLICY "Registered users can vote" ON public.poll_votes
  FOR INSERT WITH CHECK (auth.uid() = voter_id);

CREATE POLICY "Users can update their own votes" ON public.poll_votes
  FOR UPDATE USING (auth.uid() = voter_id);

CREATE POLICY "Users can delete their own votes" ON public.poll_votes
  FOR DELETE USING (auth.uid() = voter_id);

-- Create indexes for better performance
CREATE INDEX idx_polls_topic_id ON public.polls(topic_id);
CREATE INDEX idx_poll_options_poll_id ON public.poll_options(poll_id);
CREATE INDEX idx_poll_votes_poll_id ON public.poll_votes(poll_id);
CREATE INDEX idx_poll_votes_option_id ON public.poll_votes(option_id);
CREATE INDEX idx_poll_votes_voter_id ON public.poll_votes(voter_id);

-- Create function to get poll results
CREATE OR REPLACE FUNCTION public.get_poll_results(poll_id_param UUID)
RETURNS TABLE(
  option_id UUID,
  option_text TEXT,
  display_order INTEGER,
  vote_count BIGINT,
  percentage NUMERIC
) 
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  total_votes BIGINT;
BEGIN
  -- Get total votes for this poll
  SELECT COUNT(*) INTO total_votes
  FROM public.poll_votes pv
  WHERE pv.poll_id = poll_id_param;
  
  -- Return results with vote counts and percentages
  RETURN QUERY
  SELECT 
    po.id as option_id,
    po.option_text,
    po.display_order,
    COALESCE(COUNT(pv.id), 0) as vote_count,
    CASE 
      WHEN total_votes = 0 THEN 0
      ELSE ROUND((COALESCE(COUNT(pv.id), 0) * 100.0) / total_votes, 2)
    END as percentage
  FROM public.poll_options po
  LEFT JOIN public.poll_votes pv ON po.id = pv.option_id
  WHERE po.poll_id = poll_id_param
  GROUP BY po.id, po.option_text, po.display_order
  ORDER BY po.display_order;
END;
$$;

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_poll_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_polls_updated_at
  BEFORE UPDATE ON public.polls
  FOR EACH ROW
  EXECUTE FUNCTION public.update_poll_updated_at();