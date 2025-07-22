"use client";

import React, { ReactNode } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useForumSettings } from "@/hooks/useForumSettings";
import { MaintenanceMode } from "./MaintenanceMode"; // Assuming this path is correct

interface MaintenanceWrapperProps {
  children: ReactNode;
}

export const MaintenanceWrapper: React.FC<MaintenanceWrapperProps> = ({
  children,
}) => {
  // Changed 'isLoading' to 'loading' based on common useAuth patterns.
  // If your useAuth hook truly uses 'isLoading', please provide its definition.
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

  if (isAuthLoading || isSettingsLoading) {
    // Optionally render a loading spinner or skeleton here
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
