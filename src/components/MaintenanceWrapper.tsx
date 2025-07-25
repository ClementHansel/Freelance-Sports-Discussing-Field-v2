"use client";

import React, { ReactNode, useEffect } from "react";
import * as Sentry from "@sentry/react";
import { useAuth } from "@/hooks/useAuth";
import { useForumSettings } from "@/hooks/useForumSettings";
import { MaintenanceMode } from "./MaintenanceMode";

interface MaintenanceWrapperProps {
  children: ReactNode;
}

export const MaintenanceWrapper: React.FC<MaintenanceWrapperProps> = ({
  children,
}) => {
  const { user, loading: isAuthLoading } = useAuth();
  const {
    settings,
    isLoading: isSettingsLoading,
    getSetting,
  } = useForumSettings();

  const isMaintenanceModeEnabled = getSetting(
    "maintenance_mode",
    false
  ) as boolean;
  const maintenanceMessage = getSetting("maintenance_message", "") as string;
  const isAdmin = user?.role === "admin";
  const showMaintenancePage = isMaintenanceModeEnabled && !isAdmin;

  // ✅ Track Sentry context and flag if maintenance is active
  useEffect(() => {
    Sentry.setTag("page", "maintenance_wrapper");
    Sentry.setContext("auth", {
      userId: user?.id || "guest",
      role: user?.role || "unknown",
    });
    Sentry.setContext("maintenance", {
      enabled: isMaintenanceModeEnabled,
      message: maintenanceMessage,
    });

    if (showMaintenancePage) {
      Sentry.captureMessage("Maintenance mode triggered for user", "info");
    }
  }, [user, isMaintenanceModeEnabled, maintenanceMessage, showMaintenancePage]);

  if (isAuthLoading || isSettingsLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        Loading forum settings...
      </div>
    );
  }

  if (showMaintenancePage) {
    return <MaintenanceMode message={maintenanceMessage} />;
  }

  return <>{children}</>;
};
