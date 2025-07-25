"use client";

import React, { useState, useEffect } from "react";
import { X } from "lucide-react";
import * as Sentry from "@sentry/react";
import { useForumSettings } from "@/hooks/useForumSettings";
import { Button } from "@/components/ui/button";

export const StickyBanner: React.FC = () => {
  const { getSetting, isLoading } = useForumSettings();
  const [isDismissed, setIsDismissed] = useState(false);

  const isEnabled = getSetting("banner_enabled", false) as boolean;
  const message = getSetting("banner_message", "") as string;
  const style = getSetting("banner_style", "info") as string;
  const isDismissible = getSetting("banner_dismissible", true) as boolean;

  // Add Sentry context + initial state capture
  useEffect(() => {
    Sentry.setTag("component", "sticky_banner");
    Sentry.setContext("bannerSettings", {
      isEnabled,
      message,
      style,
      isDismissible,
    });
  }, [isEnabled, message, style, isDismissible]);

  // Check localStorage for dismissal status
  useEffect(() => {
    try {
      if (typeof window !== "undefined" && message) {
        if (!isDismissible) {
          localStorage.removeItem(`banner-dismissed-${message}`);
          setIsDismissed(false);
        } else {
          const dismissed = localStorage.getItem(`banner-dismissed-${message}`);
          setIsDismissed(dismissed === "true");
        }

        Sentry.addBreadcrumb({
          category: "ui.interaction",
          message: `Banner display check - dismissed=${isDismissed}`,
          level: "info",
        });
      }
    } catch (error) {
      Sentry.captureException(error);
      console.error("StickyBanner localStorage error:", error);
    }
  }, [message, isDismissible]);

  const handleDismiss = () => {
    try {
      setIsDismissed(true);
      if (typeof window !== "undefined" && isDismissible) {
        localStorage.setItem(`banner-dismissed-${message}`, "true");
      }

      Sentry.addBreadcrumb({
        category: "ui.action",
        message: `Banner dismissed: ${message}`,
        level: "info",
      });
    } catch (error) {
      Sentry.captureException(error);
      console.error("StickyBanner dismiss error:", error);
    }
  };

  if (isLoading || !isEnabled || !message || isDismissed) {
    return null;
  }

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
