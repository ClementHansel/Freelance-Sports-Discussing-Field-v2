"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";

interface AnalyticsContextType {
  trackPageView: (customTitle?: string) => void;
  trackEvent: (eventName: string, parameters?: Record<string, any>) => void;

  trackSearch: (query: string, resultsCount: number) => void;
  trackContentCreation: (type: "topic" | "post", categoryId?: string) => void;
  trackUserAction: (action: "login" | "register" | "logout") => void;
  trackNavigation: (
    fromPath: string,
    toPath: string,
    method: "click" | "direct"
  ) => void;
  trackError: (error: string, context?: string) => void;
  trackPerformance: (metric: string, value: number, unit?: string) => void;
  isTrackingEnabled: boolean;
}

const AnalyticsContext = createContext<AnalyticsContextType | null>(null);

export const useAnalytics = () => {
  const context = useContext(AnalyticsContext);
  if (!context) {
    throw new Error("useAnalytics must be used within AnalyticsProvider");
  }
  return context;
};

interface AnalyticsProviderProps {
  children: ReactNode;
}

export const AnalyticsProvider: React.FC<AnalyticsProviderProps> = ({
  children,
}) => {
  const analytics = useGoogleAnalytics();

  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  );
};
