-- Fix VPN detection false negatives in geolocation cache
-- Update known VPN IPs that were incorrectly marked as non-VPN

UPDATE ip_geolocation_cache 
SET 
  is_vpn = true,
  updated_at = now()
WHERE ip_address::text IN ('66.56.80.182', '66.56.80.183', '66.56.80.184')
  AND is_vpn = false;

-- Also check for other potential VPN IPs based on ISP patterns
UPDATE ip_geolocation_cache 
SET 
  is_vpn = true,
  updated_at = now()
WHERE is_vpn = false 
  AND (
    isp ILIKE '%VPN%' OR 
    isp ILIKE '%Consumer%' OR 
    isp ILIKE '%Hosting%' OR 
    isp ILIKE '%Datacenter%' OR
    isp ILIKE '%Proxy%' OR
    isp ILIKE '%Cloud%'
  );

-- Log what we updated
SELECT 
  ip_address,
  isp,
  country_name,
  is_vpn,
  updated_at
FROM ip_geolocation_cache 
WHERE updated_at > now() - interval '1 minute'
ORDER BY updated_at DESC;