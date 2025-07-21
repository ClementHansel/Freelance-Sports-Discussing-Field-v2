"use client";

import React from "react";
import { useForumSettings } from "@/hooks/useForumSettings";
import { useAuth } from "@/hooks/useAuth";
import { MaintenanceMode } from "./MaintenanceMode";

interface MaintenanceWrapperProps {
  children: React.ReactNode;
}

export const MaintenanceWrapper: React.FC<MaintenanceWrapperProps> = ({
  children,
}) => {
  const { getSetting, isLoading } = useForumSettings();
  const { isAdmin } = useAuth();

  // Show loading state while settings are being fetched
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isMaintenanceMode = getSetting("maintenance_mode", false);
  const maintenanceMessage = getSetting(
    "maintenance_message",
    "We are currently performing scheduled maintenance. Please check back soon!"
  );

  // If maintenance mode is enabled and user is not an admin, show maintenance page
  if (isMaintenanceMode && !isAdmin) {
    return <MaintenanceMode message={maintenanceMessage} />;
  }

  // If maintenance mode is enabled and user is admin, show normal content with admin indicator
  if (isMaintenanceMode && isAdmin) {
    return <>{children}</>;
  }

  // Normal operation - show regular content
  return <>{children}</>;
};
