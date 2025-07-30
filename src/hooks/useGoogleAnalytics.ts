// src/hooks/useGoogleAnalytics.ts
"use client";

import { useCallback, useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useForumSettings } from "@/hooks/useForumSettings";
import { useCookieConsent } from "@/hooks/useCookieConsent";
import { Json } from "@/integrations/supabase/types"; // Assuming Json type is available

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

export const useGoogleAnalytics = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { getSetting } = useForumSettings();
  const { hasConsent } = useCookieConsent();
  const trackingId = getSetting("google_analytics_id", "") as string;
  const canTrack = hasConsent("analytics") && !!trackingId;

  // Effect to initialize gtag and configure GA
  useEffect(() => {
    if (!canTrack) {
      console.log("GA: Not loading - missing tracking ID or consent.");
      if (window.gtag) {
        window.gtag("consent", "update", {
          analytics_storage: "denied",
          ad_storage: "denied",
        });
      }
      return;
    }

    console.log("GA: Initializing gtag and configuring GA.");

    window.dataLayer = window.dataLayer || [];
    if (typeof window.gtag !== "function") {
      window.gtag = function (...args: unknown[]) {
        window.dataLayer?.push(args);
      };
    }

    window.gtag("js", new Date());
    window.gtag("config", trackingId, {
      send_page_view: false,
      custom_map: {
        "dimension1": "user_type",
        "dimension2": "user_role",
      },
    });

    window.gtag("consent", "default", {
      analytics_storage: "granted",
      ad_storage: "denied",
    });

    const handleError = (event: ErrorEvent) => {
      if (window.gtag) {
        window.gtag("event", "exception", {
          description: event.error?.message || "Unknown error",
          fatal: false,
          error_stack: event.error?.stack,
        });
      }
    };

    const handleRejection = (event: PromiseRejectionEvent) => {
      if (window.gtag) {
        window.gtag("event", "exception", {
          description: event.reason?.message || "Unhandled promise rejection",
          fatal: false,
        });
      }
    };

    window.addEventListener("error", handleError);
    window.addEventListener("unhandledrejection", handleRejection);

    return () => {
      window.removeEventListener("error", handleError);
      window.removeEventListener("unhandledrejection", handleRejection);
    };
  }, [canTrack, trackingId]);

  const trackPageView = useCallback(
    (customTitle?: string) => {
      if (!canTrack || !window.gtag) {
        console.log(
          "GA: Page view not tracked (tracking disabled or gtag not ready).",
        );
        return;
      }

      const title = customTitle || document.title;
      const currentPath = `${pathname}${
        searchParams.toString() ? `?${searchParams.toString()}` : ""
      }`;

      console.log("GA: Tracking page view for:", currentPath, "Title:", title);

      window.gtag("event", "page_view", {
        page_title: title,
        page_location: window.location.href,
        page_path: currentPath,
        user_type: user ? "authenticated" : "anonymous",
        user_role: user?.role || "user",
      });
    },
    [canTrack, pathname, searchParams, user],
  );

  useEffect(() => {
    trackPageView();
  }, [pathname, searchParams, trackPageView]);

  const trackEvent = useCallback(
    (eventName: string, parameters: Record<string, Json> = {}) => {
      if (!canTrack || !window.gtag) {
        console.log(
          "GA: Event not tracked (tracking disabled or gtag not ready):",
          eventName,
        );
        return;
      }

      console.log("GA: Tracking event:", eventName, parameters);
      window.gtag("event", eventName, {
        ...parameters,
        user_type: user ? "authenticated" : "anonymous",
        user_role: user?.role || "user",
        timestamp: new Date().toISOString(),
      });
    },
    [canTrack, user],
  );

  const trackSearch = useCallback(
    (query: string, resultsCount: number) => {
      trackEvent("search", {
        search_term: query,
        results_count: resultsCount,
      });
    },
    [trackEvent],
  );

  const trackContentCreation = useCallback(
    (type: "topic" | "post", categoryId?: string) => {
      trackEvent("content_create", {
        content_type: type,
        // FIXED: Ensure categoryId is null if undefined
        category_id: categoryId ?? null,
      });
    },
    [trackEvent],
  );

  const trackUserAction = useCallback(
    (action: "login" | "register" | "logout") => {
      trackEvent("user_action", {
        action_type: action,
      });
    },
    [trackEvent],
  );

  const trackNavigation = useCallback(
    (fromPath: string, toPath: string, method: "click" | "direct") => {
      trackEvent("navigation", {
        from_path: fromPath,
        to_path: toPath,
        navigation_method: method,
      });
    },
    [trackEvent],
  );

  const trackError = useCallback(
    (error: string, context?: string) => {
      trackEvent("error", {
        error_message: error,
        // FIXED: Ensure context is null if undefined
        error_context: context ?? null,
      });
    },
    [trackEvent],
  );

  const trackPerformance = useCallback(
    (metric: string, value: number, unit?: string) => {
      trackEvent("performance", {
        metric_name: metric,
        metric_value: value,
        // FIXED: Ensure unit is null if undefined
        metric_unit: unit ?? null,
      });
    },
    [trackEvent],
  );

  return {
    trackPageView,
    trackEvent,
    trackSearch,
    trackContentCreation,
    trackUserAction,
    trackNavigation,
    trackError,
    trackPerformance,
    isTrackingEnabled: canTrack,
  };
};
