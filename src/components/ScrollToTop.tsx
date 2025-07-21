"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export const ScrollToTop = () => {
  const pathname = usePathname();

  useEffect(() => {
    // Scroll to the top of the page whenever the pathname changes
    // Guard window access for SSR safety
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, [pathname]); // Depend on pathname to trigger the effect on route changes

  return null; // This component doesn't render any UI
};
