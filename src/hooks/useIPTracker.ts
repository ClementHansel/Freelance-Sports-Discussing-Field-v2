"use client"; // This hook uses client-side APIs, so it must be a Client Component

import { useEffect } from "react";
import {
  usePathname,
  useSearchParams,
  useRouter,
  useParams,
} from "next/navigation";
import { supabase } from "@/integrations/supabase/client";
import { getUserIP, getIPGeolocation } from "@/lib/utils/ipUtils";
import { sessionManager } from "@/lib/utils/sessionManager";
import { Json } from "@/integrations/supabase/types"; // Import Json type

// Define the expected structure for Geolocation data
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

export const useIPTracker = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const params = useParams();

  useEffect(() => {
    const trackPageVisit = async () => {
      // Ensure this code only runs on the client side
      if (typeof window === "undefined") {
        return;
      }

      try {
        const ip = await getUserIP();
        const sessionId = sessionManager.getSessionId();

        if (!ip || !sessionId) return;

        // Get geolocation data
        // Explicitly type geoData as GeolocationData | null
        const geoData: GeolocationData | null = await getIPGeolocation(ip);

        // BACKUP VPN PROTECTION: Block VPN users immediately at tracking level
        if (geoData?.is_vpn && pathname !== "/vpn-blocked") {
          console.log(
            "🚨 BACKUP VPN DETECTION: Blocking VPN user at IP tracking level"
          );
          router.replace("/vpn-blocked");
          return;
        }

        let categoryId: string | null = null;
        let topicId: string | null = null;

        // Type params.categorySlug and params.topicSlug as string | string[]
        // Next.js useParams can return string or string[] for dynamic routes
        const categorySlugParam = params.categorySlug;
        const topicSlugParam = params.topicSlug;

        if (categorySlugParam) {
          // Ensure it's a string before using
          const categorySlug = Array.isArray(categorySlugParam)
            ? categorySlugParam[0]
            : categorySlugParam;
          const { data: category } = await supabase
            .from("categories")
            .select("id")
            .eq("slug", categorySlug)
            .single();
          categoryId = category?.id || null;
        }
        if (topicSlugParam) {
          // Ensure it's a string before using
          const topicSlug = Array.isArray(topicSlugParam)
            ? topicSlugParam[0]
            : topicSlugParam;
          const { data: topic } = await supabase
            .from("topics")
            .select("id, category_id")
            .eq("slug", topicSlug)
            .single();
          topicId = topic?.id || null;
          categoryId = topic?.category_id || null; // Update categoryId based on topic's category
        }

        const searchQuery = searchParams.get("q") || searchParams.get("search");

        if (geoData) {
          await supabase.rpc("log_page_visit_with_geolocation", {
            p_ip_address: ip,
            p_session_id: sessionId,
            p_page_path:
              pathname +
              (searchParams.toString() ? `?${searchParams.toString()}` : ""),
            p_page_title: document.title, // Accessing document here
            p_referrer: document.referrer || undefined, // Accessing document here
            p_user_agent: navigator.userAgent, // Accessing navigator here
            p_search_query: searchQuery || undefined,
            p_category_id: categoryId || undefined,
            p_topic_id: topicId || undefined,
            p_country_code: geoData.country_code,
            p_country_name: geoData.country_name,
            p_city: geoData.city,
            p_region: geoData.region,
            p_latitude: geoData.latitude,
            p_longitude: geoData.longitude,
            p_timezone: geoData.timezone,
            p_is_vpn: geoData.is_vpn,
            p_is_proxy: geoData.is_proxy,
            p_isp: geoData.isp,
          });
        } else {
          await supabase.rpc("log_page_visit", {
            p_ip_address: ip,
            p_session_id: sessionId,
            p_page_path:
              pathname +
              (searchParams.toString() ? `?${searchParams.toString()}` : ""),
            p_page_title: document.title, // Accessing document here
            p_referrer: document.referrer || undefined, // Accessing document here
            p_user_agent: navigator.userAgent, // Accessing navigator here
            p_search_query: searchQuery || undefined,
            p_category_id: categoryId || undefined,
            p_topic_id: topicId || undefined,
          });
        }
      } catch (error) {
        console.error("Failed to track page visit:", error);
      }
    };

    trackPageVisit();
  }, [pathname, searchParams, router, params]); // Depend on pathname, searchParams, router, and params

  const logActivity = async (
    activityType: string,
    contentId?: string | null,
    contentType?: string | null,
    actionData?: Json | null, // Changed 'any' to 'Json'
    isBlocked = false,
    blockedReason?: string | null
  ) => {
    // Ensure this code only runs on the client side
    if (typeof window === "undefined") {
      return;
    }
    try {
      const ip = await getUserIP();
      const sessionId = sessionManager.getSessionId();

      if (!ip || !sessionId) return;

      await supabase.rpc("log_ip_activity", {
        p_ip_address: ip,
        p_session_id: sessionId,
        p_activity_type: activityType,
        p_content_id: contentId ?? undefined,
        p_content_type: contentType ?? undefined,
        p_action_data: actionData ?? undefined, // actionData is now Json
        p_is_blocked: isBlocked,
        p_blocked_reason: blockedReason ?? undefined,
      });
    } catch (error) {
      console.error("Failed to log activity:", error);
    }
  };

  return { logActivity };
};
