"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Wrench } from "lucide-react";

interface MaintenanceModeProps {
  message?: string;
  isAdmin?: boolean;
}

export const MaintenanceMode: React.FC<MaintenanceModeProps> = ({
  message = "We are currently performing scheduled maintenance. Please check back soon!",
  isAdmin = false,
}) => {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6 text-center">
        {isAdmin && (
          <div className="bg-orange-500/10 border border-orange-500/20 rounded-lg p-3 mb-4">
            <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">
              🔧 Admin Mode: Site is in maintenance but you can still access it
            </p>
          </div>
        )}

        <Card className="p-8">
          <div className="space-y-4">
            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
              <Wrench className="w-8 h-8 text-primary" />
            </div>

            <div className="space-y-2">
              <h1 className="text-2xl font-bold text-foreground">
                Under Maintenance
              </h1>
              <p className="text-muted-foreground">{message}</p>
            </div>

            <div className="pt-4">
              <p className="text-sm text-muted-foreground">
                We apologize for any inconvenience and appreciate your patience.
              </p>
            </div>
          </div>
        </Card>

        <p className="text-xs text-muted-foreground">
          For urgent matters, please contact support.
        </p>
      </div>
    </div>
  );
};
