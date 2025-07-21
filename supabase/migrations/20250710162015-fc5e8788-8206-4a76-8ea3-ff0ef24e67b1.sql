-- Approve all pending posts and topics since auto-approval is now enabled
UPDATE posts SET moderation_status = 'approved' WHERE moderation_status = 'pending';
UPDATE topics SET moderation_status = 'approved' WHERE moderation_status = 'pending';