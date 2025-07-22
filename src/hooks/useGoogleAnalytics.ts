"use client";

import { useEffect, useCallback } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useForumSettings } from "@/hooks/useForumSettings";
import { useCookieConsent } from "@/hooks/useCookieConsent";

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    gtag?: (...args: any[]) => void;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    dataLayer?: any[];
  }
}

export const useGoogleAnalytics = () => {
  const pathname = usePathname(); // Get current pathname from Next.js
  const searchParams = useSearchParams(); // Get current search parameters from Next.js
  const { user, isAdmin, isModerator } = useAuth();
  const { getSetting } = useForumSettings();
  const { hasConsent } = useCookieConsent();
  const trackingId = getSetting("google_analytics_id", "");
  const canTrack = hasConsent("analytics") && trackingId;

  // Track page views with dynamic titles
  const trackPageView = useCallback(
    (customTitle?: string) => {
      if (!canTrack || !window.gtag) return;

      const title = customTitle || document.title;
      // Construct the full path including search parameters
      const path = `${pathname}${
        searchParams.toString() ? `?${searchParams.toString()}` : ""
      }`;

      window.gtag("config", trackingId, {
        page_title: title,
        page_location: window.location.href,
        page_path: path,
        custom_map: {
          dimension1: user ? "authenticated" : "anonymous",
          dimension2: user?.role || "user",
        },
      });

      // Track custom page view event
      window.gtag("event", "page_view", {
        page_title: title,
        page_location: window.location.href,
        page_path: path,
        user_type: user ? "authenticated" : "anonymous",
        user_role: user?.role || "user",
      });
    },
    [canTrack, trackingId, pathname, searchParams, user] // Updated dependencies
  );

  // Effect to track page views on route changes
  useEffect(() => {
    // Trigger a page view track when pathname or searchParams change
    // This mimics the behavior of useLocation in react-router-dom
    trackPageView();
  }, [pathname, searchParams, trackPageView]); // Depend on pathname, searchParams, and trackPageView

  // Track custom events
  const trackEvent = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (eventName: string, parameters: Record<string, any> = {}) => {
      if (!canTrack || !window.gtag) return;

      window.gtag("event", eventName, {
        ...parameters,
        user_type: user ? "authenticated" : "anonymous",
        user_role: user?.role || "user",
        timestamp: new Date().toISOString(),
      });
    },
    [canTrack, user]
  );

  // Track user interactions
  const trackSearch = useCallback(
    (query: string, resultsCount: number) => {
      trackEvent("search", {
        search_term: query,
        results_count: resultsCount,
      });
    },
    [trackEvent]
  );

  const trackContentCreation = useCallback(
    (type: "topic" | "post", categoryId?: string) => {
      trackEvent("content_create", {
        content_type: type,
        category_id: categoryId,
      });
    },
    [trackEvent]
  );

  const trackUserAction = useCallback(
    (action: "login" | "register" | "logout") => {
      trackEvent("user_action", {
        action_type: action,
      });
    },
    [trackEvent]
  );

  const trackNavigation = useCallback(
    (fromPath: string, toPath: string, method: "click" | "direct") => {
      trackEvent("navigation", {
        from_path: fromPath,
        to_path: toPath,
        navigation_method: method,
      });
    },
    [trackEvent]
  );

  const trackError = useCallback(
    (error: string, context?: string) => {
      trackEvent("error", {
        error_message: error,
        error_context: context || "unknown",
      });
    },
    [trackEvent]
  );

  const trackPerformance = useCallback(
    (metric: string, value: number, unit: string = "ms") => {
      trackEvent("performance", {
        metric_name: metric,
        metric_value: value,
        metric_unit: unit,
      });
    },
    [trackEvent]
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
