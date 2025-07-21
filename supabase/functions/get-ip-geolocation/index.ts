import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.50.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface GeolocationData {
  country_code: string;
  country_name: string;
  city: string;
  region: string;
  latitude: number;
  longitude: number;
  timezone: string;
  is_vpn: boolean;
  is_proxy: boolean;
  isp: string;
}

// Function to enhance VPN detection based on ISP patterns
function enhanceVPNDetection(geoData: GeolocationData): GeolocationData {
  if (!geoData.isp) return geoData;
  
  // VPN/Proxy indicators in ISP names - case insensitive patterns
  const suspiciousPatterns = [
    /vpn/i,
    /proxy/i, 
    /hosting/i,
    /datacenter/i,
    /data center/i,
    /cloud/i,
    /consumer.*toronto/i, // Specific pattern we found
    /consumer.*vpn/i,
    /virtual.*private/i,
    /dedicated.*server/i,
    /colocation/i,
    /colo/i,
    /aws/i,
    /amazon.*web/i,
    /google.*cloud/i,
    /microsoft.*azure/i,
    /digital.*ocean/i,
    /vultr/i,
    /linode/i
  ];
  
  // Check if ISP matches suspicious patterns
  const isSuspiciousISP = suspiciousPatterns.some(pattern => pattern.test(geoData.isp!));
  
  // If we detect VPN indicators and the original detection missed it
  if (isSuspiciousISP && !geoData.is_vpn) {
    console.log(`🔍 Enhanced VPN detection: ISP "${geoData.isp}" flagged as VPN`);
    return {
      ...geoData,
      is_vpn: true,
      is_proxy: true // Also mark as proxy since VPNs are proxy services
    };
  }
  
  return geoData;
}

async function getGeolocationFromAPI(ip: string): Promise<GeolocationData | null> {
  try {
    console.log(`🌍 Fetching geolocation for IP: ${ip}`);
    
    // Using ip-api.com (free tier, 1000 requests/hour)
    const response = await fetch(`http://ip-api.com/json/${ip}?fields=status,message,country,countryCode,region,regionName,city,lat,lon,timezone,isp,proxy,hosting`);
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    
    const data = await response.json();
    
    if (data.status === 'fail') {
      console.error('IP API Error:', data.message);
      return null;
    }
    
    let geoData: GeolocationData = {
      country_code: data.countryCode || 'Unknown',
      country_name: data.country || 'Unknown',
      city: data.city || 'Unknown',
      region: data.regionName || 'Unknown',
      latitude: data.lat || 0,
      longitude: data.lon || 0,
      timezone: data.timezone || 'UTC',
      is_vpn: data.proxy || data.hosting || false,
      is_proxy: data.proxy || false,
      isp: data.isp || 'Unknown'
    };
    
    // Apply enhanced VPN detection
    geoData = enhanceVPNDetection(geoData);
    
    console.log(`✅ Geolocation result for ${ip}:`, {
      country: geoData.country_name,
      isp: geoData.isp,
      is_vpn: geoData.is_vpn,
      is_proxy: geoData.is_proxy
    });
    
    return geoData;
  } catch (error) {
    console.error('Error fetching geolocation:', error);
    return null;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const { ip } = await req.json();
    
    if (!ip) {
      return new Response(
        JSON.stringify({ error: 'IP address is required' }),
        { 
          status: 400, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    console.log(`Getting geolocation for IP: ${ip}`);

    // First check cache
    const { data: cached, error: cacheError } = await supabase
      .from('ip_geolocation_cache')
      .select('*')
      .eq('ip_address', ip)
      .maybeSingle();

    if (cacheError) {
      console.error('Cache lookup error:', cacheError);
    }

    // If cached and less than 24 hours old, return cached data
    if (cached && new Date(cached.updated_at) > new Date(Date.now() - 24 * 60 * 60 * 1000)) {
      console.log(`Returning cached geolocation for ${ip}`);
      return new Response(
        JSON.stringify({
          ip,
          cached: true,
          ...cached
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Get fresh geolocation data
    const geoData = await getGeolocationFromAPI(ip);
    
    if (!geoData) {
      return new Response(
        JSON.stringify({ 
          error: 'Failed to get geolocation data',
          ip,
          country_code: 'Unknown',
          country_name: 'Unknown'
        }),
        { 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    // Update cache
    const { error: upsertError } = await supabase
      .from('ip_geolocation_cache')
      .upsert({
        ip_address: ip,
        ...geoData,
        updated_at: new Date().toISOString()
      });

    if (upsertError) {
      console.error('Cache upsert error:', upsertError);
    }

    console.log(`Successfully geocoded ${ip} as ${geoData.city}, ${geoData.country_name}`);

    return new Response(
      JSON.stringify({
        ip,
        cached: false,
        ...geoData
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );

  } catch (error) {
    console.error('Geolocation function error:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Internal server error',
        message: error.message 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    );
  }
});