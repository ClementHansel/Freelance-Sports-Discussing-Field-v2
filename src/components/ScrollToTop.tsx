"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import * as Sentry from "@sentry/react";

export const ScrollToTop = () => {
  const pathname = usePathname();

  useEffect(() => {
    try {
      Sentry.setTag("page", "scroll_to_top");
      Sentry.addBreadcrumb({
        category: "navigation",
        message: `ScrollToTop triggered on pathname change: ${pathname}`,
        level: "info",
      });

      if (typeof window !== "undefined") {
        window.scrollTo(0, 0);
      }
    } catch (error) {
      Sentry.captureException(error);
      console.error("ScrollToTop error:", error);
    }
  }, [pathname]);

  return null; // This component doesn't render any UI
};
