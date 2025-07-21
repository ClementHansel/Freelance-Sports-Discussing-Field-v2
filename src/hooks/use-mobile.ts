"use client";

import * as React from "react";

const MOBILE_BREAKPOINT = 768; // Define your mobile breakpoint

export function useIsMobile() {
  // Initialize isMobile to false for SSR.
  // This prevents window access on the server.
  const [isMobile, setIsMobile] = React.useState<boolean>(false);

  React.useEffect(() => {
    // This effect runs only on the client side, where 'window' is available.
    if (typeof window !== "undefined") {
      const checkIsMobile = () => {
        setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
      };

      // Set initial value
      checkIsMobile();

      // Add event listener for window resize
      window.addEventListener("resize", checkIsMobile);

      // Clean up event listener on component unmount
      return () => {
        window.removeEventListener("resize", checkIsMobile);
      };
    }
  }, []); // Empty dependency array means this runs once on mount and cleans up on unmount

  return isMobile; // Return the boolean state
}
