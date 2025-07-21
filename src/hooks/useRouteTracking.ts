"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useGoogleAnalytics } from "./useGoogleAnalytics";

export const useRouteTracking = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { trackPageView, trackNavigation } = useGoogleAnalytics();

  // Combine pathname and searchParams for the full path
  const currentFullUrl = `${pathname}${
    searchParams.toString() ? `?${searchParams.toString()}` : ""
  }`;
  const previousFullUrl = useRef(currentFullUrl); // Initialize with the current full URL

  useEffect(() => {
    const currentPath = currentFullUrl; // Use the combined full URL
    const previousPath = previousFullUrl.current;

    // Track navigation if path changed
    if (currentPath !== previousPath) {
      trackNavigation(previousPath, currentPath, "click");
    }

    // Track page view with current document title (set by MetadataProvider)
    trackPageView(document.title);

    // Update previous location
    previousFullUrl.current = currentPath;
  }, [currentFullUrl, trackPageView, trackNavigation]); // Depend on currentFullUrl to trigger the effect

  return {
    currentPath: currentFullUrl, // Return the full URL
    previousPath: previousFullUrl.current,
  };
};
