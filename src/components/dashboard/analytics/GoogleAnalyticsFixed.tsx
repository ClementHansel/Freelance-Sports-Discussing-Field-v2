import { useEffect } from "react";
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

export const GoogleAnalyticsFixed = () => {
  const { getSetting } = useForumSettings();
  const { hasConsent } = useCookieConsent();
  const trackingId = getSetting("google_analytics_id", "");
  const canLoadAnalytics = hasConsent("analytics");

  useEffect(() => {
    console.log("GA Debug:", {
      trackingId,
      canLoadAnalytics,
      hasTracking: !!trackingId,
    });

    if (!trackingId || !canLoadAnalytics) {
      console.log("GA: Not loading - missing tracking ID or consent");
      return;
    }

    console.log("GA: Loading Google Analytics with ID:", trackingId);

    // Initialize dataLayer first
    window.dataLayer = window.dataLayer || [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function gtag(...args: any[]) {
      window.dataLayer?.push(args);
    }
    window.gtag = gtag;

    // Load the GA script
    const script = document.createElement("script");
    script.async = true;
    script.src = `https://www.googletagmanager.com/gtag/js?id=${trackingId}`;
    script.onload = () => {
      console.log("GA: Script loaded successfully");

      gtag("js", new Date());
      gtag("config", trackingId, {
        send_page_view: true,
        debug_mode: true, // Enable for debugging
      });

      console.log("GA: Configured and ready");
    };
    script.onerror = () => {
      console.error("GA: Failed to load script");
    };

    document.head.appendChild(script);

    return () => {
      // Clean up on unmount
      const existingScript = document.querySelector(
        `script[src*="googletagmanager.com/gtag/js?id=${trackingId}"]`
      );
      if (existingScript) {
        existingScript.remove();
      }
    };
  }, [trackingId, canLoadAnalytics]);

  return null;
};
