"use client";

import React, { useEffect } from "react";
import * as Sentry from "@sentry/react";
import { useIPTracker } from "@/hooks/useIPTracker";

interface IPTrackingWrapperProps {
  children: React.ReactNode;
}

export const IPTrackingWrapper: React.FC<IPTrackingWrapperProps> = ({
  children,
}) => {
  try {
    useIPTracker();
  } catch (error) {
    Sentry.captureException(error);
  }

  useEffect(() => {
    Sentry.setTag("page", "ip_tracking_wrapper");
    Sentry.setContext("ipTracking", {
      wrapperUsed: true,
    });
  }, []);

  return <>{children}</>;
};
