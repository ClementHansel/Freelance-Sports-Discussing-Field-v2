import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get client IP from headers (in order of preference)
    // More comprehensive header checking for various proxy setups
    const clientIP = 
      req.headers.get('cf-connecting-ip') ||          // Cloudflare
      req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||  // Standard proxy header
      req.headers.get('x-real-ip') ||                 // Nginx proxy
      req.headers.get('x-client-ip') ||               // Apache proxy
      req.headers.get('x-cluster-client-ip') ||       // Cluster setups
      req.headers.get('x-forwarded') ||               // Less common
      req.headers.get('forwarded-for') ||             // Alternative
      req.headers.get('forwarded') ||                 // RFC 7239
      req.headers.get('true-client-ip') ||            // Some CDNs
      req.headers.get('x-originating-ip') ||          // Some proxies
      'unknown';

    console.log('Client IP captured:', clientIP);
    console.log('All headers:', Object.fromEntries(req.headers.entries()));

    // Validate IP format (basic validation)
    const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^(?:[0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
    
    if (clientIP !== 'unknown' && !ipRegex.test(clientIP)) {
      console.warn('Invalid IP format detected:', clientIP);
      return new Response(
        JSON.stringify({ 
          ip: 'unknown', 
          error: 'Invalid IP format detected',
          headers_checked: Object.keys(Object.fromEntries(req.headers.entries()))
        }),
        { 
          headers: { 
            ...corsHeaders, 
            'Content-Type': 'application/json' 
          } 
        }
      );
    }

    return new Response(
      JSON.stringify({ 
        ip: clientIP,
        source: clientIP !== 'unknown' ? 'header_detected' : 'unknown',
        headers_available: Object.keys(Object.fromEntries(req.headers.entries())).filter(h => 
          h.includes('ip') || h.includes('forward') || h.includes('client') || h.includes('real')
        )
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error getting client IP:', error);
    return new Response(
      JSON.stringify({ 
        ip: 'unknown',
        error: 'Failed to get IP address',
        message: error.message 
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});