-- Remove ads.txt content setting from forum settings
DELETE FROM public.forum_settings 
WHERE setting_key = 'ads_txt_content';