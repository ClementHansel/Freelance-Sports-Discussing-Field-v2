"use client";

import React, { createContext, useContext, ReactNode } from "react";
import { useGoogleAnalytics } from "@/hooks/useGoogleAnalytics";
import { Json } from "@/integrations/supabase/types"; // Assuming Json type is available here or from a common types file

interface AnalyticsContextType {
  trackPageView: (customTitle?: string) => void;
  // Changed 'any' to 'Json' for the parameter values
  trackEvent: (eventName: string, parameters?: Record<string, Json>) => void;

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
  // Explicitly cast the return value of useGoogleAnalytics to AnalyticsContextType.
  // This assumes that the actual return type of useGoogleAnalytics is compatible
  // or can be safely coerced to AnalyticsContextType.
  const analytics: AnalyticsContextType =
    useGoogleAnalytics() as AnalyticsContextType;

  return (
    <AnalyticsContext.Provider value={analytics}>
      {children}
    </AnalyticsContext.Provider>
  );
};
