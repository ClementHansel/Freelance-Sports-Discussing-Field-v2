-- Resolve all pending reports as they are duplicates from moderation queue
UPDATE public.reports 
SET 
  status = 'resolved',
  reviewed_at = now(),
  admin_notes = COALESCE(admin_notes || ' | ', '') || 'Auto-resolved: duplicate from moderation queue cleanup'
WHERE status = 'pending';