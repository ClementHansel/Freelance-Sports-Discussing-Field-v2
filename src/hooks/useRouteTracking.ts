"use client";

import { useEffect, useRef } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import { useGoogleAnalytics } from "./useGoogleAnalytics";
import { useAuth } from "./useAuth";
import * as Sentry from "@sentry/react";

export const useRouteTracking = () => {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { trackPageView, trackNavigation } = useGoogleAnalytics();
  const { user } = useAuth();

  const currentFullUrl = `${pathname}${
    searchParams.toString() ? `?${searchParams.toString()}` : ""
  }`;

  const previousFullUrl = useRef(currentFullUrl);

  useEffect(() => {
    const currentPath = currentFullUrl;
    const previousPath = previousFullUrl.current;

    if (typeof window !== "undefined" && currentPath !== previousPath) {
      // Google Analytics tracking
      trackNavigation(previousPath, currentPath, "click");
      trackPageView(document.title);

      // Sentry breadcrumb
      Sentry.addBreadcrumb({
        category: "navigation",
        type: "navigation",
        data: {
          from: previousPath,
          to: currentPath,
        },
        message: `Route change: ${previousPath} → ${currentPath}`,
        level: "info",
      });

      // Sentry context
      Sentry.setContext("route", {
        from: previousPath,
        to: currentPath,
      });

      // Sentry user
      if (user?.id) {
        Sentry.setUser({
          id: user.id,
          email: user.email ?? undefined,
        });
      }

      // Update ref
      previousFullUrl.current = currentPath;
    }
  }, [currentFullUrl, trackPageView, trackNavigation, user]);

  return {
    currentPath: currentFullUrl,
    previousPath: previousFullUrl.current,
  };
};
