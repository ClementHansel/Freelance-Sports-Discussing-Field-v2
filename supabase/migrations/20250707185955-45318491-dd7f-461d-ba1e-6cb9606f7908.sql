-- Update temporary username generator to use hockey terms
CREATE OR REPLACE FUNCTION public.generate_temp_display_name()
RETURNS TEXT
LANGUAGE plpgsql
AS $$
DECLARE
  hockey_terms TEXT[] := ARRAY['Slapper', 'Deke', 'Dangle', 'Snipe', 'Celly', 'Clapper', 'Sauce', 'BarDown', 'FiveHole', 'TopShelf'];
  equipment_teams TEXT[] := ARRAY['Sticks', 'Pads', 'Mask', 'Skates', 'Leafs', 'Habs', 'Wings', 'Kings', 'Rangers', 'Hawks'];
  hockey_term TEXT;
  equipment_team TEXT;
  jersey_number INTEGER;
BEGIN
  hockey_term := hockey_terms[1 + floor(random() * array_length(hockey_terms, 1))::int];
  equipment_team := equipment_teams[1 + floor(random() * array_length(equipment_teams, 1))::int];
  jersey_number := 1 + floor(random() * 99)::int;
  
  RETURN hockey_term || '_' || equipment_team || '_' || jersey_number;
END;
$$;