-- Create trigger to automatically moderate reported content
CREATE TRIGGER auto_moderate_on_report_creation
    AFTER INSERT ON public.reports
    FOR EACH ROW
    EXECUTE FUNCTION public.auto_moderate_reported_content();

-- Update the currently reported post to pending status
UPDATE public.posts 
SET moderation_status = 'pending'
WHERE id = 'db6ec1c9-b45e-4a57-a131-820394d11d31';