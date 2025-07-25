"use client";

import React from "react";
import * as Sentry from "@sentry/nextjs";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { useIPTrackingAlerts } from "@/hooks/useIPTrackingAlerts";
import { formatDistanceToNow } from "date-fns";

const IPTrackingMonitor = () => {
  const { data: alerts, isLoading, error } = useIPTrackingAlerts();

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="w-5 h-5" />
            IP Tracking Monitor
          </CardTitle>
          <CardDescription>Loading IP tracking status...</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  if (error) {
    Sentry.captureException(error);

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <AlertTriangle className="w-5 h-5" />
            IP Tracking Monitor - Error
          </CardTitle>
          <CardDescription>Failed to load IP tracking data.</CardDescription>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>
              {error instanceof Error
                ? error.message
                : "Unknown error occurred while loading alerts."}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const alertCount = alerts?.length || 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          {alertCount === 0 ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-orange-600" />
          )}
          IP Tracking Monitor
        </CardTitle>
        <CardDescription>
          Monitoring content created without IP addresses since July 14, 2025.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {alertCount === 0 ? (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertTitle>All Good!</AlertTitle>
            <AlertDescription>
              All recent content has proper IP address tracking.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>IP Tracking Issues Detected</AlertTitle>
              <AlertDescription>
                {alertCount} piece{alertCount > 1 ? "s" : ""} of content created
                without IP addresses.
              </AlertDescription>
            </Alert>

            <div className="space-y-2">
              <h4 className="font-medium text-sm">Recent Issues:</h4>
              {alerts?.slice(0, 10).map((alert) => {
                const createdAt = alert.created_at
                  ? new Date(alert.created_at)
                  : new Date();

                return (
                  <div
                    key={alert.id}
                    className="flex items-center justify-between p-3 border rounded-lg bg-muted/50"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            alert.content_type === "topic"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {alert.content_type}
                        </Badge>
                        <span className="font-medium text-sm">
                          {alert.content_title || "Untitled"}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        By: {alert.author_username || "Anonymous"} • Category:{" "}
                        {alert.category_name || "Unknown"} •{" "}
                        {formatDistanceToNow(createdAt, { addSuffix: true })}
                      </div>
                    </div>
                  </div>
                );
              })}

              {alertCount > 10 && (
                <div className="text-xs text-muted-foreground text-center pt-2">
                  And {alertCount - 10} more issue
                  {alertCount - 10 > 1 ? "s" : ""}...
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default IPTrackingMonitor;
