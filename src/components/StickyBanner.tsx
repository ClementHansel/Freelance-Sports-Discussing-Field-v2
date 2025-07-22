"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import { useForumSettings } from "@/hooks/useForumSettings";
import { Button } from "@/components/ui/button";

export const StickyBanner: React.FC = () => {
  const { getSetting, isLoading } = useForumSettings();
  const [isDismissed, setIsDismissed] = useState(false);

  const isEnabled = getSetting("banner_enabled", false) as boolean; // Explicitly cast boolean settings
  const message = getSetting("banner_message", "") as string; // Explicitly cast message to string
  const style = getSetting("banner_style", "info") as string; // Explicitly cast style to string
  const isDismissible = getSetting("banner_dismissible", true) as boolean; // Explicitly cast boolean settings

  console.log("StickyBanner values:", {
    isEnabled,
    message,
    style,
    isDismissible,
    messageLength: message.length, // Now safe
    messageType: typeof message,
  });

  // Check localStorage for dismissal status
  useEffect(() => {
    // Guard localStorage access for SSR safety
    if (typeof window !== "undefined" && message) {
      // If banner is not dismissible, clear any existing dismissal
      if (!isDismissible) {
        localStorage.removeItem(`banner-dismissed-${message}`);
        setIsDismissed(false);
        console.log("Banner is not dismissible, cleared localStorage");
      } else {
        const dismissed = localStorage.getItem(`banner-dismissed-${message}`);
        setIsDismissed(dismissed === "true");
        console.log("Banner dismissal check:", {
          message,
          dismissed,
          isDismissed: dismissed === "true",
        });
      }
    }
  }, [message, isDismissible]);

  const handleDismiss = () => {
    setIsDismissed(true);
    // Guard localStorage access for SSR safety
    if (typeof window !== "undefined" && isDismissible) {
      localStorage.setItem(`banner-dismissed-${message}`, "true");
    }
  };

  // Don't render if loading, not enabled, or dismissed
  console.log("Banner render check:", {
    isLoading,
    isEnabled,
    hasMessage: !!message,
    message: message.substring(0, 50) + "...", // Now safe
    isDismissed,
    style,
  });

  if (isLoading || !isEnabled || !message || isDismissed) {
    console.log("Banner not showing because:", {
      isLoading,
      isEnabled,
      hasMessage: !!message,
      isDismissed,
    });
    return null;
  }

  console.log("Banner should be rendering now!");

  const getStyleClasses = () => {
    switch (style) {
      case "warning":
        return "bg-yellow-500/10 border-yellow-500/20 text-yellow-800 dark:text-yellow-200";
      case "success":
        return "bg-green-500/10 border-green-500/20 text-green-800 dark:text-green-200";
      case "error":
        return "bg-red-500/10 border-red-500/20 text-red-800 dark:text-red-200";
      case "announcement":
        return "bg-purple-500/10 border-purple-500/20 text-purple-800 dark:text-purple-200";
      default: // info
        return "bg-blue-500/10 border-blue-500/20 text-blue-800 dark:text-blue-200";
    }
  };

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[100] border-b transition-all duration-300 ${getStyleClasses()}`}
      style={{ position: "fixed", top: 0, left: 0, right: 0, zIndex: 9999 }}
    >
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex-1 text-sm font-medium text-center md:text-left">
            {message}
          </div>
          {isDismissible && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDismiss}
              className="flex-shrink-0 h-6 w-6 p-0 hover:bg-black/10 dark:hover:bg-white/10"
              aria-label="Dismiss banner"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
