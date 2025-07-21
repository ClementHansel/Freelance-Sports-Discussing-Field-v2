"use client";

import React, { useEffect } from "react";
import { useActiveAdSpaces } from "@/hooks/useAdSpaces";
import { useIsMobile } from "@/hooks/use-mobile";
import { useForumSettings } from "@/hooks/useForumSettings";
import DOMPurify from "dompurify";

interface DynamicAdSpaceProps {
  location: string;
  className?: string;
}

declare global {
  interface Window {
    adsbygoogle: any[];
  }
}

export const DynamicAdSpace: React.FC<DynamicAdSpaceProps> = ({
  location,
  className = "",
}) => {
  const isMobile = useIsMobile();
  const { getSetting } = useForumSettings();
  const deviceType = isMobile ? "mobile" : "desktop";

  // Check if advertising is enabled and device-specific settings
  const advertisingEnabled =
    getSetting("advertising_enabled", "true") === "true";
  const desktopEnabled = getSetting("ads_desktop_enabled", "true") === "true";
  const mobileEnabled = getSetting("ads_mobile_enabled", "true") === "true";

  const { data: adSpaces, isLoading } = useActiveAdSpaces(location, deviceType);

  useEffect(() => {
    // Initialize AdSense ads if any exist
    if (adSpaces && adSpaces.length > 0 && window.adsbygoogle) {
      adSpaces.forEach(() => {
        try {
          (window.adsbygoogle = window.adsbygoogle || []).push({});
        } catch (error) {
          console.error("AdSense error:", error);
        }
      });
    }
  }, [adSpaces]);

  // Don't show ads if advertising is disabled globally
  if (!advertisingEnabled) {
    return null;
  }

  // Don't show ads if device-specific setting is disabled
  if ((isMobile && !mobileEnabled) || (!isMobile && !desktopEnabled)) {
    return null;
  }

  if (isLoading || !adSpaces || adSpaces.length === 0) {
    return null;
  }

  return (
    <div className={`dynamic-ad-space ${className}`}>
      {adSpaces.map((adSpace) => (
        <div key={adSpace.id} className="ad-space-item mb-4">
          <div className="text-center text-xs text-muted-foreground mb-2">
            Advertisement
          </div>
          <div
            dangerouslySetInnerHTML={{
              __html: DOMPurify.sanitize(adSpace.ad_code || "", {
                ALLOWED_TAGS: ["script", "ins", "div", "span"],
                ALLOWED_ATTR: [
                  "class",
                  "style",
                  "data-ad-client",
                  "data-ad-slot",
                  "data-ad-format",
                  "data-full-width-responsive",
                  "async",
                  "crossorigin",
                  "src",
                ],
                ALLOW_DATA_ATTR: true,
                ALLOW_UNKNOWN_PROTOCOLS: false,
              }),
            }}
          />
        </div>
      ))}
    </div>
  );
};
