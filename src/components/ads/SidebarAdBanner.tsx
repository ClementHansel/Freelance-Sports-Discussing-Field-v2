"use client";

import React, { useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";

interface SidebarAdBannerProps {
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export const SidebarAdBanner: React.FC<SidebarAdBannerProps> = ({
  className = "",
}) => {
  const isMobile = useIsMobile();

  useEffect(() => {
    try {
      // Initialize AdSense ad
      if (window.adsbygoogle && !isMobile) {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
      }
    } catch (error) {
      console.error("AdSense error:", error);
    }
  }, [isMobile]);

  // Hide on mobile devices
  if (isMobile) {
    return null;
  }

  return (
    <div className={`w-full ${className}`}>
      <div className="w-full">
        <div className="text-center text-xs text-muted-foreground mb-2">
          Advertisement
        </div>
        <ins
          className="adsbygoogle"
          style={{ display: "block", width: "100%", minHeight: "250px" }}
          data-ad-client="ca-pub-5447109336224364"
          data-ad-slot="4012372906"
          data-ad-format="auto"
          data-full-width-responsive="true"
        ></ins>
      </div>
    </div>
  );
};
