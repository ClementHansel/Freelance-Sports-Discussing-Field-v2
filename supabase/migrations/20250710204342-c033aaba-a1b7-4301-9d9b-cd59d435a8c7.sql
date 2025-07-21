-- Ban IP 24.50.34.131 with shadow ban for threatening behavior and report abuse
INSERT INTO public.banned_ips (
  ip_address, 
  ban_type, 
  reason, 
  is_active, 
  expires_at,
  admin_notes
) VALUES (
  '24.50.34.131'::inet,
  'shadowban',
  'Threatening behavior, harassment, and report abuse targeting minors',
  true,
  NULL, -- Permanent ban
  'User made threatening posts and submitted 20+ false reports in one day targeting minors. Shadow banned to prevent escalation while monitoring continued activity.'
);