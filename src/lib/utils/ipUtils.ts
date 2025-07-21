"use client";

import { supabase } from "@/integrations/supabase/client";

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

// Enhanced IP detection with multiple fallbacks and retry logic
export const getUserIP = async (
  retryCount: number = 0
): Promise<string | null> => {
  const maxRetries = 3;

  try {
    console.log(
      `Attempting to get IP from edge function (attempt ${retryCount + 1})...`
    );

    // Try to get IP from our Supabase Edge Function first
    const { data, error } = await supabase.functions.invoke("get-client-ip");

    console.log("Edge function response:", { data, error });

    if (!error && data?.ip && data.ip !== "unknown") {
      console.log("IP address fetched from edge function:", data.ip);
      return data.ip;
    }

    throw new Error("Edge function failed or returned unknown IP");
  } catch (error) {
    console.error(
      `Failed to get IP from edge function (attempt ${retryCount + 1}):`,
      error
    );

    // Try multiple external services as fallbacks
    const fallbackServices = [
      { url: "https://api.ipify.org?format=json", key: "ip" },
      { url: "https://ipapi.co/json/", key: "ip" },
      { url: "https://httpbin.org/ip", key: "origin" },
    ];

    for (const service of fallbackServices) {
      try {
        console.log(`Trying external IP service: ${service.url}`);
        const response = await fetch(service.url, {
          method: "GET",
          headers: { Accept: "application/json" },
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const data = await response.json();
        const ip = data[service.key];

        if (ip && ip !== "unknown") {
          console.log(`IP address fetched from ${service.url}:`, ip);
          return ip;
        }
      } catch (fallbackError) {
        console.error(`Failed to get IP from ${service.url}:`, fallbackError);
        continue;
      }
    }

    // If all services failed and we haven't exceeded retry limit, try again
    if (retryCount < maxRetries) {
      console.log(
        `All services failed, retrying (${retryCount + 1}/${maxRetries})...`
      );
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * (retryCount + 1))
      ); // Exponential backoff
      return getUserIP(retryCount + 1);
    }

    console.error("All IP detection methods failed after retries");
    return null;
  }
};

// Get IP geolocation data
export const getIPGeolocation = async (
  ip: string
): Promise<GeolocationData | null> => {
  try {
    console.log(`Getting geolocation for IP: ${ip}`);
    const { data, error } = await supabase.functions.invoke(
      "get-ip-geolocation",
      {
        body: { ip },
      }
    );

    if (error) {
      console.error("Geolocation error:", error);
      return null;
    }

    console.log("Geolocation data received:", data);
    return data;
  } catch (error) {
    console.error("Failed to get geolocation:", error);
    return null;
  }
};

// Mandatory IP detection that throws error if IP cannot be obtained
export const getMandatoryUserIP = async (): Promise<string> => {
  const ip = await getUserIP();

  if (!ip || ip === "unknown") {
    throw new Error(
      "Unable to determine IP address. Please check your network connection and try again."
    );
  }

  return ip;
};

// Alternative method using multiple services as fallback (maintained for compatibility)
export const getUserIPWithFallback = async (): Promise<string | null> => {
  return getUserIP();
};
